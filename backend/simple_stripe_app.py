"""
A simpler test app that creates a Flask app and correctly registers the Stripe customer routes.
"""
from flask import Flask
from src.controllers.stripe_customer_controller import create_customer
from src.extensions import db, jwt
import os

# Create a Flask application
app = Flask(__name__)
app.config['SECRET_KEY'] = 'test-key'
app.config['JWT_SECRET_KEY'] = 'test-jwt-key'

# Initialize extensions
jwt.init_app(app)

# Create a route with the correct prefix
@app.route('/api/stripe/create-customer', methods=['POST'])
@app.route('/api/stripe/customers', methods=['POST'])
def create_stripe_customer():
    return create_customer()

# Print out all registered routes
print("Registered routes in test app:")
for rule in app.url_map.iter_rules():
    print(f"Route: {rule.rule}, Endpoint: {rule.endpoint}, Methods: {rule.methods}")

if __name__ == '__main__':
    print("Route check complete")
