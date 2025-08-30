"""Simple script to test auth headers in a Flask app"""
from flask import Flask, request, jsonify
from datetime import timedelta
import os

app = Flask(__name__)

@app.route('/echo', methods=['GET'])
def echo_headers():
    """Echo the headers back in the response"""
    headers = dict(request.headers)
    auth_header = request.headers.get('Authorization')
    
    # Print authorization header details for debugging
    if auth_header:
        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() == 'bearer':
            token = parts[1]
            token_parts = token.split('.')
            if len(token_parts) == 3:
                header, payload, signature = token_parts
                header_len = len(header)
                payload_len = len(payload)
                sig_len = len(signature)
                print(f"Token parts lengths: header={header_len}, payload={payload_len}, signature={sig_len}")
            else:
                print(f"Invalid token format: {token[:20]}...")
        else:
            print(f"Invalid Authorization header format: {auth_header[:20]}...")
    
    return jsonify({
        'headers': headers,
        'auth': auth_header
    })

if __name__ == '__main__':
    app.run(debug=True, port=5002)
