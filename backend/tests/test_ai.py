import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import Config
from app.main import create_app
from app.services import make_client
from conftest import ADMIN, application
from fake_provider import handle


@pytest.fixture
def ai_app(tmp_path):
    cfg = Config(database_url=f"sqlite:///{tmp_path / 'ai.db'}", secret_key="t", admin_email=ADMIN["email"],
                 admin_password=ADMIN["password"], frontend_dist=tmp_path / "none",
                 ai_base_url="http://fake/v1", ai_api_key="test-key", ai_models=["small-model", "big-model"],
                 embed_base_url="http://fake/v1", embed_api_key="k", embed_model="fake-embed",
                 chunker_url="http://chunker:8080", ai_daily_limit=3, ai_daily_budget=100, ai_max_tokens=200)
    app = create_app(cfg)
    app.state.limiter.check = lambda *a, **k: 0
    calls = []

    def recording(request):
        calls.append(request)
        return handle(request)
    app.state.http = make_client(httpx.MockTransport(recording))
    app.state.calls = calls
    return app


@pytest.fixture
def token(ai_app):
    admin = TestClient(ai_app)
    admin.post("/api/admin/login", json=ADMIN)
    s = admin.get("/api/admin/settings").json()
    admin.put("/api/admin/settings", json={**s, "applications_open": True})
    TestClient(ai_app).post("/api/applications", json=application())
    [row] = admin.get("/api/admin/applications").json()
    return admin.patch(f"/api/admin/applications/{row['id']}", json={"status": "accepted"}).json()["learner_token"]


def test_chat_hides_key_caps_tokens_and_counts(ai_app, token):
    c = TestClient(ai_app)
    r = c.post(f"/api/learner/{token}/ai/chat", json={"messages": [{"role": "user", "content": "hi"}], "max_tokens": 5000})
    assert r.status_code == 200 and "Practice reply" in r.json()["message"]["content"]
    sent = ai_app.state.calls[-1]
    assert sent.headers["authorization"] == "Bearer test-key"
    import json
    body = json.loads(sent.content)
    assert body["model"] == "small-model" and body["max_tokens"] == 200
    assert "test-key" not in r.text
    assert r.json()["remaining"] == 2


def test_repeat_calls_are_cached_and_free(ai_app, token):
    c = TestClient(ai_app)
    msg = {"messages": [{"role": "user", "content": "same question"}]}
    first = c.post(f"/api/learner/{token}/ai/chat", json=msg).json()
    again = c.post(f"/api/learner/{token}/ai/chat", json=msg).json()
    assert again["cached"] and again["message"] == first["message"]
    assert len(ai_app.state.calls) == 1 and again["remaining"] == 2


def test_daily_limit(ai_app, token):
    c = TestClient(ai_app)
    msgs = [{"messages": [{"role": "user", "content": f"hi {i}"}]} for i in range(4)]
    codes = [c.post(f"/api/learner/{token}/ai/chat", json=m).status_code for m in msgs]
    assert codes == [200, 200, 200, 429]
    assert c.get(f"/api/learner/{token}/ai/usage").json()["remaining"] == 0


def test_class_budget(ai_app, token):
    ai_app.state.config.ai_daily_budget = 1
    c = TestClient(ai_app)
    assert c.post(f"/api/learner/{token}/ai/chat", json={"messages": [{"role": "user", "content": "a"}]}).status_code == 200
    r = c.post(f"/api/learner/{token}/ai/chat", json={"messages": [{"role": "user", "content": "b"}]})
    assert r.status_code == 429 and "class" in r.json()["detail"]


def test_model_allowlist_and_tools(ai_app, token):
    c = TestClient(ai_app)
    bad = c.post(f"/api/learner/{token}/ai/chat", json={"messages": [{"role": "user", "content": "x"}], "model": "gpt-9"})
    assert bad.status_code == 400 and "isn't allowed" in bad.json()["detail"]
    tools = [{"type": "function", "function": {"name": "calculator", "parameters": {"type": "object", "properties": {}}}}]
    r = c.post(f"/api/learner/{token}/ai/chat", json={"messages": [{"role": "user", "content": "2+2?"}], "tools": tools})
    assert r.json()["message"]["tool_calls"][0]["function"]["name"] == "calculator"


def test_provider_errors_are_friendly(ai_app, token):
    ai_app.state.config.ai_api_key = "bad-key"
    r = TestClient(ai_app).post(f"/api/learner/{token}/ai/chat", json={"messages": [{"role": "user", "content": "x"}]})
    assert r.status_code == 503 and "tell your TA" in r.json()["detail"]


def test_not_configured(ai_app, token):
    ai_app.state.config.ai_api_key = None
    r = TestClient(ai_app).post(f"/api/learner/{token}/ai/chat", json={"messages": [{"role": "user", "content": "x"}]})
    assert r.status_code == 503 and "isn't set up" in r.json()["detail"]


def test_embeddings(ai_app, token):
    r = TestClient(ai_app).post(f"/api/learner/{token}/ai/embed", json={"texts": ["rice price", "rice prices", "football"]})
    vecs = r.json()["embeddings"]
    assert len(vecs) == 3 and len(vecs[0]) == 64


def test_chunk_proxy_and_zero_overlap(ai_app, token):
    c = TestClient(ai_app)
    text = "word " * 100
    r = c.post(f"/api/learner/{token}/chunk", json={"text": text, "chunk_size": 50, "overlap": 0})
    assert r.status_code == 200 and r.json()["count"] > 1 and "at least 1" in r.json()["note"]
    import json
    assert json.loads(ai_app.state.calls[-1].content)["overlap"] == 1
    assert c.post(f"/api/learner/{token}/chunk", json={"text": "x", "chunk_size": 50, "overlap": 60}).status_code == 400
    # chunking doesn't use up AI calls
    assert c.get(f"/api/learner/{token}/ai/usage").json()["used"] == 0


def test_admin_usage_view(ai_app, token):
    c = TestClient(ai_app)
    c.post(f"/api/learner/{token}/ai/chat", json={"messages": [{"role": "user", "content": "hi"}]})
    admin = TestClient(ai_app)
    admin.post("/api/admin/login", json=ADMIN)
    u = admin.get("/api/admin/ai-usage").json()
    assert u["today"]["calls"] == 1 and u["limits"]["per_learner"] == 3
    assert u["learners"][0]["calls"] == 1 and u["configured"]["chat"] is True
