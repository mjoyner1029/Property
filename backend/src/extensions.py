from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_socketio import SocketIO
from flask_mail import Mail 
from flask_cors import CORS
from flask_talisman import Talisman

db = SQLAlchemy()
jwt = JWTManager()
cors = CORS()
migrate = Migrate()
socketio = SocketIO(cors_allowed_origins="*")
talisman = Talisman()
mail = Mail()  
