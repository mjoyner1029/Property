"""
Simple caching utilities for API responses.
"""
import time
import functools
import hashlib
import json
from flask import request, current_app

class SimpleCache:
    """Simple in-memory cache implementation."""
    
    def __init__(self):
        self.cache = {}
        self.expiry_times = {}
    
    def get(self, key):
        """Get a value from the cache."""
        if key in self.cache and time.time() < self.expiry_times.get(key, 0):
            return self.cache[key]
        return None
    
    def set(self, key, value, ttl=300):
        """Set a value in the cache with an expiration time."""
        self.cache[key] = value
        self.expiry_times[key] = time.time() + ttl
    
    def delete(self, key):
        """Remove a key from the cache."""
        if key in self.cache:
            del self.cache[key]
        if key in self.expiry_times:
            del self.expiry_times[key]
    
    def clear(self):
        """Clear all items from the cache."""
        self.cache.clear()
        self.expiry_times.clear()
    
    def cleanup(self):
        """Remove expired items from the cache."""
        now = time.time()
        expired_keys = [k for k, exp in self.expiry_times.items() if now > exp]
        for key in expired_keys:
            self.delete(key)

# Create a global cache instance
cache = SimpleCache()

def cached(ttl=300, key_prefix=''):
    """
    Decorator to cache API responses.
    
    Args:
        ttl: Time to live in seconds
        key_prefix: Prefix for cache key
        
    Example:
        @app.route("/api/properties")
        @cached(ttl=60)
        def get_properties():
            # This endpoint will be cached for 60 seconds
    """
    def decorator(f):
        @functools.wraps(f)
        def wrapped(*args, **kwargs):
            # Skip cache in development if configured
            if current_app.debug and not current_app.config.get('CACHE_IN_DEBUG', False):
                return f(*args, **kwargs)
            
            # Generate cache key based on function, args, kwargs and request
            key_parts = [
                key_prefix,
                f.__module__,
                f.__name__,
                request.path,
                request.query_string.decode('utf-8'),
                str(sorted(request.args.items())),
                json.dumps(kwargs, sort_keys=True)
            ]
            
            key = hashlib.md5(''.join(key_parts).encode('utf-8')).hexdigest()
            
            # Try to get from cache
            cached_response = cache.get(key)
            if cached_response is not None:
                return cached_response
            
            # Generate and cache the response
            response = f(*args, **kwargs)
            
            # Only cache successful responses
            if hasattr(response, 'status_code') and 200 <= response.status_code < 300:
                cache.set(key, response, ttl)
            
            return response
        return wrapped
    return decorator