from app.codes import make_code
from conftest import ADMIN, application


# ---------------------------------------------------------------- public

def test_waitlist_and_duplicates(client, admin):
    assert client.post("/api/waitlist", json={"email": "A@Example.com"}).status_code == 201
    r = client.post("/api/waitlist", json={"email": "a@example.com"})
    assert "already" in r.json()["message"]
    assert [w["email"] for w in admin.get("/api/admin/waitlist").json()] == ["a@example.com"]


def test_honeypot_is_silently_dropped(client, admin):
    assert client.post("/api/waitlist", json={"email": "bot@example.com", "website": "x"}).status_code == 201
    assert admin.get("/api/admin/waitlist").json() == []


def test_applications_closed_by_default(client):
    r = client.post("/api/applications", json=application())
    assert r.status_code == 403


def test_application_validation_is_friendly(client, open_applications):
    r = client.post("/api/applications", json=application(email="nope", whatsapp="abc"))
    assert r.status_code == 422
    body = r.json()
    assert set(body["errors"]) == {"email", "whatsapp"}
    assert body["errors"]["email"] == "Enter a valid email address."


def test_application_saved_and_scored(client, admin, open_applications):
    assert client.post("/api/applications", json=application()).status_code == 201
    assert client.post("/api/applications", json=application(email="NGOZI@example.com")).status_code == 409
    [row] = admin.get("/api/admin/applications").json()
    assert row["auto_score"] == 7 and row["total_score"] == 7 and row["q9_score"] is None
    r = admin.patch(f"/api/admin/applications/{row['id']}", json={"q9_score": 3, "reviewer_note": "clear idea"})
    assert r.json()["total_score"] == 10
    assert r.json()["breakdown"] == {"live_sessions": 3, "lab_hours": 2, "device": 2, "problem": 3}


def test_rubric_points(client, admin, open_applications):
    client.post("/api/applications", json=application(email="b@x.com", device="cyber_cafe",
                                                      live_sessions="most_weeks", lab_hours="under_2"))
    client.post("/api/applications", json=application(email="c@x.com", device="phone_only", live_sessions="no"))
    scores = {r["email"]: r["auto_score"] for r in admin.get("/api/admin/applications").json()}
    assert scores == {"b@x.com": 3, "c@x.com": 2}


# ---------------------------------------------------------------- admin auth

def test_admin_routes_need_login(client):
    assert client.get("/api/admin/stats").status_code == 401
    assert client.post("/api/admin/login", json={**ADMIN, "password": "wrong"}).status_code == 401


def test_logout(admin):
    admin.post("/api/admin/logout")
    assert admin.get("/api/admin/me").status_code == 401


def test_change_password_and_add_team_member(admin, client):
    r = admin.post("/api/admin/password", json={"current": ADMIN["password"], "new": "a much better password"})
    assert r.status_code == 200
    assert client.post("/api/admin/login", json={**ADMIN, "password": "a much better password"}).status_code == 200
    assert admin.post("/api/admin/team", json={"email": "ta@akada.test", "password": "ta password 123"}).status_code == 201
    assert len(admin.get("/api/admin/team").json()) == 2


# ---------------------------------------------------------------- selection

def apply_many(client, admin, n, **kw):
    ids = []
    for i in range(n):
        client.post("/api/applications", json=application(email=f"p{i}@x.com", name=f"Person {i}", **kw))
    for row in admin.get("/api/admin/applications").json():
        ids.append(row["id"])
    return ids


