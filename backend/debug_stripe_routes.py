"""
A simplified script to check Stripe routes by creating a separate app with only Stripe routes registered.
This helps isolate registration issues.
"""
from flask import Flask
from src.controllers.stripe_customer_controller import create_customer

app = Flask(__name__)

# Register the create_customer function directly as an endpoint
app.route('/api/stripe/create-customer', methods=['POST'])(create_customer)
app.route('/api/stripe/customers', methods=['POST'])(create_customer)

# Print out all registered routes
print("Registered routes in simplified app:")
for rule in app.url_map.iter_rules():
    print(f"Route: {rule.rule}, Endpoint: {rule.endpoint}, Methods: {rule.methods}")

if __name__ == '__main__':
    print("Route check complete")
