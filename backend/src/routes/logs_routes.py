# backend/src/routes/logs_routes.py
from flask import Blueprint
from ..controllers.logs_controller import logs_bp

# Import the Blueprint from logs_controller which already has all routes defined
# This is just a re-export
