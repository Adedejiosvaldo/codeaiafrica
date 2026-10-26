import csv
import io
import secrets
from collections import Counter
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from typing import Literal

from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from .. import course, scoring
from ..models import AdminUser, AIUsage, Application, AuditLog, Learner, QuizAttempt, Settings, Submission, WaitlistEntry, now
from ..schemas import ApplicationPatch, LoginIn, SelectionIn, SettingsIn
from ..ratelimit import limit
from ..security import COOKIE, audit, get_db, hash_password, make_session, require_admin, require_full_admin, verify_password

router = APIRouter(prefix="/api/admin", tags=["admin"])
auth = APIRouter(prefix="/api/admin", tags=["admin"])  # routes that don't need a session


# --------------------------------------------------------------------------- sign in

@auth.post("/login", dependencies=[Depends(limit("login", 10, 900, "Too many sign-in attempts. Please wait and try again."))])
def login(body: LoginIn, request: Request, response: Response, db: Session = Depends(get_db)):
    admin = db.scalar(select(AdminUser).where(func.lower(AdminUser.email) == body.email.lower()))
    if admin is None or not verify_password(body.password, admin.password_hash):
        raise HTTPException(401, "That email and password don't match.")
    cfg = request.app.state.config
    response.set_cookie(COOKIE, make_session(request, admin.id), httponly=True, samesite="lax",
                        secure=cfg.secure_cookies, max_age=cfg.session_days * 86400, path="/")
    audit(db, admin, "signed in")
    db.commit()
    return {"email": admin.email, "name": admin.name, "role": admin.role}


@auth.post("/logout")
def logout(response: Response):
    response.delete_cookie(COOKIE, path="/")
    return {"message": "Signed out."}


@router.get("/me")
def me(admin: AdminUser = Depends(require_admin)):
    return {"email": admin.email, "name": admin.name, "role": admin.role}


class PasswordIn(BaseModel):
    current: str
    new: str = Field(min_length=10, max_length=200)


