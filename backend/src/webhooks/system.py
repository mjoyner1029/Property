# backend/src/webhooks/system.py
"""
Webhook handlers for internal system events.
"""
from __future__ import annotations

import hmac
import hashlib
import os
from datetime import datetime
from typing import Any, Dict, Iterable, Optional

from flask import Blueprint, current_app, jsonify, request

try:
    # Optional: Sentry integration if present in the app
    import sentry_sdk  # type: ignore
    _HAS_SENTRY = True
except Exception:  # pragma: no cover
    _HAS_SENTRY = False


def register_system_webhooks(bp: Blueprint) -> None:
    """Register system webhook routes with the provided blueprint."""

    @bp.route("/system", methods=["POST"])
    def system_webhook():
        # Enforce JSON
        if not request.is_json:
            return jsonify({"error": "Invalid content type"}), 415

        raw = request.get_data()  # bytes for signature verification
        payload: Dict[str, Any] = request.get_json(silent=True) or {}

        # Verify the webhook secret (if configured)
        system_secret = os.getenv("SYSTEM_WEBHOOK_SECRET") or current_app.config.get("SYSTEM_WEBHOOK_SECRET")
        if system_secret:
            signature = request.headers.get("X-System-Signature", "")
            if not signature or not verify_system_webhook(raw, signature, system_secret):
                current_app.logger.warning("Invalid system webhook signature")
                return jsonify({"error": "Invalid signature"}), 401

        # Basic idempotency (optional): ignore duplicate event_id within a short window
        event_id = str(payload.get("id") or payload.get("event_id") or "")
        if event_id and _is_duplicate_event(event_id):
            current_app.logger.info("Duplicate system webhook ignored: %s", event_id)
            return jsonify({"status": "duplicate_ignored"}), 200

        # Process the webhook
        try:
            event_type = (payload.get("event_type") or "").strip()
            current_app.logger.info("Received system webhook: %s", event_type or "<unknown>")

            # Route by event type
            if event_type == "backup_completed":
                handle_backup_completed(payload)
            elif event_type == "error_alert":
                handle_error_alert(payload)
            elif event_type == "usage_threshold":
                handle_usage_threshold(payload)
            elif event_type == "scheduled_maintenance":
                handle_scheduled_maintenance(payload)
            else:
                current_app.logger.info("Unhandled system webhook type: %r", event_type)

            return jsonify({"status": "success"}), 200

        except Exception as e:  # pragma: no cover - defensive
            current_app.logger.exception("Error processing system webhook")
            if _HAS_SENTRY:
                sentry_sdk.capture_exception(e)
            return jsonify({"error": str(e)}), 500


def verify_system_webhook(data: bytes, signature: str, secret: str) -> bool:
    """Verify the system webhook signature via HMAC-SHA256."""
    expected = hmac.new(secret.encode("utf-8"), data, hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature, expected)


# ------------------------------------------------------------------------------
# Event handlers
# ------------------------------------------------------------------------------
def handle_backup_completed(data: Dict[str, Any]) -> None:
    """Handle backup completed event."""
    backup_id = data.get("backup_id", "unknown")
    status = (data.get("status") or "").lower()
    timestamp = data.get("timestamp") or datetime.utcnow().isoformat()
    meta = {"backup_id": backup_id, "timestamp": timestamp}

    if status == "success":
        current_app.logger.info("Backup %s completed successfully at %s", backup_id, timestamp)
        notify_admins(
            subject=f"Backup completed: {backup_id}",
            body=f"Backup {backup_id} completed successfully at {timestamp}.",
            level="info",
            tags={"event": "backup_completed", **meta},
        )
    else:
        err = data.get("error", "unknown error")
        current_app.logger.error("Backup %s failed at %s: %s", backup_id, timestamp, err)
        notify_admins(
            subject=f"[ALERT] Backup failed: {backup_id}",
            body=f"Backup {backup_id} failed at {timestamp}\nError: {err}",
            level="error",
            tags={"event": "backup_failed", **meta},
        )
        if _HAS_SENTRY:
            sentry_sdk.capture_message(f"Backup failed: {backup_id} — {err}", level="error")


def handle_error_alert(data: Dict[str, Any]) -> None:
    """Handle system error alerts."""
    error_type = data.get("error_type", "Error")
    error_message = data.get("error_message", "")
    service = data.get("service", "unknown")
    severity = (data.get("severity") or "warning").lower()

    current_app.logger.error("System error in %s: %s - %s", service, error_type, error_message)

    # Log to error monitoring system
    log_to_error_system(data)

    # Notify administrators for critical errors
    if severity == "critical":
        notify_admins_of_critical_error(data)


def handle_usage_threshold(data: Dict[str, Any]) -> None:
    """Handle resource usage threshold alerts."""
    resource = data.get("resource", "resource")
    current_usage = float(data.get("current_usage", 0))
    threshold = float(data.get("threshold", 0))

    current_app.logger.warning(
        "Resource usage alert: %s at %.2f%% (threshold: %.2f%%)", resource, current_usage, threshold
    )

    # Notify administrators if approaching critical levels
    if current_usage >= 90.0:
        notify_admins_of_resource_usage(data)


def handle_scheduled_maintenance(data: Dict[str, Any]) -> None:
    """Handle scheduled maintenance notifications."""
    maintenance_id = data.get("maintenance_id", "maintenance")
    start_time = data.get("start_time", "")
    end_time = data.get("end_time", "")
    services = data.get("affected_services", [])

    current_app.logger.info(
        "Scheduled maintenance %s from %s to %s (services: %s)",
        maintenance_id,
        start_time,
        end_time,
        ", ".join(services) if services else "n/a",
    )

    # Notify users/admins as needed
    schedule_user_maintenance_notice(data)


