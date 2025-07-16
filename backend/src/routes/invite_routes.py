from flask import Blueprint
from ..controllers.invite_controller import (
    create_invite, verify_invite, resend_invite, invite_tenant
)

invite_bp = Blueprint('invites', __name__)

invite_bp.route('/', methods=['POST'])(create_invite)
invite_bp.route('/<token>', methods=['GET'])(verify_invite)
invite_bp.route('/resend/<int:invite_id>', methods=['POST'])(resend_invite)
invite_bp.route('/tenant', methods=['POST'])(invite_tenant)
