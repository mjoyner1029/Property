from flask import Blueprint
from ..controllers.auth_controller import verify_email, resend_verification

verify_email_bp = Blueprint('verify_email', __name__)

verify_email_bp.route('/<token>', methods=['GET'])(verify_email)
verify_email_bp.route('/resend', methods=['POST'])(resend_verification)
