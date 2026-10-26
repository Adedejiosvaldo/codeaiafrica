"""Settings read from environment variables. See .env.example for a full list."""
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


def env(name, default=None):
    value = os.environ.get(name)
    return value if value not in (None, "") else default


def env_int(name, default):
    try:
        return int(env(name, default))
    except ValueError:
        return default


@dataclass
class Config:
    env: str = field(default_factory=lambda: env("ENV", "development"))
    database_url: str = field(default_factory=lambda: env("DATABASE_URL", f"sqlite:///{BACKEND_DIR / 'akada.db'}"))
    secret_key: str = field(default_factory=_secret_key)
    admin_email: str | None = field(default_factory=lambda: env("ADMIN_EMAIL"))
    admin_password: str | None = field(default_factory=lambda: env("ADMIN_PASSWORD"))
    # Where the built frontend lives; served at / when present.
    frontend_dist: Path = field(default_factory=lambda: Path(env("FRONTEND_DIST", BACKEND_DIR.parent / "frontend" / "dist")))
    # The public site address, used to build learner links in emails and exports.
    public_url: str = field(default_factory=lambda: env("PUBLIC_URL", "http://localhost:5173"))
    session_days: int = 7

    # Document chunker (github.com/Adedejiosvaldo/rag-chunker). Unset = chunking turned off.
    chunker_url: str | None = field(default_factory=lambda: env("CHUNKER_URL"))

    # AI provider for chat, through an OpenAI-compatible API. The key never leaves the server.
    ai_base_url: str = field(default_factory=lambda: env("AI_BASE_URL", "https://api.groq.com/openai/v1"))
    ai_api_key: str | None = field(default_factory=lambda: env("AI_API_KEY"))
    # Allowed models, comma separated; the first is the default.
    ai_models: list[str] = field(default_factory=lambda: [
        m.strip() for m in env("AI_MODELS", "llama-3.1-8b-instant").split(",") if m.strip()])
    # Embeddings (week 8-9). Groq has no embeddings API, so this is usually a different provider, e.g. Gemini.
    embed_base_url: str | None = field(default_factory=lambda: env("EMBED_BASE_URL"))
    embed_api_key: str | None = field(default_factory=lambda: env("EMBED_API_KEY"))
    embed_model: str | None = field(default_factory=lambda: env("EMBED_MODEL"))
    # Limits: calls per learner per day (Lagos time), all calls per day, and longest reply allowed.
    ai_daily_limit: int = field(default_factory=lambda: env_int("AI_DAILY_LIMIT", 100))
    ai_daily_budget: int = field(default_factory=lambda: env_int("AI_DAILY_BUDGET", 3000))
    ai_max_tokens: int = field(default_factory=lambda: env_int("AI_MAX_TOKENS", 512))

    # Email (SMTP). Unset = emails are turned off and the team shares links by hand.
    smtp_host: str | None = field(default_factory=lambda: env("SMTP_HOST"))
    smtp_port: int = field(default_factory=lambda: env_int("SMTP_PORT", 587))
    smtp_user: str | None = field(default_factory=lambda: env("SMTP_USER"))
    smtp_password: str | None = field(default_factory=lambda: env("SMTP_PASSWORD"))
    smtp_from: str | None = field(default_factory=lambda: env("SMTP_FROM"))

    # Error tracking (optional): a Sentry DSN.
    sentry_dsn: str | None = field(default_factory=lambda: env("SENTRY_DSN"))

    @property
    def secure_cookies(self):
        return self.env == "production"

    @property
    def email_enabled(self):
        return bool(self.smtp_host and self.smtp_from)


config = Config()
