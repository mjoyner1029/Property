from flask_restx import Namespace, Resource, fields
from flask import request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from ..models.user import User
from ..extensions import db

# Create auth namespace
auth_ns = Namespace('auth', description='Authentication operations')

# Define models
login_model = auth_ns.model('Login', {
    'email': fields.String(required=True, description='User email'),
    'password': fields.String(required=True, description='User password'),
})

register_model = auth_ns.model('Register', {
    'name': fields.String(required=True, description='User name'),
    'email': fields.String(required=True, description='User email'),
    'password': fields.String(required=True, description='User password'),
    'role': fields.String(required=True, description='User role (tenant or landlord)'),
})

user_model = auth_ns.model('User', {
    'id': fields.Integer(description='User ID'),
    'name': fields.String(description='User name'),
    'email': fields.String(description='User email'),
    'role': fields.String(description='User role'),
    'is_verified': fields.Boolean(description='Email verification status'),
})

token_model = auth_ns.model('Tokens', {
    'access_token': fields.String(description='JWT access token'),
    'refresh_token': fields.String(description='JWT refresh token'),
    'user': fields.Nested(user_model),
})

@auth_ns.route('/login')
class Login(Resource):
    @auth_ns.doc('login')
    @auth_ns.expect(login_model)
    @auth_ns.response(200, 'Success', token_model)
    @auth_ns.response(401, 'Invalid credentials')
    def post(self):
        """Login with email and password"""
        data = request.json
        
        if not data or not data.get('email') or not data.get('password'):
            return {'error': 'Email and password are required'}, 400
            
        user = User.query.filter_by(email=data['email'].strip().lower()).first()
        
        if not user or not user.check_password(data['password']):
            return {'error': 'Invalid email or password'}, 401
            
        # Create tokens
        access_token = create_access_token(identity=user.id, additional_claims={"role": user.role})
        refresh_token = create_refresh_token(identity=user.id)
        
        # Update login timestamp
        try:
            user.last_login = db.func.now()
            db.session.commit()
        except:
            db.session.rollback()
            
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }, 200

@auth_ns.route('/register')
class Register(Resource):
    @auth_ns.doc('register')
    @auth_ns.expect(register_model)
    @auth_ns.response(201, 'User created', token_model)
    @auth_ns.response(400, 'Validation error')
    @auth_ns.response(409, 'Email already exists')
    def post(self):
        """Register a new user"""
        data = request.json
        
        # Required fields
        missing = [k for k in ('name', 'email', 'password', 'role') if not data.get(k)]
        if missing:
            return {'error': f"Missing required fields: {', '.join(missing)}"}, 400
            
        # Check if email exists
        if User.query.filter_by(email=data['email'].strip().lower()).first():
            return {'error': 'Email already registered'}, 409
            
        # Validate role
        allowed_roles = ['tenant', 'landlord']
        if data['role'].lower() not in allowed_roles:
            return {'error': 'Invalid role. Must be tenant or landlord'}, 400
            
        # Create user
        try:
            new_user = User(
                name=data['name'].strip(),
                email=data['email'].strip().lower(),
                role=data['role'].strip().lower(),
                is_verified=False
            )
            new_user.set_password(data['password'])
            
            db.session.add(new_user)
            db.session.commit()
            
            # Create tokens
            access_token = create_access_token(identity=new_user.id, additional_claims={"role": new_user.role})
            refresh_token = create_refresh_token(identity=new_user.id)
            
            return {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': new_user.to_dict()
            }, 201
            
        except Exception as e:
            db.session.rollback()
            return {'error': f'Registration failed: {str(e)}'}, 500

@auth_ns.route('/me')
class UserResource(Resource):
    @auth_ns.doc('get_user')
    @auth_ns.response(200, 'Success', user_model)
    @auth_ns.response(401, 'Not authenticated')
    @jwt_required()
    def get(self):
        """Get current user profile"""
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return {'error': 'User not found'}, 404
            
        return {'user': user.to_dict()}, 200

@auth_ns.route('/refresh')
class TokenRefresh(Resource):
    @auth_ns.doc('refresh_token')
    @auth_ns.response(200, 'Success')
    @auth_ns.response(401, 'Invalid refresh token')
    @jwt_required(refresh=True)
    def post(self):
        """Refresh access token"""
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return {'error': 'User not found'}, 404
            
        access_token = create_access_token(identity=current_user_id, additional_claims={"role": user.role})
        
        return {
            'access_token': access_token,
            'user': user.to_dict()
        }, 200

@auth_ns.route('/logout')
class Logout(Resource):
    @auth_ns.doc('logout')
    @auth_ns.response(200, 'Success')
    def post(self):
        """Logout - client should discard tokens"""
        return {'message': 'Logout successful'}, 200
