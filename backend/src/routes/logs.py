# backend/src/routes/logs.py
from flask import Blueprint, request, jsonify
import logging

bp = Blueprint("logs", __name__, url_prefix="/api/log")

@bp.route("/frontend-error", methods=["POST"])
def log_frontend_error():
    data = request.get_json()
    logging.error(f"Frontend Error: {data}")
    return jsonify({"status": "logged"}), 200
