from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

Occupation = Literal["student", "working", "looking", "other"]
Device = Literal["own_laptop", "shared_laptop", "cyber_cafe", "phone_only"]
Live = Literal["yes", "most_weeks", "no"]
Hours = Literal["under_2", "2_4", "over_4"]
Coded = Literal["never", "a_little", "yes"]
Status = Literal["pending", "accepted", "waitlisted", "rejected"]


def _strip(v):
    return v.strip() if isinstance(v, str) else v


class WaitlistIn(BaseModel):
    email: EmailStr
    name: str = Field("", max_length=120)
    website: str = ""  # honeypot: real people leave this empty

    _s = field_validator("name")(_strip)


class ApplicationIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    whatsapp: str = Field(min_length=7, max_length=30)
    is_adult: bool
    city: str = Field(min_length=2, max_length=120)
    country: str = Field("Nigeria", min_length=2, max_length=80)
    occupation: Occupation
    device: Device
    live_sessions: Live
    lab_hours: Hours
    coded_before: Coded
    problem: str = Field(min_length=10, max_length=600)
    commits: bool
    consent: bool = False
    website: str = ""  # honeypot

    _s = field_validator("name", "whatsapp", "city", "country", "problem")(_strip)

    @field_validator("consent")
    @classmethod
    def must_consent(cls, v):
        if not v:
            raise ValueError("Please agree to the privacy notice so we can process your application.")
        return v

    @field_validator("whatsapp")
    @classmethod
    def phone_digits(cls, v):
        digits = [c for c in v if c.isdigit()]
        if len(digits) < 7 or any(c not in "0123456789+ -()" for c in v):
            raise ValueError("Enter a phone number, like 0803 123 4567 or +234 803 123 4567.")
        return v


class SubmissionIn(BaseModel):
    week: int = Field(ge=1, le=12)
    value: str = Field(min_length=1, max_length=500)


class QuizIn(BaseModel):
    answers: list[int]
    confidence: list[int]

    @field_validator("confidence")
    @classmethod
    def one_to_five(cls, v):
        if any(not 1 <= x <= 5 for x in v):
            raise ValueError("Confidence answers go from 1 to 5.")
        return v


class LoginIn(BaseModel):
    email: str = Field(max_length=254)
    password: str = Field(max_length=200)


class ApplicationPatch(BaseModel):
    q9_score: int | None = Field(None, ge=0, le=3)
    reviewer_note: str | None = Field(None, max_length=2000)
    status: Status | None = None
    clear_q9: bool = False


class SettingsIn(BaseModel):
    cohort_name: str = Field(min_length=1, max_length=120)
    applications_open: bool
    applications_close: str = Field("", max_length=40)
    cap: int = Field(ge=1, le=1000)
    waitlist_size: int = Field(ge=0, le=1000)
    labs_required: int = Field(ge=1, le=12)
    post_quiz_open: bool
    demo_day: str = Field("", max_length=40)
    start_date: str = Field("2027-02-06", pattern=r"^\d{4}-\d{2}-\d{2}$")
    contact_email: str = Field("", max_length=254)
    session_link: str = Field("", max_length=500)
    session_time: str = Field("", max_length=40)


class SelectionIn(BaseModel):
    include_unscored: bool = False


class Message(BaseModel):
    message: str
    created_at: datetime | None = None
