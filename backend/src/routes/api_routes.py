from flask import Blueprint, jsonify

api_bp = Blueprint("api_bp", __name__, url_prefix="/api")

@api_bp.get("/ping")
def ping():
    return jsonify({"status": "ok"}), 200
