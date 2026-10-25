"""Settings read from environment variables."""
import os
import secrets
import sys
from dataclasses import dataclass, field
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]


def _secret_key():
    key = os.environ.get("SECRET_KEY")
    if key:
        return key
    if os.environ.get("ENV", "development") == "production":
        sys.exit("SECRET_KEY must be set in production.")
    # Development only: sessions reset whenever the server restarts.
    return secrets.token_urlsafe(32)


@dataclass
class Config:
    env: str = field(default_factory=lambda: os.environ.get("ENV", "development"))
    database_url: str = field(
        default_factory=lambda: os.environ.get("DATABASE_URL", f"sqlite:///{BACKEND_DIR / 'akada.db'}")
    )
    secret_key: str = field(default_factory=_secret_key)
    admin_email: str | None = field(default_factory=lambda: os.environ.get("ADMIN_EMAIL"))
    admin_password: str | None = field(default_factory=lambda: os.environ.get("ADMIN_PASSWORD"))
    # Where the built frontend lives; served at / when present.
    frontend_dist: Path = field(
        default_factory=lambda: Path(os.environ.get("FRONTEND_DIST", BACKEND_DIR.parent / "frontend" / "dist"))
    )
    # The public site address, used to build learner links.
    public_url: str = field(default_factory=lambda: os.environ.get("PUBLIC_URL", "http://localhost:5173"))
    session_days: int = 7

    @property
    def secure_cookies(self):
        return self.env == "production"


config = Config()
