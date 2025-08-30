from flask import Blueprint

# Import the user_bp from the controller
from ..controllers.user_controller import user_bp

# No need to create another blueprint or register routes as they're now defined in the controller