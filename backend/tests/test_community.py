from app.codes import make_code
from conftest import application


def accepted(client, admin, email="ngozi@example.com", name="Ngozi Okafor"):
    client.post("/api/applications", json=application(email=email, name=name))
    row = next(r for r in admin.get("/api/admin/applications").json() if r["email"] == email)
    return admin.patch(f"/api/admin/applications/{row['id']}", json={"status": "accepted"}).json()["learner_token"]


def test_reflection_and_feedback(client, admin, open_applications):
    token = accepted(client, admin)
    assert client.put(f"/api/learner/{token}/reflections/5", json={"text": "short"}).status_code == 422
    text = "The model did badly on Pidgin because it never saw Pidgin while training."
    assert client.put(f"/api/learner/{token}/reflections/5", json={"text": text}).status_code == 200
    [r] = admin.get("/api/admin/reflections?pending=true").json()
    assert r["learner"] == "Ngozi Okafor" and r["week"] == 5
    admin.patch(f"/api/admin/reflections/{r['id']}", json={"feedback": "Great insight. What data would you collect?"})
    assert admin.get("/api/admin/reflections?pending=true").json() == []
    week5 = client.get(f"/api/learner/{token}").json()["weeks"][4]
    assert week5["reflection"]["feedback"].startswith("Great insight")


def test_capstone_and_showcase(client, admin, open_applications):
    token = accepted(client, admin)
    body = {"brief": "market-price-agent", "title": "Kano rice watch", "description": "Answers questions about rice prices in Kano markets.", "public": False}
    assert client.put(f"/api/learner/{token}/capstone", json=body).status_code == 200
    assert client.get("/api/showcase").json()["items"] == []
    client.put(f"/api/learner/{token}/capstone", json={**body, "public": True})
    client.post(f"/api/learner/{token}/submissions", json={"week": 11, "value": "https://huggingface.co/spaces/ngozi/rice"})
    [item] = client.get("/api/showcase").json()["items"]
    assert item["maker"] == "Ngozi O." and item["url"].endswith("/rice") and item["brief"] == "Market price agent"
    assert "email" not in str(item)
    assert admin.get("/api/admin/learners").json()["learners"][0]["capstone"] == "Kano rice watch"


def test_attendance(client, admin, open_applications):
    a = accepted(client, admin)
    accepted(client, admin, email="b@x.com", name="Bisi Lawal")
    roster = admin.get("/api/admin/attendance/3").json()
    ids = [r["learner_id"] for r in roster]
    admin.put("/api/admin/attendance/3", json={"present": ids[:1]})
    assert sum(r["present"] for r in admin.get("/api/admin/attendance/3").json()) == 1
    present_name = next(r["name"] for r in admin.get("/api/admin/attendance/3").json() if r["present"])
    if present_name == "Ngozi Okafor":
        assert client.get(f"/api/learner/{a}").json()["attended"] == [3]


def test_certificate_flow(client, admin, open_applications):
    token = accepted(client, admin)
    s = admin.get("/api/admin/settings").json()
    admin.put("/api/admin/settings", json={**s, "labs_required": 2})
    assert "more lab" in client.get(f"/api/learner/{token}/certificate").json()["reason"]
    for w in (2, 3):
        client.post(f"/api/learner/{token}/submissions", json={"week": w, "value": make_code("ngozi@example.com", w)})
    cert = client.get(f"/api/learner/{token}/certificate").json()
    assert cert["available"] is False and "demo day" in cert["reason"]
    s = admin.get("/api/admin/settings").json()
    admin.put("/api/admin/settings", json={**s, "certificates_open": True})
    cert = client.get(f"/api/learner/{token}/certificate").json()
    assert cert["available"] and cert["code"].startswith("AKL-")
    assert client.get(f"/api/learner/{token}/certificate").json()["code"] == cert["code"]  # stable
    v = client.get(f"/api/certificates/{cert['code'].lower()}").json()
    assert v["valid"] and v["name"] == "Ngozi Okafor" and v["labs_done"] == 2
    assert client.get("/api/certificates/AKL-0000-0000").status_code == 404


def test_demo_day_registration(client, admin):
    r = client.post("/api/demo-day/register", json={"name": "Funke", "email": "f@x.com", "organisation": "Fund", "consent": False})
    assert r.status_code == 422
    for _ in range(2):
        assert client.post("/api/demo-day/register", json={"name": "Funke", "email": "f@x.com", "organisation": "Fund", "consent": True}).status_code == 201
    assert len(admin.get("/api/admin/demo-day").json()["registrations"]) == 1
    assert "Funke" in admin.get("/api/admin/export/demo-day.csv").text


def test_deleting_learner_removes_everything(client, admin, open_applications):
    token = accepted(client, admin)
    client.put(f"/api/learner/{token}/reflections/2", json={"text": "A reflection that is long enough to save."})
    client.put(f"/api/learner/{token}/capstone", json={"brief": "own", "title": "My app", "description": "Something useful for my community."})
    [row] = admin.get("/api/admin/applications").json()
    assert admin.delete(f"/api/admin/applications/{row['id']}").status_code == 200
    assert admin.get("/api/admin/reflections").json() == []
