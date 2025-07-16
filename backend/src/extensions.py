from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_socketio import SocketIO
from flask_mail import Mail 
from flask_cors import CORS
from flask_talisman import Talisman

# Database ORM
db = SQLAlchemy()

# JWT Authentication
jwt = JWTManager()

# Cross-Origin Resource Sharing
cors = CORS()

# Database migrations
migrate = Migrate()

# Real-time communication
socketio = SocketIO(cors_allowed_origins="*")

# Security headers
talisman = Talisman()

# Email sending
mail = Mail()
