# backend/src/routes/invoice_routes.py
from flask import Blueprint
from src.controllers.invoice_controller import (
    create_invoice, get_invoices, get_invoice,
    update_invoice, delete_invoice, get_tenant_invoices,
    get_landlord_invoices, mark_paid, mark_unpaid,
    generate_rent_invoices,
)

invoice_bp = Blueprint("invoices", __name__, url_prefix="/api/invoices")

invoice_bp.route("/", methods=["POST"])(create_invoice)
invoice_bp.route("/", methods=["GET"])(get_invoices)
invoice_bp.route("/<int:invoice_id>", methods=["GET"])(get_invoice)
invoice_bp.route("/<int:invoice_id>", methods=["PUT"])(update_invoice)
invoice_bp.route("/<int:invoice_id>", methods=["DELETE"])(delete_invoice)
invoice_bp.route("/tenant", methods=["GET"])(get_tenant_invoices)
invoice_bp.route("/landlord", methods=["GET"])(get_landlord_invoices)
invoice_bp.route("/<int:invoice_id>/pay", methods=["PUT"])(mark_paid)
invoice_bp.route("/<int:invoice_id>/unpay", methods=["PUT"])(mark_unpaid)
invoice_bp.route("/generate-rent", methods=["POST"])(generate_rent_invoices)
