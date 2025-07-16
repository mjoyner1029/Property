from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity
)
from src.models.user import User
from src.extensions import db, mail
from src.utils.email import send_verification_email
from src.utils.password import is_strong_password
import os
import logging

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['email', 'password', 'role', 'tosAccepted']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'Missing required field: {field}'}), 400

    email = data.get('email')
    password = data.get('password')
    role = data.get('role')
    tos_accepted = data.get('tosAccepted')
    
    # Validate role
    valid_roles = ['tenant', 'landlord', 'admin']
    if role not in valid_roles:
        return jsonify({'error': f'Invalid role. Must be one of {valid_roles}'}), 400
    
    if not tos_accepted:
        return jsonify({'error': 'You must accept the Terms of Service'}), 400

    if not is_strong_password(password):
        return jsonify({'error': 'Password is not strong enough'}), 400

    # Check if user already exists
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    try:
        hashed_password = generate_password_hash(password)
        user = User(
            email=email, 
            password=hashed_password, 
            role=role, 
            is_verified=False
        )
        db.session.add(user)
        db.session.commit()
        
        send_verification_email(user)
        
        logging.info(f"User {email} registered. Verification email sent.")
        return jsonify({
            'message': 'Signup successful. Please verify your email.',
            'userId': user.id
        }), 201
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error during signup: {str(e)}")
        return jsonify({'error': 'An error occurred during signup'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    if not user.is_verified:
        return jsonify({'error': 'Email not verified'}), 403

    # Include more user information in the token payload
    access_token = create_access_token(identity={
        'id': user.id, 
        'role': user.role,
        'email': user.email
    })
    
    logging.info(f"User {email} logged in.")
    return jsonify({
        'access_token': access_token, 
        'user': {
            'id': user.id,
            'email': user.email,
            'role': user.role,
            'name': user.name
        }
    }), 200

@auth_bp.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    user = User.verify_verification_token(token)
    if not user:
        return jsonify({'error': 'Invalid or expired token'}), 400

    user.is_verified = True
    db.session.commit()
    logging.info(f"User {user.email} email verified.")
    return jsonify({'message': 'Email verified successfully.'}), 200