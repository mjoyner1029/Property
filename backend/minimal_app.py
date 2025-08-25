"""
Minimal API with health and database check endpoints
"""
from flask import Flask, jsonify
from sqlalchemy.exc import SQLAlchemyError
import os

from src.extensions import db
from src.config import get_config

def create_minimal_app():
    """Create minimal application with health check and DB check endpoints"""
    app = Flask(__name__)
    
    # Load configuration
    config_name = os.environ.get('APP_ENV', 'development')
    config_obj = get_config(config_name)
    app.config.from_object(config_obj)
    
    # Initialize database
    db.init_app(app)
    
    @app.route('/health')
    def health():
        """Basic health check endpoint"""
        git_sha = os.environ.get('GIT_SHA', 'unknown')
        return jsonify({
            'status': 'healthy',
            'version': app.config.get('VERSION', '1.0.0'),
            'git_sha': git_sha,
            'environment': app.config.get('ENV', 'development')
        })
    
    @app.route('/db-check')
    def db_check():
        """Database connectivity check"""
        try:
            # Execute a simple query to check connection
            result = db.session.execute('SELECT 1').scalar()
            
            if result == 1:
                return jsonify({
                    'status': 'ok',
                    'message': 'Database connection successful',
                    'database_url': app.config.get('SQLALCHEMY_DATABASE_URI', '').split('@')[-1]  # Hide credentials
                })
            else:
                return jsonify({
                    'status': 'error',
                    'message': 'Unexpected database result'
                }), 500
        except SQLAlchemyError as e:
            return jsonify({
                'status': 'error',
                'message': f'Database error: {str(e)}'
            }), 500
    
    return app

# Create the application instance
app = create_minimal_app()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
