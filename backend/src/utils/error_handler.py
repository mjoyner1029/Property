"""
Error handling utilities for the application.
"""
from flask import jsonify, current_app
import traceback
from werkzeug.exceptions import HTTPException
import logging

logger = logging.getLogger(__name__)

def register_error_handlers(app):
    """Register error handlers with the Flask app."""
    
    @app.errorhandler(400)
    def bad_request_error(error):
        return jsonify({
            'status': 'error',
            'message': 'Bad request',
            'details': str(error)
        }), 400

    @app.errorhandler(401)
    def unauthorized_error(error):
        return jsonify({
            'status': 'error',
            'message': 'Unauthorized',
            'details': 'Authentication required'
        }), 401

    @app.errorhandler(403)
    def forbidden_error(error):
        return jsonify({
            'status': 'error',
            'message': 'Forbidden',
            'details': 'You do not have permission to access this resource'
        }), 403

    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({
            'status': 'error',
            'message': 'Not found',
            'details': 'The requested resource was not found'
        }), 404

    @app.errorhandler(405)
    def method_not_allowed_error(error):
        return jsonify({
            'status': 'error',
            'message': 'Method not allowed',
            'details': 'The method is not allowed for the requested URL'
        }), 405
        
    @app.errorhandler(422)
    def validation_error(error):
        return jsonify({
            'status': 'error',
            'message': 'Validation error',
            'details': str(error)
        }), 422

    @app.errorhandler(429)
    def too_many_requests_error(error):
        return jsonify({
            'status': 'error',
            'message': 'Too many requests',
            'details': 'Rate limit exceeded'
        }), 429

    @app.errorhandler(500)
    def internal_server_error(error):
        # Log the error for server-side debugging
        logger.error(f"500 error: {error}")
        logger.error(traceback.format_exc())
        
        # Don't send the actual error details in production
        if app.config.get('DEBUG', False):
            error_details = str(error)
        else:
            error_details = "An unexpected error occurred"
            
        return jsonify({
            'status': 'error',
            'message': 'Internal server error',
            'details': error_details
        }), 500

    @app.errorhandler(Exception)
    def handle_generic_exception(error):
        """Handle any uncaught exception."""
        # Log the error for server-side debugging
        logger.error(f"Unhandled exception: {error}")
        logger.error(traceback.format_exc())
        
        # Determine if this is an HTTP exception
        if isinstance(error, HTTPException):
            response = jsonify({
                'status': 'error',
                'message': error.name,
                'details': error.description
            })
            response.status_code = error.code
            return response
        
        # Don't send the actual error details in production
        if app.config.get('DEBUG', False):
            error_details = str(error)
        else:
            error_details = "An unexpected error occurred"
            
        return jsonify({
            'status': 'error',
            'message': 'Internal server error',
            'details': error_details
        }), 500
