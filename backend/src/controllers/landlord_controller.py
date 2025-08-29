# backend/src/controllers/landlord_controller.py
from __future__ import annotations

from typing import Tuple, Optional, Dict, Any
from datetime import datetime

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy import func, distinct

from ..models.landlord_profile import LandlordProfile
from ..models.user import User
from ..models.property import Property
from ..models.tenant_property import TenantProperty
from ..models.stripe_account import StripeAccount
from ..extensions import db, limiter
from ..utils.role_required import role_required

landlord_bp = Blueprint("landlords", __name__)

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------

def _json() -> dict:
    return request.get_json(silent=True) or {}

def _safe_str(v: Any) -> str:
    return str(v).strip() if v is not None else ""

def _error(message: str, code: int = 400):
    return jsonify({"error": message}), code

def _ok(payload: Dict[str, Any], code: int = 200):
    return jsonify(payload), code


# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------

@landlord_bp.route("/profile", methods=["GET"])
@jwt_required()
@role_required("landlord")
@limiter.limit("60/hour")
def get_landlord_profile():
    """Get the landlord profile for the authenticated user."""
    current_user_id = get_jwt_identity()
    try:
        profile = LandlordProfile.query.filter_by(user_id=current_user_id).first()
        if not profile:
            return _error("Landlord profile not found", 404)
        return _ok(profile.to_dict())
    except Exception as exc:
        current_app.logger.exception("Failed to fetch landlord profile")
        return _error("Internal server error", 500)


@landlord_bp.route("/profile", methods=["POST"])
@jwt_required()
@role_required("landlord")
@limiter.limit("10/hour")
def create_landlord_profile():
    """Create a new landlord profile for the authenticated user."""
    current_user_id = get_jwt_identity()
    data = _json()

    try:
        # Prevent duplicates
        if LandlordProfile.query.filter_by(user_id=current_user_id).first():
            return _error("Landlord profile already exists", 400)

        # Validate required input
        phone = _safe_str(data.get("phone"))
        if not phone:
            return _error("Missing required field: phone", 400)

        profile = LandlordProfile(
            user_id=current_user_id,
            phone=phone,
            company_name=_safe_str(data.get("company_name")),
            business_address=_safe_str(data.get("business_address")),
            business_license_number=_safe_str(data.get("business_license_number")),
            tax_id=_safe_str(data.get("tax_id")),
            verified=False,
        )
        db.session.add(profile)
        db.session.commit()

        return _ok({"message": "Landlord profile created successfully", "profile_id": profile.id}, 201)

    except IntegrityError as exc:
        db.session.rollback()
        current_app.logger.warning("Integrity error creating landlord profile: %s", exc)
        return _error("Could not create profile (integrity error)", 400)
    except SQLAlchemyError as exc:
        db.session.rollback()
        current_app.logger.exception("DB error creating landlord profile")
        return _error("Database error", 500)
    except Exception as exc:
        db.session.rollback()
        current_app.logger.exception("Unexpected error creating landlord profile")
        return _error("Internal server error", 500)


@landlord_bp.route("/profile", methods=["PUT"])
@jwt_required()
@role_required("landlord")
@limiter.limit("30/hour")
def update_landlord_profile():
    """Update the landlord profile for the authenticated user."""
    current_user_id = get_jwt_identity()
    data = _json()

    try:
        profile = LandlordProfile.query.filter_by(user_id=current_user_id).first()
        if not profile:
            return _error("Landlord profile not found", 404)

        # Patch fields
        for field in ("phone", "company_name", "business_address", "business_license_number", "tax_id"):
            if field in data:
                setattr(profile, field, _safe_str(data.get(field)))

        db.session.commit()
        return _ok({"message": "Landlord profile updated successfully"})

    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("DB error updating landlord profile")
        return _error("Database error", 500)
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Unexpected error updating landlord profile")
        return _error("Internal server error", 500)


