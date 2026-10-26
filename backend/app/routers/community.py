"""Reflections, capstones, attendance, certificates and demo day."""
import secrets
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from .. import course
from ..models import (AdminUser, Attendance, Capstone, DemoRegistration, Learner, Reflection, Settings,
                      Submission, now)
from ..ratelimit import limit
from ..security import audit, get_db, require_admin
from .learner import get_learner

learner_router = APIRouter(prefix="/api/learner", tags=["learner"])
public = APIRouter(prefix="/api", tags=["public"])
admin_router = APIRouter(prefix="/api/admin", tags=["admin"])

BRIEFS = {
    "pidgin-sentiment": "Pidgin sentiment checker",
    "market-price-agent": "Market price agent",
    "ask-the-law": "Ask-the-law bot",
    "bank-alert-parser": "Bank alert parser",
    "own": "My own idea",
}


# --------------------------------------------------------------------------- learner side

class ReflectionIn(BaseModel):
    text: str = Field(min_length=20, max_length=3000)


@learner_router.put("/{token}/reflections/{week}")
def save_reflection(week: int, body: ReflectionIn, learner: Learner = Depends(get_learner), db: Session = Depends(get_db)):
    if week not in course.WEEK_BY_NUMBER:
        raise HTTPException(404, "There's no such week.")
    r = db.scalar(select(Reflection).where(Reflection.learner_id == learner.id, Reflection.week == week))
    if r:
        r.text, r.updated_at = body.text.strip(), now()
    else:
        db.add(Reflection(learner_id=learner.id, week=week, text=body.text.strip()))
    db.commit()
    return {"message": "Reflection saved. A teaching assistant will reply here."}


class CapstoneIn(BaseModel):
    brief: Literal["pidgin-sentiment", "market-price-agent", "ask-the-law", "bank-alert-parser", "own"]
    title: str = Field(min_length=3, max_length=120)
    description: str = Field(min_length=20, max_length=1500)
    public: bool = False


@learner_router.put("/{token}/capstone")
def save_capstone(body: CapstoneIn, learner: Learner = Depends(get_learner), db: Session = Depends(get_db)):
    c = learner.capstone
    data = body.model_dump()
    data["title"], data["description"] = data["title"].strip(), data["description"].strip()
    if c:
        for k, v in data.items():
            setattr(c, k, v)
        c.updated_at = now()
    else:
        db.add(Capstone(learner_id=learner.id, **data))
    db.commit()
    return {"message": "Capstone saved."}


def eligible(learner, s):
    return len(learner.submissions) >= s.labs_required


@learner_router.get("/{token}/certificate")
def certificate(request: Request, learner: Learner = Depends(get_learner), db: Session = Depends(get_db)):
    s = db.scalar(select(Settings))
    done = len(learner.submissions)
    base = {"name": learner.name, "cohort": s.cohort_name, "labs_done": done, "labs_required": s.labs_required}
    if not eligible(learner, s):
        return {**base, "available": False, "reason": f"Complete {s.labs_required - done} more lab{'s' if s.labs_required - done != 1 else ''} to earn your certificate."}
    if not s.certificates_open:
        return {**base, "available": False, "reason": "You've earned it! Certificates are issued at demo day."}
    if not learner.certificate_code:
        learner.certificate_code = "AKL-" + "-".join(secrets.token_hex(2).upper() for _ in range(2))
        learner.certificate_issued_at = now()
        db.commit()
    cfg = request.app.state.config
    return {**base, "available": True, "code": learner.certificate_code, "issued_at": learner.certificate_issued_at,
            "capstone": learner.capstone.title if learner.capstone else None,
            "verify_url": f"{cfg.public_url.rstrip('/')}/verify/{learner.certificate_code}"}


# --------------------------------------------------------------------------- public

@public.get("/certificates/{code}", dependencies=[Depends(limit("verify", 60, 3600))])
def verify_certificate(code: str, db: Session = Depends(get_db)):
    learner = db.scalar(select(Learner).options(selectinload(Learner.submissions), selectinload(Learner.capstone))
                        .where(Learner.certificate_code == code.strip().upper()))
    if learner is None:
        raise HTTPException(404, "We couldn't find a certificate with that code. Check it was typed exactly as printed.")
    s = db.scalar(select(Settings))
    return {"valid": True, "name": learner.name, "cohort": s.cohort_name, "labs_done": len(learner.submissions),
            "issued_at": learner.certificate_issued_at, "capstone": learner.capstone.title if learner.capstone else None}


def short_name(name):
    parts = name.split()
    return parts[0] if len(parts) == 1 else f"{parts[0]} {parts[-1][0]}."


