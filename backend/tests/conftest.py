import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import Config  # noqa: E402
from app.main import create_app  # noqa: E402

ADMIN = {"email": "admin@akada.test", "password": "correct horse battery"}


@pytest.fixture
def app(tmp_path):
    cfg = Config(database_url=f"sqlite:///{tmp_path / 'test.db'}", secret_key="test",
                 admin_email=ADMIN["email"], admin_password=ADMIN["password"], frontend_dist=tmp_path / "none")
    app = create_app(cfg)
    app.state.limiter.check = lambda *a, **k: 0  # rate limits off, except in tests that ask for them
    return app


@pytest.fixture
def limited(app):
    from app.ratelimit import RateLimiter
    app.state.limiter = RateLimiter()
    return app


@pytest.fixture
def client(app):
    return TestClient(app)


@pytest.fixture
def admin(app):
    c = TestClient(app)
    assert c.post("/api/admin/login", json=ADMIN).status_code == 200
    return c


def application(**overrides):
    body = {
        "name": "Ngozi Okafor", "email": "ngozi@example.com", "whatsapp": "0803 123 4567", "is_adult": True,
        "city": "Enugu", "country": "Nigeria", "occupation": "student", "device": "own_laptop",
        "live_sessions": "yes", "lab_hours": "2_4", "coded_before": "never",
        "problem": "Traders in my market can't predict price changes for rice and beans.", "commits": True,
        "consent": True,
    }
    body.update(overrides)
    return body


@pytest.fixture
def open_applications(admin):
    s = admin.get("/api/admin/settings").json()
    s["applications_open"] = True
    assert admin.put("/api/admin/settings", json=s).status_code == 200