@landlord_bp.route("/verify/<int:landlord_id>", methods=["POST"])
@jwt_required()
@role_required("admin")
@limiter.limit("30/hour")
def verify_landlord(landlord_id: int):
    """Verify a landlord (admin only)."""
    try:
        profile = LandlordProfile.query.filter_by(id=landlord_id).first()
        if not profile:
            return _error("Landlord profile not found", 404)

        profile.verified = True
        db.session.commit()
        return _ok({"message": "Landlord verified successfully"})

    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("DB error verifying landlord")
        return _error("Database error", 500)
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Unexpected error verifying landlord")
        return _error("Internal server error", 500)


@landlord_bp.route("/dashboard", methods=["GET"])
@jwt_required()
@role_required("landlord")
@limiter.limit("120/hour")
def get_dashboard_data():
    """
    Get summary dashboard data for the landlord:
      - property_count
      - tenant_count (active)
      - active_properties (with >=1 active tenant)
      - vacancy_rate
      - stripe_status
    """
    current_user_id = get_jwt_identity()

    try:
        # Counts
        property_count = db.session.query(func.count(Property.id)).filter(
            Property.landlord_id == current_user_id
        ).scalar()

        # tenant_count across all properties (active)
        tenant_count = (
            db.session.query(func.count(TenantProperty.id))
            .join(Property, TenantProperty.property_id == Property.id)
            .filter(
                Property.landlord_id == current_user_id,
                TenantProperty.status == "active",
            )
            .scalar()
        )

        # active_properties = number of distinct properties with active tenants
        active_properties = (
            db.session.query(func.count(distinct(Property.id)))
            .join(TenantProperty, TenantProperty.property_id == Property.id)
            .filter(
                Property.landlord_id == current_user_id,
                TenantProperty.status == "active",
            )
            .scalar()
        )

        vacancy_rate = 0.0
        if property_count and property_count > 0:
            vacancy_rate = round(((property_count - (active_properties or 0)) / property_count) * 100.0, 2)

        # Stripe status
        acct = StripeAccount.query.filter_by(user_id=current_user_id).first()
        stripe_status = {
            "has_account": bool(acct),
            "is_verified": bool(acct.is_verified) if acct else False,
            "account_id": acct.account_id if acct else None,
        }

        return _ok(
            {
                "property_count": int(property_count or 0),
                "tenant_count": int(tenant_count or 0),
                "active_properties": int(active_properties or 0),
                "vacancy_rate": vacancy_rate,
                "stripe_status": stripe_status,
            }
        )

    except Exception:
        current_app.logger.exception("Failed to fetch landlord dashboard data")
        return _error("Internal server error", 500)


@landlord_bp.route("/pending-approvals", methods=["GET"])
@jwt_required()
@role_required("admin")
@limiter.limit("60/hour")
def get_pending_landlords():
    """Get landlords pending verification (admin only)."""
    try:
        profiles = LandlordProfile.query.filter_by(verified=False).all()

        # Batch user lookup to reduce N+1
        user_ids = [p.user_id for p in profiles]
        users_by_id = {
            u.id: u
            for u in User.query.filter(User.id.in_(user_ids)).all()
        } if user_ids else {}

        result = []
        for p in profiles:
            u = users_by_id.get(p.user_id)
            if not u:
                continue
            result.append(
                {
                    "profile_id": p.id,
                    "user_id": u.id,
                    "name": u.name,
                    "email": u.email,
                    "phone": p.phone,
                    "company_name": p.company_name,
                    "business_license": p.business_license_number,
                    "created_at": p.created_at.isoformat() if getattr(p, "created_at", None) else None,
                }
            )

        return _ok({"pending_landlords": result})

    except Exception:
        current_app.logger.exception("Failed to fetch pending landlords")
        return _error("Internal server error", 500)


