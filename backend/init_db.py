# backend/init_db.py
"""
Initialize the database and seed an admin user.

Usage examples:
  python backend/init_db.py --email admin@example.com --password 'Password123!' --name 'System Admin'
  python backend/init_db.py --reset-password --email admin@example.com --password 'NewStrongPass!'

Notes:
- In production, prefer running Alembic migrations instead of db.create_all().
- By default, this script will NOT call create_all() when APP_ENV=production unless
  you pass --skip-create-all=false (or set ALLOW_CREATE_ALL=true).
"""
from __future__ import annotations

import argparse
import logging
import os
import sys
from datetime import datetime
from typing import Optional

# Ensure backend/src is importable when running the file directly
THIS_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(THIS_DIR)
if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)

from src.extensions import db  # type: ignore  # noqa: E402
from src.app import create_app  # type: ignore  # noqa: E402
from src.models.user import User  # type: ignore  # noqa: E402


def _init_logging(level: str = "INFO") -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )


def _set_user_password(user: User, raw_password: str) -> None:
    """Use model helper if available; otherwise do a secure fallback."""
    if hasattr(user, "set_password") and callable(getattr(user, "set_password")):
        user.set_password(raw_password)  # type: ignore[attr-defined]
    else:
        # Fallback: use Werkzeug hashing if your model lacks set_password()
        from werkzeug.security import generate_password_hash

        user.password_hash = generate_password_hash(raw_password)  # type: ignore[attr-defined]


def create_or_update_admin(
    email: str,
    password: str,
    name: str = "System Administrator",
    reset_password: bool = False,
) -> User:
    """
    Create an admin user if not exists; optionally reset password if user exists.
    Returns the user instance.
    """
    logger = logging.getLogger("init_db")
    email = (email or "").strip().lower()
    if not email or not password:
        raise ValueError("Admin email and password are required.")

    user: Optional[User] = User.query.filter_by(email=email).first()

    if user is None:
        logger.info("Creating admin user: %s", email)
        user = User(
            email=email,
            name=name,
            role="admin",
            is_verified=True,
            email_verified_at=datetime.utcnow(),
        )
        _set_user_password(user, password)
        db.session.add(user)
        db.session.commit()
        logger.info("Admin user created successfully (id=%s).", getattr(user, "id", None))
    else:
        logger.info("Admin user already exists: %s (id=%s)", email, getattr(user, "id", None))
        updated = False
        if reset_password:
            _set_user_password(user, password)
            updated = True
            logger.info("Admin password reset requested; applied new password.")
        if not getattr(user, "is_verified", True):
            user.is_verified = True  # type: ignore[attr-defined]
            user.email_verified_at = datetime.utcnow()  # type: ignore[attr-defined]
            updated = True
            logger.info("Admin user marked verified.")

        if updated:
            db.session.commit()
            logger.info("Admin user updates saved.")

    return user  # type: ignore[return-value]


def initialize_database(
    *,
    email: Optional[str],
    password: Optional[str],
    name: str,
    reset_password: bool,
    skip_create_all: bool,
) -> None:
    """
    Optionally create tables (dev/test) and seed admin user from CLI/env.
    """
    logger = logging.getLogger("init_db")

    app_env = os.getenv("APP_ENV", os.getenv("FLASK_ENV", "development")).lower()
    allow_create_all = os.getenv("ALLOW_CREATE_ALL", "false").lower() in {"1", "true", "yes", "on"}

    if skip_create_all:
        logger.info("Skipping db.create_all() by request.")
    else:
        if app_env == "production" and not allow_create_all:
            logger.info(
                "APP_ENV=production: not running db.create_all(). "
                "Run Alembic migrations (e.g., `flask db upgrade`) instead."
            )
        else:
            logger.info("Creating database tables with db.create_all()...")
            db.create_all()
            logger.info("db.create_all() complete.")

    # Choose credentials: CLI args override env vars
    admin_email = email or os.getenv("ADMIN_EMAIL")
    admin_password = password or os.getenv("ADMIN_PASSWORD")
    admin_name = name or os.getenv("ADMIN_NAME", "System Administrator")

    if admin_email and admin_password:
        create_or_update_admin(
            email=admin_email,
            password=admin_password,
            name=admin_name,
            reset_password=reset_password,
        )
    else:
        logger.info(
            "No admin credentials provided. "
            "Set ADMIN_EMAIL and ADMIN_PASSWORD env vars or pass --email/--password."
        )

    logger.info("Database initialization complete.")


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Initialize DB and seed admin user.")
    parser.add_argument("--email", type=str, help="Admin email (overrides ADMIN_EMAIL)")
    parser.add_argument("--password", type=str, help="Admin password (overrides ADMIN_PASSWORD)")
    parser.add_argument("--name", type=str, default="System Administrator", help="Admin display name")
    parser.add_argument(
        "--reset-password",
        action="store_true",
        help="Reset password if the admin already exists.",
    )
    parser.add_argument(
        "--skip-create-all",
        action="store_true",
        help="Skip calling db.create_all(). Recommended for production where you use Alembic.",
    )
    parser.add_argument(
        "--log-level", type=str, default=os.getenv("LOG_LEVEL", "INFO"), help="Logging level"
    )
    return parser.parse_args(argv)


def main(argv: Optional[list[str]] = None) -> None:
    args = parse_args(argv or sys.argv[1:])
    _init_logging(args.log_level)

    app = create_app()
    with app.app_context():
        initialize_database(
            email=args.email,
            password=args.password,
            name=args.name,
            reset_password=args.reset_password,
            skip_create_all=args.skip_create_all,
        )


if __name__ == "__main__":
    main()
