"""Command-line tools.

    python -m app.cli create-admin you@example.org "Your Name"
    python -m app.cli seed-demo        # fills an empty database with demo data for trying the app
"""
import getpass
import random
import secrets
import sys
from datetime import timedelta

from sqlalchemy import select

from . import course
from .config import config
from .db import Database
from .main import bootstrap
from .models import AdminUser, Application, Learner, QuizAttempt, Settings, Submission, WaitlistEntry, now
from .security import hash_password


def create_admin(email, name=""):
    db = Database(config.database_url)
    bootstrap(db, config)
    password = getpass.getpass("Password (10+ characters): ")
    if len(password) < 10:
        sys.exit("Use at least 10 characters.")
    with db.Session() as s:
        if s.scalar(select(AdminUser).where(AdminUser.email == email.lower())):
            sys.exit("That admin already exists.")
        s.add(AdminUser(email=email.lower(), name=name, password_hash=hash_password(password)))
        s.commit()
    print(f"Created admin {email}.")


FIRST = ["Chiamaka", "Tunde", "Aisha", "Emeka", "Ngozi", "Ibrahim", "Funmi", "Segun", "Zainab", "Obinna", "Halima",
         "Kelechi", "Bisi", "Musa", "Adaeze", "Femi", "Amina", "Chidi", "Yemi", "Hauwa", "Uche", "Bola", "Sani", "Ify"]
LAST = ["Okafor", "Adeyemi", "Bello", "Eze", "Ogunleye", "Musa", "Nwosu", "Abubakar", "Okeke", "Balogun", "Danjuma",
        "Ibe", "Lawal", "Obi", "Adebayo", "Yusuf"]
CITIES = ["Lagos", "Abuja", "Ibadan", "Kano", "Port Harcourt", "Enugu", "Kaduna", "Benin City", "Jos", "Ilorin"]
PROBLEMS = [
    "Market women in my area don't know when prices will rise. I want a tool that warns them before rice goes up.",
    "Customer complaints at my company come in Pidgin and nobody reads them all. I want to sort them automatically.",
    "Farmers near my village lose cassava to disease. A phone app that spots it early would help them.",
    "I want to help students in my school find past questions by topic, even when they ask in their own words.",
    "Bank alerts are hard to track. I want to turn my SMS alerts into a monthly spending report.",
    "Many people don't understand their rights under the data protection law. A chatbot could explain it simply.",
    "I want to learn AI.",
    "Flooding in Lagos destroys shops every year. I want to predict which streets will flood after heavy rain.",
]


def seed_demo():
    db = Database(config.database_url)
    bootstrap(db, config)
    rng = random.Random(7)
    with db.Session() as s:
        if s.scalar(select(Application)):
            sys.exit("The database already has applications; demo data is only for an empty one.")
        settings = s.scalar(select(Settings))
        settings.applications_open = True
        settings.applications_close = "31 January 2027"
        apps = []
        for i in range(86):
            name = f"{rng.choice(FIRST)} {rng.choice(LAST)}"
            app = Application(
                name=name, email=f"{name.lower().replace(' ', '.')}{i}@example.com",
                whatsapp=f"080{rng.randint(10000000, 99999999)}", is_adult=rng.random() > 0.03,
                city=rng.choice(CITIES), occupation=rng.choice(["student", "student", "working", "looking", "other"]),
                device=rng.choice(["own_laptop", "own_laptop", "shared_laptop", "cyber_cafe", "phone_only"]),
                live_sessions=rng.choice(["yes", "yes", "most_weeks", "no"]),
                lab_hours=rng.choice(["under_2", "2_4", "2_4", "over_4"]),
                coded_before=rng.choice(["never", "never", "a_little", "yes"]),
                problem=rng.choice(PROBLEMS), commits=rng.random() > 0.05,
                q9_score=rng.choice([None, 1, 2, 2, 3, 3]) if i < 70 else None,
                created_at=now() - timedelta(days=rng.randint(0, 28), hours=rng.randint(0, 23)),
            )
            apps.append(app)
            s.add(app)
        for i in range(40):
            s.add(WaitlistEntry(email=f"friend{i}@example.com", name=rng.choice(FIRST),
                                created_at=now() - timedelta(days=rng.randint(0, 40))))
        s.flush()
        accepted = [a for a in apps if a.is_adult and a.commits and a.q9_score][:24]
        for a in accepted:
            a.status = "accepted"
            learner = Learner(application=a, name=a.name, email=a.email, token=secrets.token_urlsafe(18))
            s.add(learner)
            s.flush()
            done = rng.randint(2, 6)
            for w in course.WEEKS[:done]:
                value = "https://x.com/demo/status/1" if w["kind"] == "link" else "AK-W00-DEMO00"
                s.add(Submission(learner_id=learner.id, week=w["week"], value=value))
            answers = [rng.choice([q[2], 0, 1]) for q in course.QUIZ]
            s.add(QuizAttempt(learner_id=learner.id, phase="pre", answers=answers,
                              confidence=[rng.randint(1, 3) for _ in course.CONFIDENCE], score=course.grade(answers)))
        s.commit()
    print("Added 86 demo applications, 24 learners and 40 waitlist sign-ups.")


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "create-admin":
        create_admin(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "")
    elif len(sys.argv) == 2 and sys.argv[1] == "seed-demo":
        seed_demo()
    else:
        sys.exit(__doc__)
