from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)

# Enable CORS for all routes with the appropriate origins
CORS(app, resources={r"/*": {"origins": "http://localhost:3002", "supports_credentials": True}})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "version": "1.0.0", "git_sha": "unknown"})

@app.route('/api/health', methods=['GET'])
def api_health():
    return jsonify({"status": "healthy", "version": "1.0.0", "git_sha": "unknown"})

@app.route('/api/auth/login', methods=['POST'])
def login():
    return jsonify({"token": "test-token", "message": "Login successful - test mode"})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5050, debug=True)
