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
    # "admin" can do everything; "ta" can review, score, mark attendance and give feedback
    role: Mapped[str] = mapped_column(String(10), default="admin")
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
    # Where people send privacy and data requests; shown on the privacy page
    contact_email: Mapped[str] = mapped_column(String(254), default="")
    # Live sessions: the video call link and the usual time, shown to learners
    session_link: Mapped[str] = mapped_column(String(500), default="")
    session_time: Mapped[str] = mapped_column(String(40), default="10:00 WAT")
    # Learners who've done enough labs can see and print their certificate once this is on
    certificates_open: Mapped[bool] = mapped_column(Boolean, default=False)


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
    # When they agreed to the privacy notice (NDPA 2023: record consent)
    consented_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Reviewer fields
    q9_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reviewer_note: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending|accepted|waitlisted|rejected
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # The decision we last emailed them about, so decision emails are only sent once per change
    notified_status: Mapped[str] = mapped_column(String(20), default="")

    learner: Mapped["Learner | None"] = relationship(back_populates="application")


class Learner(Base):
    __tablename__ = "learners"
    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(254), unique=True)
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    # Set the first time the certificate is issued; anyone can verify it at /verify/<code>
    certificate_code: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    certificate_issued_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    application: Mapped[Application] = relationship(back_populates="learner")
    submissions: Mapped[list["Submission"]] = relationship(back_populates="learner", cascade="all, delete-orphan")
    quiz_attempts: Mapped[list["QuizAttempt"]] = relationship(back_populates="learner", cascade="all, delete-orphan")
    lab_steps: Mapped[list["LabStep"]] = relationship(back_populates="learner", cascade="all, delete-orphan")
    reflections: Mapped[list["Reflection"]] = relationship(cascade="all, delete-orphan")
    capstone: Mapped["Capstone | None"] = relationship(cascade="all, delete-orphan")
    attendance: Mapped[list["Attendance"]] = relationship(cascade="all, delete-orphan")
    ai_usage: Mapped[list["AIUsage"]] = relationship(cascade="all, delete-orphan")
    ai_cache: Mapped[list["AICache"]] = relationship(cascade="all, delete-orphan")


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


class LabStep(Base):
    """One step of an interactive lab that a learner has passed."""
    __tablename__ = "lab_steps"
    __table_args__ = (UniqueConstraint("learner_id", "week", "step_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    learner_id: Mapped[int] = mapped_column(ForeignKey("learners.id", ondelete="CASCADE"))
    week: Mapped[int] = mapped_column(Integer)
    step_id: Mapped[str] = mapped_column(String(40))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

    learner: Mapped[Learner] = relationship(back_populates="lab_steps")


class AuditLog(Base):
    """What the team did, and when."""
    __tablename__ = "audit_log"
    id: Mapped[int] = mapped_column(primary_key=True)
    admin_email: Mapped[str] = mapped_column(String(254))
    action: Mapped[str] = mapped_column(String(60))
    detail: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, index=True)


class AIUsage(Base):
    """One call a learner made through the AI or chunker proxy."""
    __tablename__ = "ai_usage"
    id: Mapped[int] = mapped_column(primary_key=True)
    learner_id: Mapped[int] = mapped_column(ForeignKey("learners.id", ondelete="CASCADE"), index=True)
    day: Mapped[str] = mapped_column(String(10), index=True)  # YYYY-MM-DD, Lagos time
    kind: Mapped[str] = mapped_column(String(10))  # chat | embed | chunk
    model: Mapped[str] = mapped_column(String(80), default="")
    tokens_in: Mapped[int] = mapped_column(Integer, default=0)
    tokens_out: Mapped[int] = mapped_column(Integer, default=0)
    ok: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class AICache(Base):
    """A learner's AI reply, kept for the day so identical calls (re-runs, replays) are free."""
    __tablename__ = "ai_cache"
    __table_args__ = (UniqueConstraint("learner_id", "key"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    learner_id: Mapped[int] = mapped_column(ForeignKey("learners.id", ondelete="CASCADE"))
    key: Mapped[str] = mapped_column(String(64))
    day: Mapped[str] = mapped_column(String(10))
    response: Mapped[dict] = mapped_column(JSON)


class Announcement(Base):
    """A message the team posts to every learner's dashboard."""
    __tablename__ = "announcements"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(160))
    body: Mapped[str] = mapped_column(Text)
    author: Mapped[str] = mapped_column(String(254))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Reflection(Base):
    """A learner's short written reflection for a week, and a TA's reply."""
    __tablename__ = "reflections"
    __table_args__ = (UniqueConstraint("learner_id", "week"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    learner_id: Mapped[int] = mapped_column(ForeignKey("learners.id", ondelete="CASCADE"))
    week: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    feedback: Mapped[str] = mapped_column(Text, default="")
    feedback_by: Mapped[str] = mapped_column(String(120), default="")
    feedback_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Capstone(Base):
    """The project a learner chose in week 9."""
    __tablename__ = "capstones"
    id: Mapped[int] = mapped_column(primary_key=True)
    learner_id: Mapped[int] = mapped_column(ForeignKey("learners.id", ondelete="CASCADE"), unique=True)
    brief: Mapped[str] = mapped_column(String(30))  # one of the briefs, or "own"
    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text)
    public: Mapped[bool] = mapped_column(Boolean, default=False)  # opted in to the public showcase
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Attendance(Base):
    """A learner attended the live session in a given week."""
    __tablename__ = "attendance"
    __table_args__ = (UniqueConstraint("learner_id", "week"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    learner_id: Mapped[int] = mapped_column(ForeignKey("learners.id", ondelete="CASCADE"))
    week: Mapped[int] = mapped_column(Integer)


class DemoRegistration(Base):
    """Someone from the public registered to watch demo day."""
    __tablename__ = "demo_registrations"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(254), unique=True)
    organisation: Mapped[str] = mapped_column(String(160), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