def test_selection_caps_and_waitlists(client, admin, open_applications):
    s = admin.get("/api/admin/settings").json()
    admin.put("/api/admin/settings", json={**s, "cap": 2, "waitlist_size": 1})
    ids = apply_many(client, admin, 5)
    client.post("/api/applications", json=application(email="minor@x.com", is_adult=False))
    for i, app_id in enumerate(sorted(ids)):
        admin.patch(f"/api/admin/applications/{app_id}", json={"q9_score": [3, 1, 2, 3, None][i]})

    preview = admin.post("/api/admin/selection/preview", json={}).json()
    assert preview["counts"] == {"accepted": 2, "waitlisted": 1, "rejected": 2, "pending": 1}
    assert admin.get("/api/admin/learners").json()["learners"] == []  # preview changes nothing

    admin.post("/api/admin/selection/apply", json={})
    rows = {r["email"]: r["status"] for r in admin.get("/api/admin/applications").json()}
    assert rows["p0@x.com"] == rows["p3@x.com"] == "accepted"  # both scored 10; earlier first
    assert rows["p2@x.com"] == "waitlisted"
    assert rows["minor@x.com"] == "rejected"
    assert rows["p4@x.com"] == "pending"  # not scored yet
    assert len(admin.get("/api/admin/learners").json()["learners"]) == 2


def test_cannot_accept_ineligible(client, admin, open_applications):
    client.post("/api/applications", json=application(commits=False))
    [row] = admin.get("/api/admin/applications").json()
    assert admin.patch(f"/api/admin/applications/{row['id']}", json={"status": "accepted"}).status_code == 409


# ---------------------------------------------------------------- learners

def accept(client, admin, **kw):
    client.post("/api/applications", json=application(**kw))
    row = next(r for r in admin.get("/api/admin/applications").json() if r["email"] == kw.get("email", "ngozi@example.com"))
    full = admin.patch(f"/api/admin/applications/{row['id']}", json={"status": "accepted"}).json()
    return full["learner_token"], row["id"]


def test_learner_dashboard_and_submissions(client, admin, open_applications):
    token, _ = accept(client, admin)
    me = client.get(f"/api/learner/{token}").json()
    assert me["first_name"] == "Ngozi" and me["labs_done"] == 0 and len(me["weeks"]) == 12

    bad = client.post(f"/api/learner/{token}/submissions", json={"week": 4, "value": make_code("other@x.com", 4)})
    assert bad.status_code == 422 and "doesn't match your email" in bad.json()["detail"]
    wrong_week = client.post(f"/api/learner/{token}/submissions", json={"week": 4, "value": make_code("ngozi@example.com", 5)})
    assert "week 5" in wrong_week.json()["detail"]

    good = make_code("ngozi@example.com", 4).lower()  # case doesn't matter
    assert client.post(f"/api/learner/{token}/submissions", json={"week": 4, "value": good}).status_code == 200
    assert client.post(f"/api/learner/{token}/submissions", json={"week": 11, "value": "not a link"}).status_code == 422
    assert client.post(f"/api/learner/{token}/submissions",
                       json={"week": 11, "value": "https://huggingface.co/spaces/ngozi/app"}).status_code == 200
    me = client.get(f"/api/learner/{token}").json()
    assert me["labs_done"] == 2
    assert admin.get("/api/admin/learners").json()["learners"][0]["weeks_done"] == [4, 11]


