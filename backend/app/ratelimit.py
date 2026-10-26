"""A small in-memory rate limiter (one app process; fine for a single VPS)."""
import math
import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException, Request


class RateLimiter:
    def __init__(self):
        self.hits: dict[str, deque] = defaultdict(deque)
        self.lock = Lock()

    def check(self, key: str, limit: int, window: float):
        """Record a hit. Returns seconds to wait if over the limit, else 0."""
        now = time.monotonic()
        with self.lock:
            q = self.hits[key]
            while q and q[0] <= now - window:
                q.popleft()
            if len(q) >= limit:
                return window - (now - q[0])
            q.append(now)
            return 0


def client_ip(request: Request):
    return request.client.host if request.client else "unknown"


def limit(name: str, count: int, window: float, message: str = "Too many tries. Please wait a little and try again."):
    """FastAPI dependency: at most `count` requests per `window` seconds per client IP."""
    def dependency(request: Request):
        wait = request.app.state.limiter.check(f"{name}:{client_ip(request)}", count, window)
        if wait:
            minutes = max(1, math.ceil(wait / 60))
            raise HTTPException(429, f"{message} (about {minutes} minute{'s' if minutes > 1 else ''})",
                                headers={"Retry-After": str(math.ceil(wait))})
    return dependency
