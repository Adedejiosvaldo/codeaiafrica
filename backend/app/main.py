"""Akada Labs web app: the API, plus the built frontend when present."""
from fastapi import FastAPI, Request
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


def create_app(cfg: Config | None = None):
    cfg = cfg or default_config
    app = FastAPI(title="Akada Labs", docs_url="/api/docs", openapi_url="/api/openapi.json")
    app.state.config = cfg
    app.state.db = Database(cfg.database_url)
    bootstrap(app.state.db, cfg)

    app.add_exception_handler(RequestValidationError, friendly_errors)
    app.include_router(public.router)
    app.include_router(learner.router)
    app.include_router(admin.auth)
    app.include_router(admin.router)

    @app.get("/api/health")
    def health():
        return {"ok": True}

    dist = cfg.frontend_dist
    if dist.is_dir():
        @app.get("/{path:path}", include_in_schema=False)
        def spa(path: str):
            if path.startswith("api/"):
                return JSONResponse({"detail": "Not found."}, 404)
            file = (dist / path).resolve()
            if path and file.is_file() and dist.resolve() in file.parents:
                return FileResponse(file)
            return FileResponse(dist / "index.html")

    return app


app = create_app()