def test_codes_match_notebooks():
    import importlib.util
    from pathlib import Path
    path = Path(__file__).resolve().parents[2] / "lab" / "content" / "akada_checks.py"
    spec = importlib.util.spec_from_file_location("akada_checks", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    assert module.make_code("Someone@Example.com ", 7) == make_code("someone@example.com", 7)


def test_unknown_learner_link(client):
    assert client.get("/api/learner/nope").status_code == 404


def test_quiz_pre_and_post(client, admin, open_applications):
    token, _ = accept(client, admin)
    q = client.get(f"/api/learner/{token}/quiz/pre").json()
    assert len(q["questions"]) == 20 and "answer" not in str(q["questions"][0]).lower()
    assert client.get(f"/api/learner/{token}/quiz/post").status_code == 403

    from app.course import QUIZ
    right = [c for _, _, c in QUIZ]
    half = [c if i % 2 else (c + 1) % len(QUIZ[i][1]) for i, c in enumerate(right)]
    r = client.post(f"/api/learner/{token}/quiz/pre", json={"answers": half, "confidence": [1, 2, 1]})
    assert r.json()["score"] == 50
    assert client.post(f"/api/learner/{token}/quiz/pre", json={"answers": half, "confidence": [1, 2, 1]}).status_code == 409
    assert client.post(f"/api/learner/{token}/quiz/pre", json={"answers": [0], "confidence": [1, 2, 1]}).status_code in (409, 422)

    s = admin.get("/api/admin/settings").json()
    admin.put("/api/admin/settings", json={**s, "post_quiz_open": True})
    r = client.post(f"/api/learner/{token}/quiz/post", json={"answers": right, "confidence": [4, 4, 5]})
    assert r.json() == {"score": 100, "out_of": 100, "pre_score": 50}
    stats = admin.get("/api/admin/stats").json()["quiz"]
    assert stats["pre"]["average"] == 50 and stats["post"]["average"] == 100


def test_unaccepting_learner_who_started_is_blocked(client, admin, open_applications):
    token, app_id = accept(client, admin)
    client.post(f"/api/learner/{token}/submissions", json={"week": 2, "value": make_code("ngozi@example.com", 2)})
    assert admin.patch(f"/api/admin/applications/{app_id}", json={"status": "rejected"}).status_code == 409


def test_unaccepting_before_start_removes_learner(client, admin, open_applications):
    token, app_id = accept(client, admin)
    assert admin.patch(f"/api/admin/applications/{app_id}", json={"status": "waitlisted"}).status_code == 200
    assert client.get(f"/api/learner/{token}").status_code == 404


def test_stats_and_exports(client, admin, open_applications):
    accept(client, admin)
    stats = admin.get("/api/admin/stats").json()
    assert stats["applications"]["total"] == 1 and stats["learners"]["total"] == 1
    assert stats["applications"]["per_day"][-1]["count"] == 1
    csv_text = admin.get("/api/admin/export/learners.csv").text
    assert "Ngozi Okafor" in csv_text and "/learn/" in csv_text
    assert "Own laptop" in admin.get("/api/admin/export/applications.csv").text


def test_schedule_weeks_and_sessions():
    from datetime import date
    from app.routers.learner import schedule
    assert schedule("2027-02-06", date(2027, 2, 1)) == {"current_week": 0, "next_session": "2027-02-06", "next_session_week": 1}
    assert schedule("2027-02-06", date(2027, 2, 6))["current_week"] == 1
    mid = schedule("2027-02-06", date(2027, 3, 1))
    assert mid["current_week"] == 4 and mid["next_session"] == "2027-03-06" and mid["next_session_week"] == 5
    after = schedule("2027-02-06", date(2027, 6, 1))
    assert after["current_week"] == 13 and after["next_session"] is None


def test_dashboard_has_objectives_and_activity(client, admin, open_applications):
    token, _ = accept(client, admin)
    client.post(f"/api/learner/{token}/submissions", json={"week": 2, "value": make_code("ngozi@example.com", 2)})
    me = client.get(f"/api/learner/{token}").json()
    assert len(me["weeks"][1]["objectives"]) == 4 and me["weeks"][0]["phase"] == "Foundations"
    assert len(me["activity"]) == 1 and "current_week" in me


def test_old_database_gets_new_columns(tmp_path):
    import sqlite3
    from app.config import Config
    from app.main import create_app
    db = tmp_path / "old.db"
    con = sqlite3.connect(db)
    con.execute("CREATE TABLE settings (id INTEGER PRIMARY KEY, cohort_name VARCHAR(120), applications_open BOOLEAN, "
                "applications_close VARCHAR(40), cap INTEGER, waitlist_size INTEGER, labs_required INTEGER, "
                "post_quiz_open BOOLEAN, demo_day VARCHAR(40))")
    con.execute("INSERT INTO settings VALUES (1, 'C1', 0, '', 40, 10, 9, 0, 'x')")
    con.commit()
    con.close()
    app = create_app(Config(database_url=f"sqlite:///{db}", secret_key="t", frontend_dist=tmp_path / "none"))
    from fastapi.testclient import TestClient
    assert TestClient(app).get("/api/public/config").json()["start_date"] == "2027-02-06"
