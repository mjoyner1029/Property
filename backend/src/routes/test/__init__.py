from flask import Blueprint
from ..controllers.test.test_auth import test_auth_bp

bp = Blueprint('test', __name__)

# Register the test auth blueprint
bp.register_blueprint(test_auth_bp)
