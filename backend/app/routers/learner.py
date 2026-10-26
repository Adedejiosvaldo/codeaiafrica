from datetime import date, datetime, timedelta, timezone
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import course, labs
from ..codes import check_code
from ..models import LabStep, Learner, QuizAttempt, Settings, Submission, now
from ..schemas import QuizIn, SubmissionIn
from ..ratelimit import limit
from ..security import get_db

router = APIRouter(prefix="/api/learner", tags=["learner"])
PHASES = ("pre", "post")


def get_learner(token: str, db: Session = Depends(get_db)):
    learner = db.scalar(select(Learner).where(Learner.token == token))
    if learner is None:
        raise HTTPException(404, "This link isn't valid. Check you copied all of it, or ask the team for yours.")
    return learner


def quiz_state(learner, s):
    attempts = {a.phase: a for a in learner.quiz_attempts}
    state = {}
    for phase in PHASES:
        a = attempts.get(phase)
        state[phase] = {
            "open": phase == "pre" or s.post_quiz_open,
            "done": a is not None,
            "score": a.score if a else None,
            "confidence": a.confidence if a else None,
        }
    return state


LAGOS = timezone(timedelta(hours=1))


def schedule(start_date, today=None):
    """Current course week (0 before it starts, 13 after week 12) and the next live session date."""
    try:
        start = date.fromisoformat(start_date)
    except ValueError:
        return {"current_week": 0, "next_session": None}
    today = today or datetime.now(LAGOS).date()
    days = (today - start).days
    current = 0 if days < 0 else min(13, days // 7 + 1)
    sessions = [start + timedelta(weeks=i) for i in range(12)]
    upcoming = next((d for d in sessions if d >= today), None)
    return {"current_week": current, "next_session": upcoming.isoformat() if upcoming else None,
            "next_session_week": sessions.index(upcoming) + 1 if upcoming else None}


@router.get("/{token}")
def dashboard(learner: Learner = Depends(get_learner), db: Session = Depends(get_db)):
    s = db.scalar(select(Settings))
    done = {sub.week: sub for sub in learner.submissions}
    weeks = []
    for w in course.WEEKS:
        sub = done.get(w["week"])
        weeks.append({**w, "done": sub is not None, "value": sub.value if sub else None,
                      "submitted_at": sub.created_at if sub else None, "interactive": w["week"] in labs.LABS,
                      "lab_submits": w["week"] in labs.LABS and labs.LABS[w["week"]]["completes_week"]})
    return {
        "name": learner.name,
        "first_name": learner.name.split()[0],
        "email": learner.email,
        "cohort_name": s.cohort_name,
        "labs_required": s.labs_required,
        "labs_done": len(done),
        "demo_day": s.demo_day,
        "weeks": weeks,
        "quiz": quiz_state(learner, s),
        "start_date": s.start_date,
        **schedule(s.start_date),
        # Days with activity, for the heatmap (submissions and quizzes)
        "activity": sorted(
            [sub.created_at.date().isoformat() for sub in learner.submissions]
            + [q.created_at.date().isoformat() for q in learner.quiz_attempts]),
    }


def valid_link(value):
    parsed = urlparse(value.strip())
    return parsed.scheme in ("http", "https") and "." in parsed.netloc


@router.post("/{token}/submissions", dependencies=[Depends(limit("submit", 60, 600))])
def submit(body: SubmissionIn, learner: Learner = Depends(get_learner), db: Session = Depends(get_db)):
    week = course.WEEK_BY_NUMBER[body.week]
    value = body.value.strip()
    if week["kind"] == "code":
        problem = check_code(learner.email, body.week, value)
        if problem:
            raise HTTPException(422, problem)
        value = value.upper()
    elif not valid_link(value):
        raise HTTPException(422, "Paste a full link that starts with https://")

    sub = db.scalar(select(Submission).where(Submission.learner_id == learner.id, Submission.week == body.week))
    if sub:
        sub.value, sub.created_at = value, now()
    else:
        db.add(Submission(learner_id=learner.id, week=body.week, value=value))
    db.commit()
    return {"message": f"Week {body.week} done. Nice work!", "week": body.week}


def check_phase(phase, learner, db):
    if phase not in PHASES:
        raise HTTPException(404, "There's no quiz here.")
    if phase == "post" and not db.scalar(select(Settings)).post_quiz_open:
        raise HTTPException(403, "The end-of-course quiz opens in week 12.")


@router.get("/{token}/quiz/{phase}")
def get_quiz(phase: str, learner: Learner = Depends(get_learner), db: Session = Depends(get_db)):
    check_phase(phase, learner, db)
    attempt = next((a for a in learner.quiz_attempts if a.phase == phase), None)
    return {
        **course.public_quiz(),
        "phase": phase,
        "done": attempt is not None,
        "score": attempt.score if attempt else None,
    }


@router.post("/{token}/quiz/{phase}")
def submit_quiz(phase: str, body: QuizIn, learner: Learner = Depends(get_learner), db: Session = Depends(get_db)):
    check_phase(phase, learner, db)
    if any(a.phase == phase for a in learner.quiz_attempts):
        raise HTTPException(409, "You've already taken this quiz.")
    if len(body.answers) != len(course.QUIZ) or len(body.confidence) != len(course.CONFIDENCE):
        raise HTTPException(422, "Answer every question before you submit.")
    if any(not 0 <= a < len(q[1]) for a, q in zip(body.answers, course.QUIZ)):
        raise HTTPException(422, "One of the answers isn't a valid option.")
    score = course.grade(body.answers)
    db.add(QuizAttempt(learner_id=learner.id, phase=phase, answers=body.answers, confidence=body.confidence, score=score))
    db.commit()
    pre = next((a.score for a in learner.quiz_attempts if a.phase == "pre"), None)
    return {"score": score, "out_of": len(course.QUIZ) * course.POINTS_PER_QUESTION,
            "pre_score": pre if phase == "post" else None}


# ---------------------------------------------------------------------------- interactive labs

LAB_DONE = "Completed in the interactive lab"


def get_lab(week):
    if week not in labs.LABS:
        raise HTTPException(404, "This week doesn't have an interactive lab yet.")
    return labs.LABS[week]


@router.get("/{token}/labs/{week}")
def read_lab(week: int, learner: Learner = Depends(get_learner)):
    lab = get_lab(week)
    passed = [s.step_id for s in learner.lab_steps if s.week == week]
    done = any(sub.week == week for sub in learner.submissions)
    return {**lab, "passed": passed, "week_done": done, "email": learner.email}


@router.post("/{token}/labs/{week}/steps/{step_id}")
def pass_step(week: int, step_id: str, learner: Learner = Depends(get_learner), db: Session = Depends(get_db)):
    get_lab(week)
    ids = labs.step_ids(week)
    if step_id not in ids:
        raise HTTPException(404, "There's no step with that name in this lab.")
    passed = {s.step_id for s in learner.lab_steps if s.week == week}
    if step_id not in passed:
        db.add(LabStep(learner_id=learner.id, week=week, step_id=step_id))
        passed.add(step_id)
    completed = passed >= set(ids)
    newly_completed = False
    lab = labs.LABS[week]
    if completed and lab["completes_week"] and not any(sub.week == week for sub in learner.submissions):
        db.add(Submission(learner_id=learner.id, week=week, value=LAB_DONE))
        newly_completed = True
    db.commit()
    return {"passed": sorted(passed, key=ids.index), "completed": completed, "newly_completed": newly_completed}
