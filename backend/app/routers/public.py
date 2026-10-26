from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import course
from ..models import Application, Settings, WaitlistEntry, now
from ..schemas import ApplicationIn, WaitlistIn
from ..ratelimit import limit
from ..security import get_db

router = APIRouter(prefix="/api", tags=["public"])


def settings(db):
    return db.scalar(select(Settings))


@router.get("/public/config")
def public_config(db: Session = Depends(get_db)):
    s = settings(db)
    return {
        "cohort_name": s.cohort_name,
        "applications_open": s.applications_open,
        "applications_close": s.applications_close,
        "places": s.cap,
        "labs_required": s.labs_required,
        "demo_day": s.demo_day,
        "start_date": s.start_date,
        "contact_email": s.contact_email,
    }


@router.get("/public/course")
def public_course():
    return {"weeks": course.WEEKS}


@router.post("/waitlist", status_code=201, dependencies=[Depends(limit("waitlist", 10, 3600))])
def join_waitlist(body: WaitlistIn, db: Session = Depends(get_db)):
    if body.website:  # a bot filled the hidden field: pretend it worked
        return {"message": "You're on the list."}
    email = body.email.lower()
    if db.scalar(select(WaitlistEntry).where(func.lower(WaitlistEntry.email) == email)):
        return {"message": "You're already on the list. We'll be in touch."}
    db.add(WaitlistEntry(email=email, name=body.name))
    db.commit()
    return {"message": "You're on the list. We'll message you when applications open."}


@router.post("/applications", status_code=201, dependencies=[Depends(limit("apply", 5, 3600))])
def apply(body: ApplicationIn, db: Session = Depends(get_db)):
    if not settings(db).applications_open:
        raise HTTPException(403, "Applications are closed right now. Join the waitlist and we'll tell you when they open.")
    if body.website:
        return {"message": "Application received."}
    email = body.email.lower()
    if db.scalar(select(Application).where(func.lower(Application.email) == email)):
        raise HTTPException(409, "There's already an application with this email. Message us on WhatsApp if you need to change it.")
    data = body.model_dump(exclude={"website", "consent"})
    data["email"] = email
    data["consented_at"] = now()
    db.add(Application(**data))
    db.commit()
    return {"message": "Application received. We'll reply by email and WhatsApp."}
