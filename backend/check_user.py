import os
os.environ['FLASK_ENV'] = 'testing'

from src import create_app
from src.models.user import User

app = create_app()
with app.app_context():
    user = User.query.filter_by(email='admin@example.com').first()
    if user:
        print(f"Admin user found: {user.id}")
        print(f"- is_verified: {user.is_verified}")
        print(f"- is_active: {user.is_active}")
    else:
        print("Admin user not found")
