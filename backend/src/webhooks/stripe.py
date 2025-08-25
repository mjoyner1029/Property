"""
Production Stripe webhook handler with signature verification and DB-backed idempotency.
"""
from __future__ import annotations

import os
from datetime import datetime
from typing import Optional, Dict, Any

from flask import request, jsonify, current_app
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

import stripe

from ..extensions import db
from ..models.payment import Payment   # expected typical fields; code guards where needed
from ..models.invoice import Invoice   # expected typical fields; code guards where needed
from ..models.user import User         # for emailing receipts if desired
from ..utils.email_service import send_payment_receipt  # safe-guarded below


# -----------------------------------------------------------------------------
# Stripe setup
# -----------------------------------------------------------------------------
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# -----------------------------------------------------------------------------
# Idempotency: store processed event IDs so retries are harmless
# -----------------------------------------------------------------------------
class StripeWebhookEvent(db.Model):
    __tablename__ = "stripe_webhook_events"

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.String(255), unique=True, nullable=False, index=True)
    event_type = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


def _mark_event_processed(event_id: str, event_type: str) -> bool:
    """
    Try to persist event_id. Returns True if this is the first time we see it,
    False if already processed (unique constraint triggers).
    """
    try:
        rec = StripeWebhookEvent(event_id=event_id, event_type=event_type)
        db.session.add(rec)
        db.session.commit()
        return True
    except IntegrityError:
        db.session.rollback()
        # Already processed
        return False
    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.exception("DB error recording Stripe event id=%s: %s", event_id, e)
        # Fail open on idempotency storage errors to avoid dropping Stripe retries forever.
        # We still continue handling but log a warning.
        return True


# -----------------------------------------------------------------------------
# Helpers to coerce/guard model attributes, since schemas can differ slightly
# -----------------------------------------------------------------------------
def _set_if_has(obj: Any, attr: str, value: Any) -> None:
    if hasattr(obj, attr):
        setattr(obj, attr, value)

def _get_metadata_stripe(obj: Dict[str, Any], key: str) -> Optional[str]:
    md = obj.get("metadata") or {}
    val = md.get(key)
    return str(val) if val is not None else None


# -----------------------------------------------------------------------------
# Event handlers
# -----------------------------------------------------------------------------
def _handle_payment_intent_succeeded(event: Dict[str, Any]) -> None:
    data = event["data"]["object"]
    pi_id = data["id"]
    amount_received = data.get("amount_received")
    currency = data.get("currency")
    customer = data.get("customer")
    user_id_meta = _get_metadata_stripe(data, "user_id")
    invoice_id_meta = _get_metadata_stripe(data, "invoice_id")

    # Link by known identifiers if present; otherwise best-effort
    payment: Optional[Payment] = None
    try:
        # Prefer existing payment row keyed by payment_intent id if the model has that field
        if hasattr(Payment, "stripe_payment_intent_id"):
            payment = Payment.query.filter_by(stripe_payment_intent_id=pi_id).one_or_none()

        if payment is None:
            payment = Payment()

        # Set typical fields (guarded if attributes exist)
        _set_if_has(payment, "stripe_payment_intent_id", pi_id)
        _set_if_has(payment, "stripe_customer_id", customer)
        _set_if_has(payment, "amount_cents", int(amount_received) if amount_received is not None else None)
        _set_if_has(payment, "currency", currency)
        _set_if_has(payment, "status", "succeeded")
        _set_if_has(payment, "processed_at", datetime.utcnow())

        # Link to user if we can
        if user_id_meta and hasattr(payment, "user_id"):
            try:
                payment.user_id = int(user_id_meta)
            except ValueError:
                pass

        # Link to invoice if we can
        if invoice_id_meta and hasattr(payment, "invoice_id"):
            try:
                payment.invoice_id = int(invoice_id_meta)
            except ValueError:
                pass

        db.session.add(payment)

        # If we can find an invoice, mark it paid
        invoice_obj: Optional[Invoice] = None
        if invoice_id_meta:
            try:
                invoice_obj = Invoice.query.get(int(invoice_id_meta))
            except Exception:
                invoice_obj = None

        if invoice_obj:
            _set_if_has(invoice_obj, "status", "paid")
            _set_if_has(invoice_obj, "paid_at", datetime.utcnow())
            db.session.add(invoice_obj)

        db.session.commit()
        current_app.logger.info("PaymentIntent succeeded handled: pi=%s, amount=%s %s", pi_id, amount_received, currency)

        # Send receipt if we can resolve the user + email service configured
        try:
            if user_id_meta:
                u = User.query.get(int(user_id_meta))
                if u and getattr(u, "email", None) and amount_received:
                    # amount in cents expected by our helper
                    send_payment_receipt(
                        to_email=u.email,
                        amount_cents=int(amount_received),
                        currency=currency or "usd",
                        payment_intent_id=pi_id,
                    )
        except Exception:
            # Never crash webhook for email failures
            current_app.logger.exception("Failed to send payment receipt for pi=%s", pi_id)

    except Exception:
        db.session.rollback()
        current_app.logger.exception("Failed handling payment_intent.succeeded for pi=%s", pi_id)
        raise


