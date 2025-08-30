"""Debug JWT token script."""
import sys
import os

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the app factory and JWT from our application
from src import create_app
from src.extensions import jwt

# Create the app using our factory
app = create_app()
app.config.from_object("src.config.TestingConfig")

# A landlord token from the test output
token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc1NjUxNDg4OCwianRpIjoiYzZhN2Q5NzktMjI1Ni00NDZkLWIyMGUtYzNmMjhiNzY0YWJkIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6MiwibmJmIjoxNzU2NTE0ODg4LCJleHAiOjE3NTY1MTQ5NDh9.F92jlOZ8Mtg2VWQo87DtVceKv-XfynUomYxLiWk8Yis'

# Test creating a token
with app.app_context():
    try:
        # Import these inside the app context to use our configured jwt
        from flask_jwt_extended import decode_token, create_access_token, get_jwt_identity, get_jwt
        
        # Decode the token
        decoded = decode_token(token)
        print(f"Decoded token: {decoded}")
        print(f"Subject (user ID): {decoded.get('sub')}, type: {type(decoded.get('sub'))}")
        
        # Create a new token with various identity formats
        print("\nCreating new tokens...")
        token_int = create_access_token(identity=2)
        print(f"Integer identity token: {token_int}")
        decoded_int = decode_token(token_int)
        print(f"Decoded int token subject: {decoded_int.get('sub')}, type: {type(decoded_int.get('sub'))}")
        
        token_dict = create_access_token(identity={'id': 2, 'role': 'landlord'})
        print(f"Dict identity token: {token_dict}")
        decoded_dict = decode_token(token_dict)
        print(f"Decoded dict token subject: {decoded_dict.get('sub')}, type: {type(decoded_dict.get('sub'))}")
        
        token_str = create_access_token(identity='2')
        print(f"String identity token: {token_str}")
        decoded_str = decode_token(token_str)
        print(f"Decoded str token subject: {decoded_str.get('sub')}, type: {type(decoded_str.get('sub'))}")
        
        # Test our identity loaders
        print("\nTesting identity loaders...")
        print(f"JWT identity loader result for integer 2: {jwt.user_identity_loader(2)}")
        print(f"JWT identity loader result for dict {{'id': 2}}: {jwt.user_identity_loader({'id': 2})}")
        print(f"JWT identity loader result for string '2': {jwt.user_identity_loader('2')}")
        
    except Exception as e:
        print(f"Error: {e}")
