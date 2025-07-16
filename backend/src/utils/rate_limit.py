"""
Rate limiting utilities for API endpoints.
"""
import time
import functools
from flask import request, jsonify, current_app
from datetime import datetime

class RateLimitExceededError(Exception):
    """Exception raised when rate limit is exceeded."""
    pass

class RateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(self):
        self.requests = {}
        self.cleanup_interval = 3600  # Cleanup old entries every hour
        self.last_cleanup = time.time()
    
    def check_rate_limit(self, key, limit, period):
        """
        Check if the rate limit for a key has been exceeded.
        
        Args:
            key: Unique identifier for the rate limit (usually IP or user ID)
            limit: Maximum number of requests allowed
            period: Time period in seconds
            
        Returns:
            (bool, int): Tuple of (is_allowed, remaining_requests)
        """
        now = time.time()
        
        # Clean up old entries periodically
        if now - self.last_cleanup > self.cleanup_interval:
            self._cleanup(now)
        
        # Initialize entry if it doesn't exist
        if key not in self.requests:
            self.requests[key] = []
        
        # Remove timestamps outside the current period
        self.requests[key] = [ts for ts in self.requests[key] if now - ts < period]
        
        # Check if limit is exceeded
        if len(self.requests[key]) >= limit:
            return False, 0
        
        # Record this request
        self.requests[key].append(now)
        
        # Return remaining requests
        remaining = limit - len(self.requests[key])
        return True, remaining
    
    def _cleanup(self, now):
        """Remove old entries to prevent memory leaks."""
        keys_to_delete = []
        
        for key, timestamps in self.requests.items():
            # If no timestamps within last day, remove the key
            if not timestamps or (now - max(timestamps) > 86400):
                keys_to_delete.append(key)
        
        for key in keys_to_delete:
            del self.requests[key]
        
        self.last_cleanup = now

# Create a global rate limiter instance
limiter = RateLimiter()

def rate_limit(limit, period, key_function=None):
    """
    Decorator for rate limiting API endpoints.
    
    Args:
        limit: Maximum number of requests allowed
        period: Time period in seconds
        key_function: Function to generate the rate limit key (defaults to client IP)
    
    Example:
        @app.route("/api/endpoint")
        @rate_limit(limit=5, period=60)
        def my_endpoint():
            # This endpoint is limited to 5 requests per minute per IP
    """
    def decorator(f):
        @functools.wraps(f)
        def wrapped(*args, **kwargs):
            # Get the key for rate limiting
            if key_function:
                key = key_function()
            else:
                # Default to client IP
                key = request.remote_addr
            
            # Check rate limit
            allowed, remaining = limiter.check_rate_limit(key, limit, period)
            
            if not allowed:
                response = jsonify({
                    "error": "Rate limit exceeded",
                    "code": 429,
                    "message": f"Too many requests. Try again later."
                })
                response.status_code = 429
                response.headers["Retry-After"] = str(period)
                return response
            
            # Add rate limit headers
            response = f(*args, **kwargs)
            if hasattr(response, 'headers'):
                response.headers["X-RateLimit-Limit"] = str(limit)
                response.headers["X-RateLimit-Remaining"] = str(remaining)
                response.headers["X-RateLimit-Reset"] = str(int(time.time() + period))
            
            return response
        return wrapped
    return decorator