"""Akada Labs web app: the API, plus the built frontend when present."""
from fastapi import FastAPI, Request
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy import select

from .config import Config, config as default_config
from .db import Database
from .models import AdminUser, Settings
from .routers import admin, learner, public
from .security import hash_password

FIELD_NAMES = {"whatsapp": "WhatsApp number", "is_adult": "Age", "live_sessions": "Live sessions",
               "lab_hours": "Lab hours", "coded_before": "Coding experience", "problem": "Your problem"}


def friendly_errors(_request: Request, exc: RequestValidationError):
    """Turn validation errors into {detail, errors: {field: message}} for forms."""
    errors = {}
    for err in exc.errors():
        field = str(err["loc"][-1]) if err["loc"] else "body"
        msg = err["msg"].removeprefix("Value error, ")
        if err["type"] == "missing":
            msg = "This is required."
        elif err["type"] == "literal_error":
            msg = "Pick one of the options."
        elif err["type"] == "string_too_short":
            msg = f"Please write at least {err['ctx']['min_length']} characters."
        elif "email" in field and "email" in msg.lower():
            msg = "Enter a valid email address."
        errors.setdefault(field, msg)
    first = next(iter(errors.items()), ("", "Check the form and try again."))
    label = FIELD_NAMES.get(first[0], first[0].replace("_", " ").capitalize())
    return JSONResponse({"detail": f"{label}: {first[1]}" if first[0] else first[1], "errors": errors}, 422)


def add_missing_columns(engine):
    """Add columns introduced after a database was created. A stopgap until Alembic."""
    from sqlalchemy import inspect, text
    from .db import Base
    inspector = inspect(engine)
    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            if not inspector.has_table(table.name):
                continue
            have = {c["name"] for c in inspector.get_columns(table.name)}
            for col in table.columns:
                if col.name not in have and col.default is not None and not callable(col.default.arg):
                    kind = col.type.compile(engine.dialect)
                    default = col.default.arg
                    literal = f"'{default}'" if isinstance(default, str) else str(int(default)) if isinstance(default, bool) else str(default)
                    conn.execute(text(f'ALTER TABLE {table.name} ADD COLUMN {col.name} {kind} DEFAULT {literal}'))


def bootstrap(db, cfg):
    db.create_all()
    add_missing_columns(db.engine)
    with db.Session() as s:
        if s.scalar(select(Settings)) is None:
            s.add(Settings())
        if cfg.admin_email and cfg.admin_password:
            email = cfg.admin_email.strip().lower()
            if s.scalar(select(AdminUser).where(AdminUser.email == email)) is None:
                s.add(AdminUser(email=email, name="Admin", password_hash=hash_password(cfg.admin_password)))
        s.commit()


def init_sentry(cfg):
    if not cfg.sentry_dsn:
        return
    try:
        import sentry_sdk
        sentry_sdk.init(dsn=cfg.sentry_dsn, environment=cfg.env, traces_sample_rate=0.0, send_default_pii=False)
    except ImportError:
        print("SENTRY_DSN is set but sentry-sdk isn't installed; skipping error tracking.")


def create_app(cfg: Config | None = None):
    cfg = cfg or default_config
    init_sentry(cfg)
    app = FastAPI(title="Akada Labs", docs_url="/api/docs", openapi_url="/api/openapi.json")
    app.state.config = cfg
    app.state.db = Database(cfg.database_url)
    bootstrap(app.state.db, cfg)

    # Compress responses: the in-browser Python download shrinks by about two thirds
    app.add_middleware(GZipMiddleware, minimum_size=1024, compresslevel=6)
    app.add_exception_handler(RequestValidationError, friendly_errors)
    app.include_router(public.router)
    app.include_router(learner.router)
    app.include_router(admin.auth)
    app.include_router(admin.router)

    @app.get("/api/health")
    def health():
        """For uptime monitors: the database must answer; the chunker is reported but optional."""
        from sqlalchemy import text
        with app.state.db.Session() as s:
            s.execute(text("SELECT 1"))
        status = {"ok": True, "database": "ok"}
        if cfg.chunker_url:
            from .services import chunker_alive
            status["chunker"] = "ok" if chunker_alive(cfg) else "unreachable"
        return status

    dist = cfg.frontend_dist
    if dist.is_dir():
        @app.get("/{path:path}", include_in_schema=False)
        def spa(path: str):
            if path.startswith("api/"):
                return JSONResponse({"detail": "Not found."}, 404)
            root = dist.resolve()
            file = (dist / path).resolve()
            if path and root in file.parents:
                if file.is_file():
                    return FileResponse(file)
                # Static sites inside dist (the browser lab at /lab/) have their own index.html
                if file.is_dir() and (file / "index.html").is_file():
                    return FileResponse(file / "index.html")
            return FileResponse(dist / "index.html")

    return app


app = create_app()
