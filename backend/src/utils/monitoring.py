# backend/src/utils/monitoring.py
import time
import logging
import os
import json
import threading
import datetime
from functools import wraps

# Configure logger
logger = logging.getLogger('asset_anchor')

class PerformanceMonitor:
    """Utility for monitoring API performance metrics"""
    
    def __init__(self):
        self.metrics = {}
        self.lock = threading.Lock()
        self._initialize_log_file()
        
    def _initialize_log_file(self):
        """Initialize the performance log file"""
        log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'logs')
        os.makedirs(log_dir, exist_ok=True)
        self.log_file = os.path.join(log_dir, 'performance.log')
    
    def _get_timestamp(self):
        """Get current timestamp as ISO format string"""
        return datetime.datetime.now().isoformat()
    
    def track_endpoint(self, endpoint_name=None):
        """Decorator to track endpoint performance"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                endpoint = endpoint_name or func.__name__
                start_time = time.time()
                
                try:
                    result = func(*args, **kwargs)
                    self.record_metric(endpoint, time.time() - start_time, success=True)
                    return result
                except Exception as e:
                    self.record_metric(endpoint, time.time() - start_time, success=False, error=str(e))
                    raise
                    
            return wrapper
        return decorator
    
    def record_metric(self, name, duration, success=True, error=None):
        """Record a performance metric"""
        with self.lock:
            if name not in self.metrics:
                self.metrics[name] = {
                    'count': 0,
                    'success_count': 0,
                    'error_count': 0,
                    'total_time': 0,
                    'min_time': float('inf'),
                    'max_time': 0,
                }
            
            metrics = self.metrics[name]
            metrics['count'] += 1
            metrics['total_time'] += duration
            metrics['min_time'] = min(metrics['min_time'], duration)
            metrics['max_time'] = max(metrics['max_time'], duration)
            
            if success:
                metrics['success_count'] += 1
            else:
                metrics['error_count'] += 1
                
            # Log slow operations (> 1 second)
            if duration > 1.0:
                logger.warning(f"Slow operation: {name} took {duration:.2f}s")
                
            # Log to performance file for analysis
            try:
                with open(self.log_file, 'a') as f:
                    log_entry = {
                        'timestamp': self._get_timestamp(),
                        'endpoint': name,
                        'duration': round(duration, 4),
                        'success': success
                    }
                    if error:
                        log_entry['error'] = error
                    f.write(json.dumps(log_entry) + '\n')
            except Exception as e:
                logger.error(f"Failed to write to performance log: {str(e)}")
    
    def get_metrics(self):
        """Get all collected metrics"""
        with self.lock:
            result = {}
            
            for name, metrics in self.metrics.items():
                avg_time = metrics['total_time'] / metrics['count'] if metrics['count'] > 0 else 0
                success_rate = metrics['success_count'] / metrics['count'] if metrics['count'] > 0 else 0
                
                result[name] = {
                    'count': metrics['count'],
                    'avg_time': round(avg_time, 4),
                    'min_time': round(metrics['min_time'], 4) if metrics['min_time'] != float('inf') else 0,
                    'max_time': round(metrics['max_time'], 4),
                    'success_rate': round(success_rate, 4)
                }
                
            return result
    
    def reset_metrics(self):
        """Reset all metrics"""
        with self.lock:
            self.metrics = {}

# Singleton instance
performance_monitor = PerformanceMonitor()

def monitor(endpoint_name=None):
    """Shortcut decorator for tracking endpoint performance"""
    return performance_monitor.track_endpoint(endpoint_name)

def setup_request_logging(app):
    """Set up request logging for Flask app"""
    @app.before_request
    def log_request():
        """Log request details"""
        import flask
        # Store request start time
        flask.g.start_time = time.time()
        
        # Log request details at DEBUG level
        logger.debug(f"Request: {flask.request.method} {flask.request.path} " +
                     f"(Content-Type: {flask.request.content_type})")
        
    @app.after_request
    def log_response(response):
        """Log response details and timing"""
        import flask
        # Calculate request duration
        duration = time.time() - getattr(flask.g, 'start_time', time.time())
        
        # Log at appropriate level based on status code
        if response.status_code >= 500:
            log_func = logger.error
        elif response.status_code >= 400:
            log_func = logger.warning
        else:
            log_func = logger.info
            
        log_func(f"Response: {flask.request.method} {flask.request.path} " +
                 f"{response.status_code} ({duration:.2f}s)")
        
        return response
        
    @app.teardown_request
    def log_exception(exc):
        """Log unhandled exceptions"""
        if exc is not None:
            logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
