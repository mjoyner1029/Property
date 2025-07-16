from flask import Blueprint
from ..controllers.user_controller import (
    get_user_profile, update_user_profile, update_password,
    upload_profile_picture, delete_user, set_user_preferences,
    get_user_preferences
)

user_bp = Blueprint('users', __name__)

user_bp.route('/profile', methods=['GET'])(get_user_profile)
user_bp.route('/profile', methods=['PUT'])(update_user_profile)
user_bp.route('/password', methods=['PUT'])(update_password)
user_bp.route('/profile-picture', methods=['POST'])(upload_profile_picture)
user_bp.route('/', methods=['DELETE'])(delete_user)
user_bp.route('/preferences', methods=['PUT'])(set_user_preferences)
user_bp.route('/preferences', methods=['GET'])(get_user_preferences)