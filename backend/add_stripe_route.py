#!/usr/bin/env python3
"""
This script fixes the stripe routes to ensure that create-customer is properly registered.
"""

import os
import sys

def fix_stripe_routes():
    """
    Add the create-customer route to the stripe_routes.py file
    """
    stripe_routes_path = os.path.join("src", "routes", "stripe_routes.py")

    with open(stripe_routes_path, 'r') as f:
        content = f.read()
    
    # Check if the route is already added (we might have done it already)
    if "bp.route('/create-customer', methods=['POST'])(create_customer)" not in content:
        # Find the line with the customers route and add our new route after it
        content = content.replace(
            "bp.route('/customers', methods=['POST'])(create_customer)",
            "bp.route('/customers', methods=['POST'])(create_customer)\nbp.route('/create-customer', methods=['POST'])(create_customer)"
        )
        
        with open(stripe_routes_path, 'w') as f:
            f.write(content)
        print(f"Added create-customer route to {stripe_routes_path}")
    else:
        print("create-customer route already exists, no changes needed")

if __name__ == "__main__":
    fix_stripe_routes()