@router.post("/password")
def change_password(body: PasswordIn, admin: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    if not verify_password(body.current, admin.password_hash):
        raise HTTPException(400, "Your current password isn't right.")
    admin.password_hash = hash_password(body.new)
    db.commit()
    return {"message": "Password changed."}


class AdminIn(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    name: str = Field("", max_length=120)
    password: str = Field(min_length=10, max_length=200)
    role: Literal["admin", "ta"] = "ta"


class RoleIn(BaseModel):
    role: Literal["admin", "ta"]


@router.get("/team")
def team(admin: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    return [{"id": a.id, "email": a.email, "name": a.name, "role": a.role, "created_at": a.created_at}
            for a in db.scalars(select(AdminUser).order_by(AdminUser.id))]


@router.post("/team", status_code=201)
def add_team_member(body: AdminIn, admin: AdminUser = Depends(require_full_admin), db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    if db.scalar(select(AdminUser).where(func.lower(AdminUser.email) == email)):
        raise HTTPException(409, "That person already has an account.")
    db.add(AdminUser(email=email, name=body.name.strip(), password_hash=hash_password(body.password), role=body.role))
    audit(db, admin, "added team member", f"{email} as {body.role}")
    db.commit()
    return {"message": f"Added {email}. Send them the password privately."}


@router.patch("/team/{member_id}")
def change_role(member_id: int, body: RoleIn, admin: AdminUser = Depends(require_full_admin), db: Session = Depends(get_db)):
    member = db.get(AdminUser, member_id)
    if member is None:
        raise HTTPException(404, "No team member with that number.")
    if member.id == admin.id and body.role != "admin":
        raise HTTPException(400, "You can't remove your own admin role. Ask another admin.")
    member.role = body.role
    audit(db, admin, "changed role", f"{member.email} to {body.role}")
    db.commit()
    return {"message": f"{member.email} is now {'an admin' if body.role == 'admin' else 'a TA'}."}


@router.delete("/team/{member_id}")
def remove_member(member_id: int, admin: AdminUser = Depends(require_full_admin), db: Session = Depends(get_db)):
    member = db.get(AdminUser, member_id)
    if member is None:
        raise HTTPException(404, "No team member with that number.")
    if member.id == admin.id:
        raise HTTPException(400, "You can't remove yourself.")
    audit(db, admin, "removed team member", member.email)
    db.delete(member)
    db.commit()
    return {"message": f"Removed {member.email}."}


@router.get("/audit")
def audit_log(admin: AdminUser = Depends(require_full_admin), db: Session = Depends(get_db)):
    rows = db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(300))
    return [{"id": r.id, "who": r.admin_email, "action": r.action, "detail": r.detail, "at": r.created_at} for r in rows]


# --------------------------------------------------------------------------- helpers

def get_settings(db):
    return db.scalar(select(Settings))


def app_out(a, full=False):
    out = {
        "id": a.id, "created_at": a.created_at, "name": a.name, "email": a.email, "city": a.city,
        "country": a.country, "occupation": a.occupation, "device": a.device, "live_sessions": a.live_sessions,
        "lab_hours": a.lab_hours, "coded_before": a.coded_before, "q9_score": a.q9_score, "status": a.status,
        "eligible": scoring.eligible(a), "auto_score": scoring.auto_score(a), "total_score": scoring.total_score(a),
        "problem": a.problem,
    }
    if full:
        out.update({
            "whatsapp": a.whatsapp, "is_adult": a.is_adult, "commits": a.commits,
            "reviewer_note": a.reviewer_note, "reviewed_at": a.reviewed_at,
            "breakdown": scoring.breakdown(a),
            "learner_token": a.learner.token if a.learner else None,
        })
    return out


def has_activity(learner):
    return bool(learner and (learner.submissions or learner.quiz_attempts))


def set_status(db, app, status):
    """Change an application's status, creating or removing its learner record."""
    if status == app.status:
        return
    if status == "accepted":
        if not scoring.eligible(app):
            raise HTTPException(409, f"{app.name} said no to being 18+ or to the lab commitment, so can't be accepted.")
        if app.learner is None:
            db.add(Learner(application=app, name=app.name, email=app.email, token=secrets.token_urlsafe(18)))
    elif app.learner is not None:
        if has_activity(app.learner):
            raise HTTPException(409, f"{app.name} has already started the course, so stays accepted.")
        db.delete(app.learner)
        app.learner = None
    app.status = status


# --------------------------------------------------------------------------- overview

@router.get("/stats")
def stats(admin: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    s = get_settings(db)
    apps = db.scalars(select(Application)).all()
    status = Counter(a.status for a in apps)
    eligible = [a for a in apps if scoring.eligible(a)]
    unscored = sum(1 for a in eligible if a.q9_score is None and a.status == "pending")

    today = now().date()
    days = [today - timedelta(days=i) for i in range(29, -1, -1)]
    per_day = Counter(a.created_at.date() for a in apps)
    learners = db.scalars(select(Learner).options(selectinload(Learner.submissions))).all()
    per_week = Counter(sub.week for l in learners for sub in l.submissions)
    quiz = db.scalars(select(QuizAttempt)).all()

    def avg(values):
        values = list(values)
        return round(sum(values) / len(values), 1) if values else None

    def phase(p):
        rows = [q for q in quiz if q.phase == p]
        return {
            "count": len(rows),
            "average": avg(q.score for q in rows),
            "confidence": [avg(q.confidence[i] for q in rows) for i in range(len(course.CONFIDENCE))],
        }

    return {
        "cohort_name": s.cohort_name,
        "applications_open": s.applications_open,
        "cap": s.cap,
        "applications": {
            "total": len(apps), "eligible": len(eligible), "unscored": unscored,
            "by_status": {k: status.get(k, 0) for k in ["pending", "accepted", "waitlisted", "rejected"]},
            "by_device": Counter(a.device for a in apps),
            "by_occupation": Counter(a.occupation for a in apps),
            "never_coded": sum(1 for a in apps if a.coded_before == "never"),
            "per_day": [{"date": d.isoformat(), "count": per_day.get(d, 0)} for d in days],
        },
        "waitlist": db.scalar(select(func.count(WaitlistEntry.id))),
        "learners": {
            "total": len(learners),
            "labs_required": s.labs_required,
            "submissions_per_week": [{"week": w["week"], "count": per_week.get(w["week"], 0)} for w in course.WEEKS],
        },
        "quiz": {"pre": phase("pre"), "post": phase("post"), "confidence_labels": course.CONFIDENCE,
                 "out_of": len(course.QUIZ) * course.POINTS_PER_QUESTION},
    }


# --------------------------------------------------------------------------- applications

@router.get("/applications")
def list_applications(status: str | None = None, q: str | None = None,
                      admin: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    query = select(Application).order_by(Application.created_at.desc())
    if status:
        query = query.where(Application.status == status)
    if q:
        like = f"%{q.strip()}%"
        query = query.where(or_(Application.name.ilike(like), Application.email.ilike(like),
                                Application.city.ilike(like), Application.problem.ilike(like)))
    return [app_out(a) for a in db.scalars(query)]


def load_app(db, app_id):
    app = db.scalar(select(Application).where(Application.id == app_id)
                    .options(selectinload(Application.learner).selectinload(Learner.submissions),
                             selectinload(Application.learner).selectinload(Learner.quiz_attempts)))
    if app is None:
        raise HTTPException(404, "No application with that number.")
    return app


@router.get("/applications/{app_id}")
def get_application(app_id: int, admin: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    return app_out(load_app(db, app_id), full=True)


@router.patch("/applications/{app_id}")
def update_application(app_id: int, body: ApplicationPatch, admin: AdminUser = Depends(require_admin),
                       db: Session = Depends(get_db)):
    app = load_app(db, app_id)
    if body.status is not None and body.status != app.status and admin.role != "admin":
        raise HTTPException(403, "Only an admin can change a decision. You can score and add notes.")
    if body.clear_q9:
        app.q9_score = None
    elif body.q9_score is not None:
        app.q9_score = body.q9_score
        app.reviewed_at = now()
        audit(db, admin, "scored problem answer", f"#{app.id} {app.name}: {body.q9_score}")
    if body.reviewer_note is not None:
        app.reviewer_note = body.reviewer_note
    if body.status is not None and body.status != app.status:
        set_status(db, app, body.status)
        audit(db, admin, "changed decision", f"#{app.id} {app.name}: {body.status}")
    db.commit()
    return app_out(load_app(db, app_id), full=True)


@router.delete("/applications/{app_id}")
def delete_application(app_id: int, admin: AdminUser = Depends(require_full_admin), db: Session = Depends(get_db)):
    """Erase a person's application and, if they were accepted, all their course data (a data-deletion request)."""
    app = load_app(db, app_id)
    if app.learner is not None:
        db.delete(app.learner)
    audit(db, admin, "deleted application", f"#{app.id} (personal data erased)")
    db.delete(app)
    db.commit()
    return {"message": "Deleted, including any course progress."}


# --------------------------------------------------------------------------- selection

def plan_selection(db, include_unscored):
    s = get_settings(db)
    apps = db.scalars(select(Application).options(
        selectinload(Application.learner).selectinload(Learner.submissions),
        selectinload(Application.learner).selectinload(Learner.quiz_attempts))).all()
    # Keep people who have started, or were accepted by hand before scoring. They use up places.
    locked = [a for a in apps if a.status == "accepted" and (has_activity(a.learner) or a.q9_score is None)]
    held = [a for a in apps if a not in locked and a.q9_score is None and not include_unscored
            and scoring.eligible(a)]
    pool = [a for a in apps if a not in locked and a not in held]
    locked.sort(key=lambda a: -scoring.total_score(a))
    plan = [(a, "accepted", "Already started the course" if has_activity(a.learner) else "Accepted by hand")
            for a in locked]
    ranked = scoring.rank(pool, max(0, s.cap - len(locked)), s.waitlist_size)
    for a, decision in ranked:
        reason = "" if scoring.eligible(a) else "Said no to 18+ or to the lab commitment"
        plan.append((a, decision, reason))
    plan += [(a, "pending", "Problem answer not scored yet") for a in held]
    return plan


def plan_out(plan, s):
    rows = [{**app_out(a), "decision": d, "reason": r, "changes": d != a.status} for a, d, r in plan]
    counts = Counter(r["decision"] for r in rows)
    return {"cap": s.cap, "waitlist_size": s.waitlist_size, "rows": rows,
            "counts": {k: counts.get(k, 0) for k in ["accepted", "waitlisted", "rejected", "pending"]},
            "changes": sum(r["changes"] for r in rows)}


@router.post("/selection/preview")
def selection_preview(body: SelectionIn, admin: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    return plan_out(plan_selection(db, body.include_unscored), get_settings(db))


@router.post("/selection/apply")
def selection_apply(body: SelectionIn, admin: AdminUser = Depends(require_full_admin), db: Session = Depends(get_db)):
    plan = plan_selection(db, body.include_unscored)
    # Remove places first, so accepting never collides with a learner record being removed
    changes = 0
    for app, decision, _ in sorted(plan, key=lambda p: p[1] == "accepted"):
        changes += app.status != decision
        set_status(db, app, decision)
    audit(db, admin, "ran selection", f"{changes} decisions changed")
    db.commit()
    return plan_out(plan_selection(db, body.include_unscored), get_settings(db))


# --------------------------------------------------------------------------- learners

def learner_out(l, s):
    weeks = sorted(sub.week for sub in l.submissions)
    quiz = {q.phase: q.score for q in l.quiz_attempts}
    return {"id": l.id, "application_id": l.application_id, "name": l.name, "email": l.email, "token": l.token,
            "whatsapp": l.application.whatsapp if l.application else "",
            "weeks_done": weeks, "labs_done": len(weeks), "labs_required": s.labs_required,
            "pre_score": quiz.get("pre"), "post_score": quiz.get("post"),
            "capstone": l.capstone.title if l.capstone else None, "attended": len(l.attendance),
            "last_activity": max((sub.created_at for sub in l.submissions), default=None)}


def all_learners(db):
    return db.scalars(select(Learner).order_by(Learner.name).options(
        selectinload(Learner.submissions), selectinload(Learner.quiz_attempts),
        selectinload(Learner.application), selectinload(Learner.capstone), selectinload(Learner.attendance))).all()


@router.get("/learners")
def list_learners(admin: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    s = get_settings(db)
    return {"weeks": [{"week": w["week"], "title": w["title"]} for w in course.WEEKS],
            "learners": [learner_out(l, s) for l in all_learners(db)]}


@router.post("/learners/{learner_id}/reset-link")
def reset_link(learner_id: int, admin: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    learner = db.get(Learner, learner_id)
    if learner is None:
        raise HTTPException(404, "No learner with that number.")
    learner.token = secrets.token_urlsafe(18)
    audit(db, admin, "made a new learner link", learner.email)
    db.commit()
    return {"token": learner.token}


# --------------------------------------------------------------------------- waitlist

@router.get("/waitlist")
def list_waitlist(admin: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    return [{"id": w.id, "email": w.email, "name": w.name, "created_at": w.created_at}
            for w in db.scalars(select(WaitlistEntry).order_by(WaitlistEntry.created_at.desc()))]


@router.delete("/waitlist/{entry_id}")
def delete_waitlist(entry_id: int, admin: AdminUser = Depends(require_full_admin), db: Session = Depends(get_db)):
    entry = db.get(WaitlistEntry, entry_id)
    if entry:
        audit(db, admin, "removed from waitlist", entry.email)
        db.delete(entry)
        db.commit()
    return {"message": "Removed."}


# --------------------------------------------------------------------------- settings

def settings_out(s):
    return {k: getattr(s, k) for k in SettingsIn.model_fields}


@router.get("/settings")
def read_settings(admin: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    return settings_out(get_settings(db))


@router.put("/settings")
def write_settings(body: SettingsIn, admin: AdminUser = Depends(require_full_admin), db: Session = Depends(get_db)):
    s = get_settings(db)
    changed = [k for k, v in body.model_dump().items() if getattr(s, k) != v]
    for k, v in body.model_dump().items():
        setattr(s, k, v)
    if changed:
        audit(db, admin, "changed settings", ", ".join(changed))
    db.commit()
    return settings_out(s)


# --------------------------------------------------------------------------- exports

def csv_response(name, header, rows, db=None, admin=None):
    if db is not None and admin is not None:
        audit(db, admin, "exported", name)
        db.commit()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(header)
    writer.writerows(rows)
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv",
                             headers={"Content-Disposition": f'attachment; filename="{name}"'})


@router.get("/export/applications.csv")
def export_applications(admin: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    apps = db.scalars(select(Application).order_by(Application.created_at)).all()
    header = ["id", "submitted", "name", "email", "whatsapp", "18+", "city", "country", "describes", "device",
              "live sessions", "lab hours", "coded before", "problem", "commits", "problem score", "total score",
              "status", "reviewer note"]
    rows = [[a.id, a.created_at.isoformat(), a.name, a.email, a.whatsapp, a.is_adult, a.city, a.country,
             scoring.OCCUPATIONS[a.occupation], scoring.DEVICES[a.device], scoring.LIVE[a.live_sessions],
             scoring.HOURS[a.lab_hours], scoring.CODED[a.coded_before], a.problem, a.commits,
             "" if a.q9_score is None else a.q9_score, scoring.total_score(a), a.status, a.reviewer_note]
            for a in apps]
    return csv_response("applications.csv", header, rows, db, admin)


@router.get("/export/learners.csv")
def export_learners(request: Request, admin: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    s = get_settings(db)
    base = request.app.state.config.public_url.rstrip("/")
    header = ["name", "email", "whatsapp", "link", "labs done", "weeks done", "pre-quiz", "post-quiz"]
    rows = []
    for l in all_learners(db):
        o = learner_out(l, s)
        rows.append([o["name"], o["email"], o["whatsapp"], f"{base}/learn/{o['token']}", o["labs_done"],
                     " ".join(map(str, o["weeks_done"])), o["pre_score"] if o["pre_score"] is not None else "",
                     o["post_score"] if o["post_score"] is not None else ""])
    return csv_response("learners.csv", header, rows, db, admin)


@router.get("/export/waitlist.csv")
def export_waitlist(admin: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    rows = [[w.email, w.name, w.created_at.isoformat()]
            for w in db.scalars(select(WaitlistEntry).order_by(WaitlistEntry.created_at))]
    return csv_response("waitlist.csv", ["email", "name", "joined"], rows, db, admin)


# --------------------------------------------------------------------------- AI usage

@router.get("/ai-usage")
def ai_usage(request: Request, admin: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    from .ai import today
    cfg = request.app.state.config
    day = today()
    rows = db.execute(select(AIUsage.day, func.count(AIUsage.id), func.sum(AIUsage.tokens_in), func.sum(AIUsage.tokens_out))
                      .where(AIUsage.kind.in_(("chat", "embed"))).group_by(AIUsage.day).order_by(AIUsage.day.desc()).limit(14)).all()
    per_day = [{"day": d, "calls": n, "tokens": (ti or 0) + (to or 0)} for d, n, ti, to in reversed(rows)]
    learners = db.execute(select(Learner.name, func.count(AIUsage.id)).join(AIUsage, AIUsage.learner_id == Learner.id)
                          .where(AIUsage.day == day, AIUsage.kind.in_(("chat", "embed")))
                          .group_by(Learner.id).order_by(func.count(AIUsage.id).desc()).limit(50)).all()
    errors = db.scalar(select(func.count(AIUsage.id)).where(AIUsage.day == day, AIUsage.ok.is_(False))) or 0
    chunks = db.scalar(select(func.count(AIUsage.id)).where(AIUsage.day == day, AIUsage.kind == "chunk")) or 0
    today_row = next((r for r in per_day if r["day"] == day), {"calls": 0, "tokens": 0})
    return {
        "today": {"day": day, "calls": today_row["calls"], "tokens": today_row["tokens"], "errors": errors, "chunks": chunks},
        "limits": {"per_learner": cfg.ai_daily_limit, "budget": cfg.ai_daily_budget, "max_tokens": cfg.ai_max_tokens},
        "configured": {"chat": bool(cfg.ai_api_key), "embeddings": bool(cfg.embed_base_url and cfg.embed_model),
                       "chunker": bool(cfg.chunker_url)},
        "models": cfg.ai_models, "per_day": per_day,
        "learners": [{"name": n, "calls": c} for n, c in learners],
    }