# ------------------------------------------------------------------------------
# Helpers (no-op fallbacks upgraded to functional implementations)
# ------------------------------------------------------------------------------
def _admin_recipients() -> list[str]:
    """
    Resolve admin recipients from env/config:
      - ADMIN_EMAILS: comma-separated list
      - ADMIN_EMAIL: single fallback
    """
    emails = os.getenv("ADMIN_EMAILS") or current_app.config.get("ADMIN_EMAILS") or ""
    single = os.getenv("ADMIN_EMAIL") or current_app.config.get("ADMIN_EMAIL") or ""
    recipients = [e.strip() for e in emails.split(",") if e.strip()]
    if single and single not in recipients:
        recipients.append(single)
    return recipients


def _send_mail(subject: str, body: str, recipients: Iterable[str]) -> bool:
    """
    Attempt to send an email using Flask-Mail if configured.
    Returns True if an email was queued/sent, False otherwise.
    """
    try:
        from flask_mail import Message  # lazy import
        from ..extensions import mail  # type: ignore

        if not recipients:
            return False

        msg = Message(subject=subject, recipients=list(recipients), body=body)
        mail.send(msg)
        return True
    except Exception as exc:  # pragma: no cover - depends on env
        current_app.logger.info("Email notification skipped: %s", exc)
        return False


def notify_admins(subject: str, body: str, level: str = "info", tags: Optional[Dict[str, Any]] = None) -> None:
    """
    Notify administrators via email if configured; always log; send to Sentry if enabled.
    """
    level = (level or "info").lower()
    recipients = _admin_recipients()

    # Logging
    log_fn = getattr(current_app.logger, level if hasattr(current_app.logger, level) else "info")
    log_fn("%s\n%s", subject, body)

    # Email
    _sent = _send_mail(subject, body, recipients)

    # Sentry
    if _HAS_SENTRY:
        with sentry_sdk.push_scope() as scope:  # type: ignore
            if tags:
                for k, v in tags.items():
                    scope.set_tag(k, v)
            scope.set_extra("body", body)
            sentry_sdk.capture_message(subject, level=level)


def notify_admins_of_backup_failure(data: Dict[str, Any]) -> None:
    subject = f"[ALERT] Backup failed: {data.get('backup_id', 'unknown')}"
    body = (
        f"Backup ID: {data.get('backup_id')}\n"
        f"Timestamp: {data.get('timestamp')}\n"
        f"Error: {data.get('error', 'unknown error')}\n"
    )
    notify_admins(subject, body, level="error", tags={"event": "backup_failed"})


def log_to_error_system(data: Dict[str, Any]) -> None:
    """
    Send error payload to Sentry if available; otherwise ensure it's logged at error level.
    """
    if _HAS_SENTRY:
        with sentry_sdk.push_scope() as scope:  # type: ignore
            for k, v in data.items():
                scope.set_extra(str(k), v)
            sentry_sdk.capture_message(
                f"System error: {data.get('service', 'unknown')} - {data.get('error_type', 'Error')}",
                level="error",
            )
    else:
        current_app.logger.error("Error alert (no Sentry configured): %r", data)


def notify_admins_of_critical_error(data: Dict[str, Any]) -> None:
    subject = f"[CRITICAL] {data.get('service', 'service')} error: {data.get('error_type', 'Error')}"
    body = (
        f"Service: {data.get('service')}\n"
        f"Severity: {data.get('severity')}\n"
        f"Message: {data.get('error_message')}\n"
        f"Occurred: {data.get('timestamp', datetime.utcnow().isoformat())}\n"
    )
    notify_admins(subject, body, level="error", tags={"event": "critical_error"})


def notify_admins_of_resource_usage(data: Dict[str, Any]) -> None:
    subject = f"[WARN] High resource usage: {data.get('resource', 'resource')}"
    body = (
        f"Resource: {data.get('resource')}\n"
        f"Current usage: {data.get('current_usage')}%\n"
        f"Threshold: {data.get('threshold')}%\n"
        f"Host: {data.get('host', 'unknown')}\n"
    )
    notify_admins(subject, body, level="warning", tags={"event": "usage_threshold"})


def schedule_user_maintenance_notice(data: Dict[str, Any]) -> None:
    """
    Send an admin notice about upcoming maintenance and (optionally) emit to Sentry.
    If you have a user notification service/queue, integrate it here.
    """
    services = ", ".join(data.get("affected_services", [])) or "n/a"
    subject = f"Scheduled maintenance: {data.get('maintenance_id', 'maintenance')}"
    body = (
        f"Maintenance ID: {data.get('maintenance_id')}\n"
        f"Start: {data.get('start_time')}\n"
        f"End: {data.get('end_time')}\n"
        f"Affected services: {services}\n"
        f"Details: {data.get('message', '')}\n"
    )
    notify_admins(subject, body, level="info", tags={"event": "scheduled_maintenance"})

    # TODO: integrate with your own notification system (queues, DB notices, etc.)
    # For now, this function at least ensures admins are notified/logged.


# ------------------------------------------------------------------------------
# Idempotency guard (best-effort, in-memory)
# ------------------------------------------------------------------------------
_recent_events: set[str] = set()
_RECENT_EVENTS_MAX = 512  # bounded set size to prevent unbounded memory use


def _is_duplicate_event(event_id: str) -> bool:
    """
    Very light in-memory dedupe to avoid double-processing the same event id
    within a single process lifetime. For true dedupe, back this with Redis/DB.
    """
    if not event_id:
        return False
    if event_id in _recent_events:
        return True
    if len(_recent_events) >= _RECENT_EVENTS_MAX:
        # drop arbitrary item to keep set bounded
        _recent_events.pop()
    _recent_events.add(event_id)
    return False
