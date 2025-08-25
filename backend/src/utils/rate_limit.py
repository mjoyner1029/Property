# backend/src/utils/rate_limit.py
"""
Lightweight rate limiting utilities for API endpoints.

Features
- In-memory, thread-safe rate limiter (default)
- Optional Redis-backed fixed-window counter if redis is available & configured
- Request-scoped keys (IP + endpoint by default) or custom key_function
- Honors Flask config: RATELIMIT_ENABLED, RATELIMIT_STORAGE_URI / REDIS_URL
- Standard headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
"""

from __future__ import annotations

import time
import functools
import threading
from typing import Callable, Tuple, Optional

from flask import request, jsonify, current_app

try:
    # Optional: redis-py
    from redis import Redis  # type: ignore
    _HAS_REDIS = True
except Exception:
    _HAS_REDIS = False


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------
class RateLimitExceededError(Exception):
    """Raised when a caller exceeds the configured rate limit."""

    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message)
        self.message = message

    def __str__(self) -> str:  # pragma: no cover
        return f"RateLimitExceededError: {self.message}"


# ---------------------------------------------------------------------------
# Backends
# ---------------------------------------------------------------------------
class BaseLimiter:
    """Abstract limiter backend."""

    def check_rate_limit(self, key: str, limit: int, period: int) -> Tuple[bool, int, int]:
        """
        Returns (allowed, remaining, reset_epoch).
        - allowed: whether the request is allowed
        - remaining: remaining tokens in the current window (never negative)
        - reset_epoch: unix timestamp when the current window resets
        """
        raise NotImplementedError


class InMemoryLimiter(BaseLimiter):
    """Simple thread-safe in-memory fixed-window limiter."""

    def __init__(self) -> None:
        self._lock = threading.RLock()
        # key -> [timestamps]
        self._requests = {}
        self._cleanup_interval = 3600  # seconds
        self._last_cleanup = time.time()

    def _cleanup(self, now: float) -> None:
        # Remove stale keys (no activity in last day)
        stale: list[str] = []
        for key, ts_list in self._requests.items():
            if not ts_list or (now - max(ts_list) > 86400):
                stale.append(key)
        for k in stale:
            self._requests.pop(k, None)
        self._last_cleanup = now

    def check_rate_limit(self, key: str, limit: int, period: int) -> Tuple[bool, int, int]:
        now = time.time()
        window_start = now - period
        window_reset = int(now // period * period + period)

        with self._lock:
            if now - self._last_cleanup > self._cleanup_interval:
                self._cleanup(now)

            lst = self._requests.setdefault(key, [])
            # keep only timestamps within the window
            i = 0
            for i, ts in enumerate(lst):
                if ts >= window_start:
                    break
            if lst and (i > 0):
                lst = lst[i:]
                self._requests[key] = lst
            elif not lst:
                lst = self._requests[key]

            if len(lst) >= limit:
                remaining = 0
                return False, remaining, window_reset

            lst.append(now)
            remaining = max(0, limit - len(lst))
            return True, remaining, window_reset


class RedisLimiter(BaseLimiter):
    """
    Fixed-window counter using Redis INCR + EXPIRE.

    Key format: rl:{key}:{window_start}
    """

    def __init__(self, redis: Redis) -> None:
        self.redis = redis

    def check_rate_limit(self, key: str, limit: int, period: int) -> Tuple[bool, int, int]:
        now = int(time.time())
        window_start = now - (now % period)
        reset_at = window_start + period
        redis_key = f"rl:{key}:{window_start}"

        # INCR the counter and set expiration to end of window
        count = self.redis.incr(redis_key)
        # Only the first caller needs to set expire; harmless to call repeatedly
        ttl = reset_at - now
        if ttl > 0:
            self.redis.expire(redis_key, ttl)

        allowed = count <= limit
        remaining = max(0, limit - int(count))
        return allowed, remaining, reset_at


# ---------------------------------------------------------------------------
# Factory / resolver
# ---------------------------------------------------------------------------
def _resolve_backend() -> BaseLimiter:
    """
    Resolve and memoize a limiter backend in app.extensions['assetanchor_rl'].
    Prefers Redis if configured and available, else falls back to in-memory.
    """
    app = current_app._get_current_object()
    ext_key = "assetanchor_rl"

    if not hasattr(app, "extensions"):
        app.extensions = {}  # type: ignore[attr-defined]

    cached = app.extensions.get(ext_key)
    if cached:
        return cached  # type: ignore[return-value]

    # Try Redis if available and configured
    storage_uri = app.config.get("RATELIMIT_STORAGE_URI") or app.config.get("REDIS_URL")
    if _HAS_REDIS and storage_uri:
        try:
            redis_client = Redis.from_url(storage_uri)  # type: ignore
            # Simple ping to validate connectivity
            redis_client.ping()
            backend: BaseLimiter = RedisLimiter(redis_client)
            app.extensions[ext_key] = backend
            return backend
        except Exception:
            # Fall back to in-memory silently if Redis is misconfigured
            pass

    backend = InMemoryLimiter()
    app.extensions[ext_key] = backend
    return backend


# ---------------------------------------------------------------------------
# Decorator
# ---------------------------------------------------------------------------
def _default_key() -> str:
    """
    Default key combines caller IP + endpoint to scope limits per-route.
    If endpoint is unavailable, fallback to path.
    """
    ip = request.headers.get("X-Forwarded-For", request.remote_addr or "unknown").split(",")[0].strip()
    endpoint = request.endpoint or request.path or "*"
    return f"{ip}:{endpoint}"


def rate_limit(limit: int, period: int, key_function: Optional[Callable[[], str]] = None):
    """
    Decorator for rate-limiting Flask routes.

    Args:
        limit: max number of requests in the window
        period: window size in seconds
        key_function: optional callable that returns a unique key string
                      (default: IP + endpoint)

    Example:
        @app.get("/api/endpoint")
        @rate_limit(limit=5, period=60)
        def my_endpoint():
            return {"ok": True}
    """

    def decorator(f):
        @functools.wraps(f)
        def wrapped(*args, **kwargs):
            app = current_app._get_current_object()
            enabled = bool(app.config.get("RATELIMIT_ENABLED", True))

            # No-op if disabled (tests or local dev)
            if not enabled:
                resp = f(*args, **kwargs)
                # Still provide informational headers if possible
                if hasattr(resp, "headers"):
                    resp.headers["X-RateLimit-Limit"] = str(limit)
                    resp.headers["X-RateLimit-Remaining"] = "inf"
                    resp.headers["X-RateLimit-Reset"] = str(int(time.time()))
                return resp

            key = (key_function or _default_key)()
            backend = _resolve_backend()

            allowed, remaining, reset_at = backend.check_rate_limit(key, limit, period)
            if not allowed:
                resp = jsonify(
                    {
                        "error": "Rate limit exceeded",
                        "code": 429,
                        "message": "Too many requests. Try again later.",
                    }
                )
                resp.status_code = 429
                resp.headers["Retry-After"] = str(max(0, int(reset_at - time.time())))
                resp.headers["X-RateLimit-Limit"] = str(limit)
                resp.headers["X-RateLimit-Remaining"] = "0"
                resp.headers["X-RateLimit-Reset"] = str(int(reset_at))
                return resp

            resp = f(*args, **kwargs)
            if hasattr(resp, "headers"):
                resp.headers["X-RateLimit-Limit"] = str(limit)
                resp.headers["X-RateLimit-Remaining"] = str(max(0, int(remaining)))
                resp.headers["X-RateLimit-Reset"] = str(int(reset_at))
            return resp

        return wrapped

    return decorator
