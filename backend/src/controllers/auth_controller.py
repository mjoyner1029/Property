from ..models.user import User
from ..extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from ..utils.jwt import create_access_token

def register_user(email, password, role):
    if User.query.filter_by(email=email).first():
        return {"error": "Email already exists"}, 400

    user = User(email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return {"message": "User registered"}, 201

def authenticate_user(email, password):
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return {"error": "Invalid credentials"}, 401

    token = create_access_token(identity={"id": user.id, "role": user.role})
    return {"access_token": token}, 200