def _handle_invoice_paid(event: Dict[str, Any]) -> None:
    data = event["data"]["object"]
    stripe_invoice_id = data.get("id")
    amount_paid = data.get("amount_paid")
    currency = data.get("currency")
    invoice_id_meta = _get_metadata_stripe(data, "invoice_id")

    try:
        inv: Optional[Invoice] = None
        if invoice_id_meta:
            try:
                inv = Invoice.query.get(int(invoice_id_meta))
            except Exception:
                inv = None

        if inv:
            _set_if_has(inv, "status", "paid")
            _set_if_has(inv, "paid_at", datetime.utcnow())
            _set_if_has(inv, "stripe_invoice_id", stripe_invoice_id)
            db.session.add(inv)

        # Optionally create/update a Payment record tied to this invoice
        if amount_paid is not None:
            pay: Optional[Payment] = None
            # If model has a stripe_invoice_id column, try to upsert on it
            if hasattr(Payment, "stripe_invoice_id") and stripe_invoice_id:
                pay = Payment.query.filter_by(stripe_invoice_id=stripe_invoice_id).one_or_none()
            if pay is None:
                pay = Payment()
            _set_if_has(pay, "stripe_invoice_id", stripe_invoice_id)
            _set_if_has(pay, "amount_cents", int(amount_paid))
            _set_if_has(pay, "currency", currency)
            _set_if_has(pay, "status", "succeeded")
            if inv and hasattr(pay, "invoice_id"):
                _set_if_has(pay, "invoice_id", getattr(inv, "id", None))
            db.session.add(pay)

        db.session.commit()
        current_app.logger.info("Invoice paid handled: invoice=%s amount=%s %s", stripe_invoice_id, amount_paid, currency)
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Failed handling invoice.paid invoice=%s", stripe_invoice_id)
        raise


def _handle_invoice_payment_failed(event: Dict[str, Any]) -> None:
    data = event["data"]["object"]
    stripe_invoice_id = data.get("id")
    invoice_id_meta = _get_metadata_stripe(data, "invoice_id")
    try:
        inv: Optional[Invoice] = None
        if invoice_id_meta:
            try:
                inv = Invoice.query.get(int(invoice_id_meta))
            except Exception:
                inv = None
        if inv:
            _set_if_has(inv, "status", "payment_failed")
            db.session.add(inv)
        db.session.commit()
        current_app.logger.info("Invoice payment failed: invoice=%s", stripe_invoice_id)
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Failed handling invoice.payment_failed invoice=%s", stripe_invoice_id)
        raise


