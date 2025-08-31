"""
A script to check the registered routes in the application.
"""
from src.app import create_app

app = create_app()

with app.app_context():
    print("Registered routes:")
    for rule in app.url_map.iter_rules():
        print(f"Route: {rule.rule}, Endpoint: {rule.endpoint}, Methods: {rule.methods}")

    # Check specifically for stripe routes
    print("\nStripe routes:")
    for rule in app.url_map.iter_rules():
        if 'stripe' in rule.rule:
            print(f"Route: {rule.rule}, Endpoint: {rule.endpoint}, Methods: {rule.methods}")