@public.get("/showcase")
def showcase(db: Session = Depends(get_db)):
    """Capstones whose makers chose to show them publicly."""
    rows = db.scalars(select(Capstone).where(Capstone.public.is_(True)).order_by(Capstone.updated_at.desc())).all()
    items = []
    for c in rows:
        learner = db.get(Learner, c.learner_id)
        link = db.scalar(select(Submission.value).where(Submission.learner_id == c.learner_id, Submission.week == 11))
        items.append({"id": c.id, "maker": short_name(learner.name), "title": c.title, "description": c.description,
                      "brief": BRIEFS[c.brief], "url": link if link and link.startswith("http") else None})
    s = db.scalar(select(Settings))
    return {"cohort": s.cohort_name, "demo_day": s.demo_day, "items": items}


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    organisation: str = Field("", max_length=160)
    consent: bool = False

    @field_validator("consent")
    @classmethod
    def must_consent(cls, v):
        if not v:
            raise ValueError("Please agree to the privacy notice so we can send you the demo day link.")
        return v


@public.post("/demo-day/register", status_code=201, dependencies=[Depends(limit("demo", 10, 3600))])
def register_demo(body: RegisterIn, db: Session = Depends(get_db)):
    email = body.email.lower()
    if not db.scalar(select(DemoRegistration).where(func.lower(DemoRegistration.email) == email)):
        db.add(DemoRegistration(name=body.name.strip(), email=email, organisation=body.organisation.strip()))
        db.commit()
    return {"message": "You're registered. We'll email you the link before demo day."}


# --------------------------------------------------------------------------- team side

@admin_router.get("/reflections")
def list_reflections(pending: bool = False, admin: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    q = select(Reflection, Learner.name).join(Learner, Learner.id == Reflection.learner_id).order_by(Reflection.updated_at.desc())
    if pending:
        q = q.where(Reflection.feedback == "")
    return [{"id": r.id, "learner": name, "week": r.week, "week_title": course.WEEK_BY_NUMBER[r.week]["title"],
             "text": r.text, "updated_at": r.updated_at, "feedback": r.feedback, "feedback_by": r.feedback_by,
             "feedback_at": r.feedback_at} for r, name in db.execute(q)]


class FeedbackIn(BaseModel):
    feedback: str = Field(min_length=2, max_length=3000)


@admin_router.patch("/reflections/{reflection_id}")
def give_feedback(reflection_id: int, body: FeedbackIn, admin: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    r = db.get(Reflection, reflection_id)
    if r is None:
        raise HTTPException(404, "No reflection with that number.")
    r.feedback, r.feedback_by, r.feedback_at = body.feedback.strip(), admin.name or admin.email, now()
    audit(db, admin, "gave feedback", f"reflection #{r.id}, week {r.week}")
    db.commit()
    return {"message": "Feedback sent. The learner sees it on their week page."}


@admin_router.get("/attendance/{week}")
def get_attendance(week: int, admin: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    present = set(db.scalars(select(Attendance.learner_id).where(Attendance.week == week)))
    learners = db.scalars(select(Learner).order_by(Learner.name)).all()
    return [{"learner_id": l.id, "name": l.name, "present": l.id in present} for l in learners]


class AttendanceIn(BaseModel):
    present: list[int]


@admin_router.put("/attendance/{week}")
def set_attendance(week: int, body: AttendanceIn, admin: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    if week not in course.WEEK_BY_NUMBER:
        raise HTTPException(404, "There's no such week.")
    for a in db.scalars(select(Attendance).where(Attendance.week == week)):
        db.delete(a)
    db.flush()
    valid = set(db.scalars(select(Learner.id)))
    for learner_id in set(body.present) & valid:
        db.add(Attendance(learner_id=learner_id, week=week))
    audit(db, admin, "took attendance", f"week {week}: {len(set(body.present) & valid)} present")
    db.commit()
    return {"message": f"Saved: {len(set(body.present) & valid)} present in week {week}."}


@admin_router.get("/demo-day")
def demo_registrations(admin: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    regs = db.scalars(select(DemoRegistration).order_by(DemoRegistration.created_at.desc())).all()
    capstones = db.execute(select(Capstone, Learner.name).join(Learner, Learner.id == Capstone.learner_id)
                           .order_by(Learner.name)).all()
    return {
        "registrations": [{"id": r.id, "name": r.name, "email": r.email, "organisation": r.organisation,
                           "created_at": r.created_at} for r in regs],
        "capstones": [{"learner": name, "title": c.title, "brief": BRIEFS[c.brief], "public": c.public}
                      for c, name in capstones],
    }


@admin_router.get("/export/demo-day.csv")
def export_demo(admin: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    from .admin import csv_response
    rows = [[r.name, r.email, r.organisation, r.created_at.isoformat()]
            for r in db.scalars(select(DemoRegistration).order_by(DemoRegistration.created_at))]
    return csv_response("demo-day.csv", ["name", "email", "organisation", "registered"], rows, db, admin)
