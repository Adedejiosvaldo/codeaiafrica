import pytest

from app.mailer import MemoryMailer
from conftest import application


@pytest.fixture
def mail(app):
    app.state.mailer = MemoryMailer()
    return app.state.mailer


def test_application_confirmation_email(client, admin, open_applications, mail):
    client.post("/api/applications", json=application())
    assert len(mail.sent) == 1 and mail.sent[0]["to"] == "ngozi@example.com"
    assert "received" in mail.sent[0]["subject"]


def test_decision_emails_once_per_change(client, admin, open_applications, mail):
    for i, status in enumerate(["accepted", "waitlisted", "rejected"]):
        client.post("/api/applications", json=application(email=f"d{i}@x.com", name=f"Person {i}"))
    rows = {r["email"]: r["id"] for r in admin.get("/api/admin/applications").json()}
    for i, status in enumerate(["accepted", "waitlisted", "rejected"]):
        admin.patch(f"/api/admin/applications/{rows[f'd{i}@x.com']}", json={"status": status})
    mail.sent.clear()
    assert admin.get("/api/admin/messages/status").json()["pending_decisions"] == 3
    r = admin.post("/api/admin/messages/decisions").json()
    assert r["count"] == 3
    by_to = {m["to"]: m for m in mail.sent}
    assert "/learn/" in by_to["d0@x.com"]["text"] and "You're in" in by_to["d0@x.com"]["subject"]
    assert "waitlist" in by_to["d1@x.com"]["subject"]
    assert "weren't able" in by_to["d2@x.com"]["text"]
    assert admin.post("/api/admin/messages/decisions").json()["count"] == 0  # not sent twice


def test_email_disabled_is_explained(admin):
    r = admin.post("/api/admin/messages/learner-links", json={})
    assert r.status_code == 503 and "SMTP" in r.json()["detail"]


def test_waitlist_notice_needs_open_applications(client, admin, mail):
    client.post("/api/waitlist", json={"email": "w@x.com"})
    assert admin.post("/api/admin/messages/waitlist", json={}).status_code == 400
    s = admin.get("/api/admin/settings").json()
    admin.put("/api/admin/settings", json={**s, "applications_open": True, "applications_close": "31 January 2027"})
    r = admin.post("/api/admin/messages/waitlist", json={"extra": "Live Q&A on Friday."})
    assert r.json()["count"] == 1
    assert "/apply" in mail.sent[-1]["text"] and "31 January 2027" in mail.sent[-1]["text"] and "Friday" in mail.sent[-1]["text"]


def test_find_my_link_never_reveals_who_applied(client, admin, open_applications, mail):
    client.post("/api/applications", json=application())
    [row] = admin.get("/api/admin/applications").json()
    admin.patch(f"/api/admin/applications/{row['id']}", json={"status": "accepted"})
    mail.sent.clear()
    known = client.post("/api/find-my-link", json={"email": "NGOZI@example.com"})
    unknown = client.post("/api/find-my-link", json={"email": "nobody@example.com"})
    assert known.json() == unknown.json()
    assert len(mail.sent) == 1 and "/learn/" in mail.sent[0]["text"]


def test_announcements_reach_dashboard_and_email(client, admin, open_applications, mail):
    client.post("/api/applications", json=application())
    [row] = admin.get("/api/admin/applications").json()
    token = admin.patch(f"/api/admin/applications/{row['id']}", json={"status": "accepted"}).json()["learner_token"]
    mail.sent.clear()
    r = admin.post("/api/admin/announcements", json={"title": "No class this Saturday", "body": "Public holiday. See you next week.", "email": True})
    assert r.status_code == 201 and len(mail.sent) == 1
    me = client.get(f"/api/learner/{token}").json()
    assert me["announcements"][0]["title"] == "No class this Saturday"
    s = admin.get("/api/admin/settings").json()
    admin.put("/api/admin/settings", json={**s, "session_link": "https://meet.example.com/akada"})
    assert client.get(f"/api/learner/{token}").json()["session_link"] == "https://meet.example.com/akada"
