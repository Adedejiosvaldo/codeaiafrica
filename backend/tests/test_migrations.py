"""Migrations: fresh databases are built by Alembic, old ones are stamped, and models match the migrations."""
import os
import sqlite3
import subprocess
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]


def run(args, db):
    env = {**os.environ, "DATABASE_URL": f"sqlite:///{db}", "SECRET_KEY": "test"}
    return subprocess.run([sys.executable, *args], cwd=BACKEND, env=env, capture_output=True, text=True, timeout=120)


def tables(db):
    return {r[0] for r in sqlite3.connect(db).execute("select name from sqlite_master where type='table'")}


def test_fresh_database_is_built_by_migrations(tmp_path):
    db = tmp_path / "fresh.db"
    r = run(["-m", "app.cli", "migrate"], db)
    assert r.returncode == 0, r.stderr
    assert {"alembic_version", "applications", "learners", "ai_usage", "reflections"} <= tables(db)
    check = run(["-m", "alembic", "check"], db)
    assert check.returncode == 0, "Models changed without a migration: run alembic revision --autogenerate\n" + check.stdout + check.stderr


def test_database_from_before_alembic_is_stamped(tmp_path):
    db = tmp_path / "old.db"
    con = sqlite3.connect(db)
    con.execute("CREATE TABLE settings (id INTEGER PRIMARY KEY, cohort_name VARCHAR(120), applications_open BOOLEAN, "
                "applications_close VARCHAR(40), cap INTEGER, waitlist_size INTEGER, labs_required INTEGER, "
                "post_quiz_open BOOLEAN, demo_day VARCHAR(40))")
    con.execute("INSERT INTO settings VALUES (1, 'Cohort 1', 1, '', 40, 10, 9, 0, 'x')")
    con.commit()
    con.close()
    r = run(["-m", "app.cli", "migrate"], db)
    assert r.returncode == 0, r.stderr
    assert "stamped" in r.stdout
    row = sqlite3.connect(db).execute("select cohort_name, certificates_open, session_time from settings").fetchone()
    assert row[0] == "Cohort 1"  # data kept, new columns added
    assert run(["-m", "app.cli", "migrate"], db).returncode == 0  # running again is safe


def test_old_learners_table_gets_new_nullable_and_unique_columns(tmp_path):
    db = tmp_path / "older.db"
    con = sqlite3.connect(db)
    con.execute("CREATE TABLE learners (id INTEGER PRIMARY KEY, application_id INTEGER, name VARCHAR(120), "
                "email VARCHAR(254), token VARCHAR(64), created_at DATETIME)")
    con.execute("INSERT INTO learners VALUES (1, 1, 'Ada Obi', 'ada@x.com', 'tok', '2026-01-01')")
    con.commit()
    con.close()
    assert run(["-m", "app.cli", "migrate"], db).returncode == 0
    con = sqlite3.connect(db)
    cols = {r[1] for r in con.execute("pragma table_info(learners)")}
    assert {"certificate_code", "certificate_issued_at"} <= cols
    con.execute("update learners set certificate_code='AKL-1'")
    con.execute("insert into learners (id, application_id, name, email, token, created_at) values (2, 2, 'B', 'b@x.com', 't2', '2026-01-01')")
    try:
        con.execute("update learners set certificate_code='AKL-1' where id=2")
        raise AssertionError("certificate codes must stay unique")
    except sqlite3.IntegrityError:
        pass
