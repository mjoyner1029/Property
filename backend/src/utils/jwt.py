# backend/src/utils/jwt.py

from flask_jwt_extended import create_access_token as jwt_create_token

def create_access_token(identity):
    return jwt_create_token(identity=identity)