@landlord_bp.route("/stripe-account", methods=["POST"])
@jwt_required()
@role_required("landlord")
@limiter.limit("10/hour")
def create_stripe_account():
    """
    Create or initialize a Stripe Connect account for the landlord.
    """
    current_user_id = get_jwt_identity()

    try:
        # Ensure landlord profile exists before creating account
        if not LandlordProfile.query.filter_by(user_id=current_user_id).first():
            return _error("Landlord profile not found", 404)

        acct = StripeAccount.query.filter_by(user_id=current_user_id).first()
        if acct and acct.account_id:
            return _error("Stripe account already exists", 400)

        # Get user information for creating the account
        user = User.query.get(current_user_id)
        if not user:
            return _error("User not found", 404)
            
        # Create a Stripe Connect account
        import stripe
        stripe.api_key = current_app.config.get('STRIPE_SECRET_KEY')
        
        stripe_account = stripe.Account.create(
            type="express",
            country="US",
            email=user.email,
            capabilities={
                "card_payments": {"requested": True},
                "transfers": {"requested": True},
            },
            business_type="individual",
        )
        
        account_id = stripe_account.id

        if not acct:
            acct = StripeAccount(
                user_id=current_user_id,
                account_id=account_id,
                is_verified=False,
            )
            db.session.add(acct)
        else:
            acct.account_id = account_id

        db.session.commit()

        # Create an account link for onboarding
        account_link = stripe.AccountLink.create(
            account=account_id,
            refresh_url=f"{request.host_url.rstrip('/')}/api/landlord/stripe/onboarding/refresh",
            return_url=f"{request.host_url.rstrip('/')}/api/landlord/stripe/onboarding/complete",
            type="account_onboarding",
        )
        
        return _ok(
            {
                "message": "Stripe Connect account creation initiated",
                "account_id": account_id,
                "onboarding_url": account_link.url
            }
        )

    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("DB error creating Stripe account")
        return _error("Database error", 500)
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Unexpected error creating Stripe account")
        return _error("Internal server error", 500)


@landlord_bp.route("/all", methods=["GET"])
@jwt_required()
@role_required("admin")
@limiter.limit("120/hour")
def get_all_landlords():
    """Get all landlords with pagination (admin only)."""
    try:
        # Pagination controls (bounded)
        page = request.args.get("page", default=1, type=int)
        per_page = request.args.get("per_page", default=10, type=int)
        per_page = max(1, min(per_page, 100))  # clamp 1..100

        pagination = User.query.filter_by(role="landlord").paginate(page=page, per_page=per_page, error_out=False)

        landlord_ids = [u.id for u in pagination.items]

        # Batch fetch profiles and property counts
        profiles = LandlordProfile.query.filter(LandlordProfile.user_id.in_(landlord_ids)).all() if landlord_ids else []
        profiles_by_uid = {p.user_id: p for p in profiles}

        prop_counts = (
            db.session.query(Property.landlord_id, func.count(Property.id))
            .filter(Property.landlord_id.in_(landlord_ids))
            .group_by(Property.landlord_id)
            .all()
            if landlord_ids
            else []
        )
        prop_count_by_uid = {uid: cnt for uid, cnt in prop_counts}

        result = []
        for u in pagination.items:
            profile = profiles_by_uid.get(u.id)
            result.append(
                {
                    "id": u.id,
                    "name": u.name,
                    "email": u.email,
                    "is_verified": bool(getattr(u, "is_verified", False)),
                    "created_at": u.created_at.isoformat() if getattr(u, "created_at", None) else None,
                    "profile": profile.to_dict() if profile else None,
                    "property_count": int(prop_count_by_uid.get(u.id, 0)),
                }
            )

        return _ok(
            {
                "landlords": result,
                "total": pagination.total,
                "pages": pagination.pages,
                "current_page": page,
                "per_page": per_page,
            }
        )

    except Exception:
        current_app.logger.exception("Failed to fetch landlords")
        return _error("Internal server error", 500)


# -----------------------------------------------------------------------------
# Utilities
# -----------------------------------------------------------------------------

def get_landlord_profile_by_id(landlord_id: int) -> Tuple[Optional[LandlordProfile], Optional[str]]:
    """Utility to retrieve a landlord profile by landlord user id."""
    try:
        user = User.query.filter_by(id=landlord_id, role="landlord").first()
        if not user:
            return None, "User not found or not a landlord"

        profile = LandlordProfile.query.filter_by(user_id=landlord_id).first()
        if not profile:
            return None, "Landlord profile not found"

        return profile, None
    except Exception as exc:
        current_app.logger.exception("Error fetching landlord profile by id")
        return None, "Internal server error"
