# backend/src/routes/logs.py
from flask import Blueprint, request, jsonify
import logging
from ..controllers.logs_controller import (
    get_logs, get_log_details, clear_logs
)

logs_bp = Blueprint('logs', __name__)

@logs_bp.route("/frontend-error", methods=["POST"])
def log_frontend_error():
    data = request.get_json()
    logging.error(f"Frontend Error: {data}")
    return jsonify({"status": "logged"}), 200

logs_bp.route('/', methods=['GET'])(get_logs)
logs_bp.route('/<int:log_id>', methods=['GET'])(get_log_details)
logs_bp.route('/clear', methods=['POST'])(clear_logs)
logs_bp.route('/frontend-error', methods=['POST'])(get_logs)  # This should be implemented in logs_controller
