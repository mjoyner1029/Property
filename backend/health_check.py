from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'message': 'Health check passed!'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
