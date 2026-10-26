"""Emails and announcements from the team."""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from .. import mailer
from ..models import AdminUser, Announcement, Application, Learner, Settings, WaitlistEntry
from ..ratelimit import limit
from ..security import audit, get_db, require_admin, require_full_admin

router = APIRouter(prefix="/api/admin", tags=["messages"])
public = APIRouter(prefix="/api", tags=["public"])


def need_email(request):
    if not request.app.state.mailer.enabled:
        raise HTTPException(503, "Email isn't set up on this server. Add the SMTP settings to .env (see the deploy guide).")


def pending_decisions(db):
    apps = db.scalars(select(Application).options(selectinload(Application.learner))
                      .where(Application.status != "pending", Application.status != Application.notified_status)).all()
    return apps


def decision_message(cfg, app, cohort):
    if app.status == "accepted" and app.learner:
        return mailer.accepted(cfg, app.name, app.learner.token, cohort)
    if app.status == "waitlisted":
        return mailer.waitlisted(app.name, cohort)
    return mailer.not_accepted(app.name, cohort)


@router.get("/messages/status")
def status(request: Request, admin: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    return {
        "email_enabled": request.app.state.mailer.enabled,
        "pending_decisions": len(pending_decisions(db)),
        "learners": db.scalar(select(func.count(Learner.id))),
        "waitlist": db.scalar(select(func.count(WaitlistEntry.id))),
    }


@router.post("/messages/decisions")
def send_decisions(request: Request, tasks: BackgroundTasks, admin: AdminUser = Depends(require_full_admin),
                   db: Session = Depends(get_db)):
    need_email(request)
    cfg, cohort = request.app.state.config, db.scalar(select(Settings)).cohort_name
    apps = pending_decisions(db)
    messages = [(a.email, *decision_message(cfg, a, cohort)) for a in apps]
    for a in apps:
        a.notified_status = a.status
    audit(db, admin, "queued decision emails", f"{len(messages)} applicants")
    db.commit()
    tasks.add_task(mailer.send_many, request.app, messages, admin.email)
    return {"message": f"Sending {len(messages)} decision email{'s' if len(messages) != 1 else ''}.", "count": len(messages)}


class LinksIn(BaseModel):
    learner_id: int | None = None


@router.post("/messages/learner-links")
def send_links(body: LinksIn, request: Request, tasks: BackgroundTasks, admin: AdminUser = Depends(require_full_admin),
               db: Session = Depends(get_db)):
    need_email(request)
    cfg, cohort = request.app.state.config, db.scalar(select(Settings)).cohort_name
    q = select(Learner)
    if body.learner_id:
        q = q.where(Learner.id == body.learner_id)
    learners = db.scalars(q).all()
    if not learners:
        raise HTTPException(404, "No learners to email.")
    messages = [(l.email, *mailer.accepted(cfg, l.name, l.token, cohort)) for l in learners]
    audit(db, admin, "queued learner link emails", f"{len(messages)} learners")
    db.commit()
    tasks.add_task(mailer.send_many, request.app, messages, admin.email)
    return {"message": f"Sending {len(messages)} learner link email{'s' if len(messages) != 1 else ''}.", "count": len(messages)}


class WaitlistIn(BaseModel):
    extra: str = Field("", max_length=2000)


@router.post("/messages/waitlist")
def notify_waitlist(body: WaitlistIn, request: Request, tasks: BackgroundTasks,
                    admin: AdminUser = Depends(require_full_admin), db: Session = Depends(get_db)):
    need_email(request)
    s = db.scalar(select(Settings))
    if not s.applications_open:
        raise HTTPException(400, "Open applications in Settings first, so the link in the email works.")
    cfg = request.app.state.config
    emails = db.scalars(select(WaitlistEntry.email)).all()
    subject, text = mailer.applications_open(cfg, s.cohort_name, s.applications_close, body.extra.strip())
    messages = [(e, subject, text) for e in emails]
    audit(db, admin, "queued waitlist emails", f"{len(messages)} people")
    db.commit()
    tasks.add_task(mailer.send_many, request.app, messages, admin.email)
    return {"message": f"Sending to {len(messages)} people on the waitlist.", "count": len(messages)}


# --------------------------------------------------------------------------- announcements

class AnnouncementIn(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    body: str = Field(min_length=2, max_length=4000)
    email: bool = False


def announcement_out(a):
    return {"id": a.id, "title": a.title, "body": a.body, "author": a.author, "created_at": a.created_at}


@router.get("/announcements")
def list_announcements(admin: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    return [announcement_out(a) for a in db.scalars(select(Announcement).order_by(Announcement.created_at.desc()))]


@router.post("/announcements", status_code=201)
def post_announcement(body: AnnouncementIn, request: Request, tasks: BackgroundTasks,
                      admin: AdminUser = Depends(require_full_admin), db: Session = Depends(get_db)):
    if body.email:
        need_email(request)
    a = Announcement(title=body.title.strip(), body=body.body.strip(), author=admin.name or admin.email)
    db.add(a)
    audit(db, admin, "posted announcement", body.title)
    db.commit()
    message = "Posted to every learner's dashboard."
    if body.email:
        emails = db.scalars(select(Learner.email)).all()
        subject, text = mailer.announcement(a.title, a.body)
        tasks.add_task(mailer.send_many, request.app, [(e, subject, text) for e in emails], admin.email)
        message += f" Emailing {len(emails)} learners."
    return {"message": message, "announcement": announcement_out(a)}


@router.delete("/announcements/{announcement_id}")
def delete_announcement(announcement_id: int, admin: AdminUser = Depends(require_full_admin), db: Session = Depends(get_db)):
    a = db.get(Announcement, announcement_id)
    if a:
        audit(db, admin, "deleted announcement", a.title)
        db.delete(a)
        db.commit()
    return {"message": "Deleted."}


# --------------------------------------------------------------------------- find my link (public)

class FindIn(BaseModel):
    email: EmailStr


GENERIC = "If that email is on our records, we've sent a message to it. Check your inbox (and spam folder) in a few minutes."


@public.post("/find-my-link", dependencies=[Depends(limit("find", 5, 3600))])
def find_my_link(body: FindIn, request: Request, tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Emails a learner their dashboard link, or an applicant their status. Same reply either way, so it
    can't be used to find out who applied."""
    if not request.app.state.mailer.enabled:
        raise HTTPException(503, "We can't send emails right now. Message a teaching assistant on WhatsApp for your link.")
    email = body.email.lower()
    cfg, cohort = request.app.state.config, db.scalar(select(Settings)).cohort_name
    learner = db.scalar(select(Learner).where(func.lower(Learner.email) == email))
    app = db.scalar(select(Application).options(selectinload(Application.learner))
                    .where(func.lower(Application.email) == email))
    if learner:
        msg = mailer.accepted(cfg, learner.name, learner.token, cohort)
    elif app and app.status == "pending":
        msg = mailer.still_reviewing(app.name)
    elif app:
        msg = decision_message(cfg, app, cohort)
    else:
        msg = None
    if msg:
        tasks.add_task(mailer.send_many, request.app, [(email, *msg)])
    return {"message": GENERIC}
