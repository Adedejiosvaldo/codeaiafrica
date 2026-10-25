"""Admin passwords and sessions."""
import base64
import hashlib
import hmac
import os

from fastapi import Depends, HTTPException, Request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

COOKIE = "akada_admin"
_N, _R, _P = 2**14, 8, 1


def hash_password(password):
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=_N, r=_R, p=_P)
    return "scrypt$" + base64.b64encode(salt).decode() + "$" + base64.b64encode(digest).decode()


def verify_password(password, stored):
    try:
        _, salt, digest = stored.split("$")
        expected = base64.b64decode(digest)
        got = hashlib.scrypt(password.encode(), salt=base64.b64decode(salt), n=_N, r=_R, p=_P)
        return hmac.compare_digest(got, expected)
    except Exception:
        return False


def serializer(request):
    return URLSafeTimedSerializer(request.app.state.config.secret_key, salt="admin-session")


def make_session(request, admin_id):
    return serializer(request).dumps({"admin": admin_id})


def get_db(request: Request):
    with request.app.state.db.Session() as session:
        yield session


def require_admin(request: Request, db=Depends(get_db)):
    from .models import AdminUser

    token = request.cookies.get(COOKIE)
    if not token:
        raise HTTPException(401, "Please sign in.")
    max_age = request.app.state.config.session_days * 86400
    try:
        data = serializer(request).loads(token, max_age=max_age)
    except (BadSignature, SignatureExpired):
        raise HTTPException(401, "Your session has ended. Please sign in again.")
    admin = db.get(AdminUser, data.get("admin"))
    if admin is None:
        raise HTTPException(401, "Please sign in.")
    return admin
