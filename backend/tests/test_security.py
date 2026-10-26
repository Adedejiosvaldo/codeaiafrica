from conftest import ADMIN, application


def test_application_needs_consent(client, admin, open_applications):
    r = client.post("/api/applications", json=application(consent=False))
    assert r.status_code == 422 and "privacy notice" in r.json()["detail"]
    assert client.post("/api/applications", json=application()).status_code == 201
    [row] = admin.get("/api/admin/applications").json()
    assert admin.get(f"/api/admin/applications/{row['id']}").status_code == 200


def test_login_is_rate_limited(limited, client):
    for _ in range(10):
        client.post("/api/admin/login", json={**ADMIN, "password": "wrong"})
    r = client.post("/api/admin/login", json=ADMIN)
    assert r.status_code == 429 and "Retry-After" in r.headers


def test_applications_are_rate_limited(limited, client, admin, open_applications):
    codes = [client.post("/api/applications", json=application(email=f"r{i}@x.com")).status_code for i in range(6)]
    assert codes[:5] == [201] * 5 and codes[5] == 429


def make_ta(admin, app):
    from fastapi.testclient import TestClient
    assert admin.post("/api/admin/team", json={"email": "ta@akada.test", "password": "ta password 123", "role": "ta"}).status_code == 201
    ta = TestClient(app)
    assert ta.post("/api/admin/login", json={"email": "ta@akada.test", "password": "ta password 123"}).json()["role"] == "ta"
    return ta


def test_ta_can_score_but_not_decide(app, client, admin, open_applications):
    client.post("/api/applications", json=application())
    [row] = admin.get("/api/admin/applications").json()
    ta = make_ta(admin, app)
    assert ta.patch(f"/api/admin/applications/{row['id']}", json={"q9_score": 2}).status_code == 200
    assert ta.patch(f"/api/admin/applications/{row['id']}", json={"status": "accepted"}).status_code == 403
    assert ta.post("/api/admin/selection/apply", json={}).status_code == 403
    s = ta.get("/api/admin/settings").json()
    assert ta.put("/api/admin/settings", json=s).status_code == 403
    assert ta.delete(f"/api/admin/applications/{row['id']}").status_code == 403
    assert ta.get("/api/admin/audit").status_code == 403


def test_delete_application_erases_learner(client, admin, open_applications):
    client.post("/api/applications", json=application())
    [row] = admin.get("/api/admin/applications").json()
    token = admin.patch(f"/api/admin/applications/{row['id']}", json={"status": "accepted"}).json()["learner_token"]
    assert admin.delete(f"/api/admin/applications/{row['id']}").status_code == 200
    assert admin.get("/api/admin/applications").json() == []
    assert client.get(f"/api/learner/{token}").status_code == 404


def test_audit_log_records_actions(app, client, admin, open_applications):
    client.post("/api/applications", json=application())
    [row] = admin.get("/api/admin/applications").json()
    admin.patch(f"/api/admin/applications/{row['id']}", json={"q9_score": 3})
    admin.get("/api/admin/export/applications.csv")
    actions = [e["action"] for e in admin.get("/api/admin/audit").json()]
    assert {"signed in", "changed settings", "scored problem answer", "exported"} <= set(actions)


def test_team_roles(app, admin):
    make_ta(admin, app)
    team = admin.get("/api/admin/team").json()
    ta = next(m for m in team if m["role"] == "ta")
    me = next(m for m in team if m["role"] == "admin")
    assert admin.patch(f"/api/admin/team/{me['id']}", json={"role": "ta"}).status_code == 400
    assert admin.patch(f"/api/admin/team/{ta['id']}", json={"role": "admin"}).status_code == 200
    assert admin.delete(f"/api/admin/team/{me['id']}").status_code == 400
    assert admin.delete(f"/api/admin/team/{ta['id']}").status_code == 200
