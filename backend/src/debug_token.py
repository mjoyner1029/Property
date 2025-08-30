import os
import sys
import jwt
from datetime import datetime, timedelta

# The token from the test output
token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc1NjUxNDg4OCwianRpIjoiYzZhN2Q5NzktMjI1Ni00NDZkLWIyMGUtYzNmMjhiNzY0YWJkIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6MiwibmJmIjoxNzU2NTE0ODg4LCJleHAiOjE3NTY1MTQ5NDh9.F92jlOZ8Mtg2VWQo87DtVceKv-XfynUomYxLiWk8Yis'

try:
    # Try to decode with different secret keys
    secrets = ['test-key', 'dev-key', 'secret', 'supersecret', 'super-secret']
    decoded = None
    
    for secret in secrets:
        try:
            decoded = jwt.decode(token, secret, algorithms=["HS256"])
            print(f"Successfully decoded with secret: {secret}")
            print(f"Decoded: {decoded}")
            break
        except jwt.InvalidSignatureError:
            print(f"Failed to decode with secret: {secret}")
            
    if not decoded:
        # Try without verification
        decoded = jwt.decode(token, options={"verify_signature": False}, algorithms=["HS256"])
        print("Decoded without verification:")
        print(decoded)

    # Create our own token
    payload = {
        'sub': 2,  # user_id
        'fresh': False,
        'iat': datetime.now().timestamp(),
        'jti': '12345678-1234-5678-1234-567812345678',
        'type': 'access',
        'nbf': datetime.now().timestamp(),
        'exp': (datetime.now() + timedelta(minutes=15)).timestamp()
    }
    
    # Default secret in tests is likely 'testing'
    test_token = jwt.encode(payload, 'testing', algorithm='HS256')
    print(f"\nCreated test token: {test_token}")

except Exception as e:
    print(f"Error: {e}")