def _handle_charge_refunded(event: Dict[str, Any]) -> None:
    data = event["data"]["object"]
    charge_id = data.get("id")
    amount_refunded = data.get("amount_refunded")
    try:
        # Best-effort: mark a payment refunded if schema supports it
        if hasattr(Payment, "stripe_charge_id") and charge_id:
            pay = Payment.query.filter_by(stripe_charge_id=charge_id).one_or_none()
        else:
            pay = None
        if pay:
            _set_if_has(pay, "status", "refunded")
            _set_if_has(pay, "refunded_cents", int(amount_refunded) if amount_refunded is not None else None)
            _set_if_has(pay, "refunded_at", datetime.utcnow())
            db.session.add(pay)
        db.session.commit()
        current_app.logger.info("Charge refunded handled: charge=%s amount_refunded=%s", charge_id, amount_refunded)
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Failed handling charge.refunded charge=%s", charge_id)
        raise


def _handle_checkout_session_completed(event: Dict[str, Any]) -> None:
    data = event["data"]["object"]
    session_id = data.get("id")
    payment_intent = data.get("payment_intent")
    customer = data.get("customer")
    current_app.logger.info("Checkout session completed: session=%s customer=%s pi=%s", session_id, customer, payment_intent)
    # Typically you’d fulfill here or rely on PI/Invoice handlers above.


# -----------------------------------------------------------------------------
# Main register function
# -----------------------------------------------------------------------------
def register_stripe_webhooks(bp):
    """
    Register Stripe webhook route on the provided blueprint.
    Usage in your app factory: register_stripe_webhooks(api_bp)
    """

    @bp.route("/stripe", methods=["POST"])
    def stripe_webhook():
        # Config validation
        endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
        if not endpoint_secret:
            current_app.logger.error("Missing STRIPE_WEBHOOK_SECRET env var")
            return jsonify({"error": "misconfigured webhook"}), 500

        payload = request.get_data(as_text=False)
        sig_header = request.headers.get("Stripe-Signature")

        # Verify signature and construct event
        try:
            event = stripe.Webhook.construct_event(payload=payload, sig_header=sig_header, secret=endpoint_secret)
        except ValueError:
            current_app.logger.warning("Stripe webhook: invalid payload")
            return jsonify({"error": "invalid payload"}), 400
        except stripe.error.SignatureVerificationError:
            current_app.logger.warning("Stripe webhook: signature verification failed")
            return jsonify({"error": "invalid signature"}), 400
        except Exception:
            current_app.logger.exception("Stripe webhook: unexpected error during construct_event")
            return jsonify({"error": "internal error"}), 500

        event_id = event.get("id")
        event_type = event.get("type")

        if not event_id or not event_type:
            current_app.logger.warning("Stripe webhook: missing event id/type")
            return jsonify({"error": "invalid event"}), 400

        # DB-backed idempotency
        first_time = _mark_event_processed(event_id, event_type)
        if not first_time:
            current_app.logger.info("Stripe webhook: duplicate delivery ignored (id=%s type=%s)", event_id, event_type)
            return jsonify({"status": "ok", "idempotent": True}), 200

        # Dispatch
        try:
            if event_type == "payment_intent.succeeded":
                _handle_payment_intent_succeeded(event)
            elif event_type == "invoice.paid":
                _handle_invoice_paid(event)
            elif event_type == "invoice.payment_failed":
                _handle_invoice_payment_failed(event)
            elif event_type == "charge.refunded":
                _handle_charge_refunded(event)
            elif event_type == "checkout.session.completed":
                _handle_checkout_session_completed(event)
            else:
                current_app.logger.info("Stripe webhook: unhandled event type=%s", event_type)

        except Exception:
            # rollbacks are handled inside handlers; respond 500 so Stripe can retry
            current_app.logger.exception("Stripe webhook: handler failed for type=%s id=%s", event_type, event_id)
            return jsonify({"error": "handler failed"}), 500

        return jsonify({"status": "ok"}), 200
