from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def now():
    return datetime.now(timezone.utc)


class AdminUser(Base):
    __tablename__ = "admin_users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True)
    name: Mapped[str] = mapped_column(String(120), default="")
    password_hash: Mapped[str] = mapped_column(String(300))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Settings(Base):
    """One row: programme settings the team changes from the admin screen."""
    __tablename__ = "settings"
    id: Mapped[int] = mapped_column(primary_key=True)
    cohort_name: Mapped[str] = mapped_column(String(120), default="Cohort 1")
    applications_open: Mapped[bool] = mapped_column(Boolean, default=False)
    applications_close: Mapped[str] = mapped_column(String(40), default="")  # free text, e.g. "31 January 2027"
    cap: Mapped[int] = mapped_column(Integer, default=40)
    waitlist_size: Mapped[int] = mapped_column(Integer, default=10)
    labs_required: Mapped[int] = mapped_column(Integer, default=9)
    post_quiz_open: Mapped[bool] = mapped_column(Boolean, default=False)
    demo_day: Mapped[str] = mapped_column(String(40), default="24 April 2027")
    # Saturday of week 1, as YYYY-MM-DD. Drives "this week" and the next live session.
    start_date: Mapped[str] = mapped_column(String(10), default="2027-02-06")


class WaitlistEntry(Base):
    __tablename__ = "waitlist"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True)
    name: Mapped[str] = mapped_column(String(120), default="")
    source: Mapped[str] = mapped_column(String(40), default="site")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Application(Base):
    __tablename__ = "applications"
    id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(254), unique=True)
    whatsapp: Mapped[str] = mapped_column(String(30))
    is_adult: Mapped[bool] = mapped_column(Boolean)
    city: Mapped[str] = mapped_column(String(120))
    country: Mapped[str] = mapped_column(String(80), default="Nigeria")
    occupation: Mapped[str] = mapped_column(String(20))
    device: Mapped[str] = mapped_column(String(20))
    live_sessions: Mapped[str] = mapped_column(String(20))
    lab_hours: Mapped[str] = mapped_column(String(20))
    coded_before: Mapped[str] = mapped_column(String(20))
    problem: Mapped[str] = mapped_column(Text)
    commits: Mapped[bool] = mapped_column(Boolean)
    # Reviewer fields
    q9_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reviewer_note: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending|accepted|waitlisted|rejected
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    learner: Mapped["Learner | None"] = relationship(back_populates="application")


class Learner(Base):
    __tablename__ = "learners"
    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(254), unique=True)
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

    application: Mapped[Application] = relationship(back_populates="learner")
    submissions: Mapped[list["Submission"]] = relationship(back_populates="learner", cascade="all, delete-orphan")
    quiz_attempts: Mapped[list["QuizAttempt"]] = relationship(back_populates="learner", cascade="all, delete-orphan")


class Submission(Base):
    __tablename__ = "submissions"
    __table_args__ = (UniqueConstraint("learner_id", "week"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    learner_id: Mapped[int] = mapped_column(ForeignKey("learners.id", ondelete="CASCADE"))
    week: Mapped[int] = mapped_column(Integer)
    value: Mapped[str] = mapped_column(String(500))  # completion code or link
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

    learner: Mapped[Learner] = relationship(back_populates="submissions")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    __table_args__ = (UniqueConstraint("learner_id", "phase"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    learner_id: Mapped[int] = mapped_column(ForeignKey("learners.id", ondelete="CASCADE"))
    phase: Mapped[str] = mapped_column(String(10))  # pre|post
    answers: Mapped[list] = mapped_column(JSON)
    confidence: Mapped[list] = mapped_column(JSON)
    score: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

    learner: Mapped[Learner] = relationship(back_populates="quiz_attempts")
