# backend/src/routes/health.py

import os
import subprocess
from flask import Blueprint, jsonify
from sqlalchemy import text

from ..extensions import db, limiter

bp = Blueprint("health", __name__)

def _git_sha() -> str:
    sha = os.getenv("GIT_SHA")
    if sha:
        return sha
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"],
            stderr=subprocess.DEVNULL
        ).decode().strip()
    except Exception:
        return "unknown"

@bp.get("/api/health")
@limiter.exempt
def health():
    ok = True
    try:
        db.session.execute(text("SELECT 1"))
    except Exception:
        ok = False
    status = 200 if ok else 500
    return jsonify({"db": "ok" if ok else "fail", "git_sha": _git_sha()}), status

@bp.get("/healthz")
@limiter.exempt
def healthz():
    """Simple health check endpoint for Render"""
    return jsonify({"status": "ok"}), 200

@bp.get("/readyz")
@limiter.exempt
def readyz():
    """Readiness probe that checks database connectivity"""
    try:
        # Check the database connection
        db.session.execute(text("SELECT 1"))
        return jsonify({"status": "ok", "db": "connected"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
