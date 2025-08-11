# backend/src/utils/password.py

from werkzeug.security import generate_password_hash, check_password_hash

def hash_password(password):
    return generate_password_hash(password)

def verify_password(password, hash_):
    return check_password_hash(hash_, password)
