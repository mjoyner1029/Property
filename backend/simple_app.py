from src.app import create_app
import os

# Set environment variables
os.environ['FLASK_ENV'] = 'development'
os.environ['DATABASE_URL'] = 'sqlite:///instance/app.db'
os.environ['DISABLE_RATE_LIMIT'] = '1'

app = create_app()

@app.route('/simple-health')
def simple_health():
    return {'status': 'ok', 'message': 'Simple health check passed!'}

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
