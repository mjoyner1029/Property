from src.models.user import User
from src.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from src.utils.jwt import create_access_token

def register_user(email, password, role, full_name):
    if User.query.filter_by(email=email).first():
        return {"error": "Email already exists"}, 400

    user = User(email=email, role=role, full_name=full_name, is_verified=False, is_active=True)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return {"message": "User registered"}, 201

def authenticate_user(email, password):
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return {"error": "Invalid credentials"}, 401

    if not user.is_verified:
        return {"error": "Email not verified"}, 403

    if not user.is_active:
        return {"error": "Account deactivated"}, 403

    token = create_access_token(identity={"id": user.id, "role": user.role})
    return {
        "access_token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "full_name": user.full_name
        }
    }, 200
