"""
Database performance utilities for logging slow queries in development and staging.
Enable with environment variable: ENABLE_SLOW_QUERY_LOGGING=1
Configure threshold (milliseconds) with: SLOW_QUERY_THRESHOLD=100 (defaults to 100ms)
"""

import logging
import os
import time
from functools import wraps
from sqlalchemy import event
from sqlalchemy.engine import Engine

# Configure logger
logger = logging.getLogger("slow_query")
handler = logging.FileHandler("logs/slow_queries.log")
handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
))
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# Get configuration from environment
ENABLE_SLOW_QUERY_LOGGING = bool(os.environ.get("ENABLE_SLOW_QUERY_LOGGING", False))
SLOW_QUERY_THRESHOLD = int(os.environ.get("SLOW_QUERY_THRESHOLD", 100))  # milliseconds


def init_slow_query_logging(app=None):
    """Initialize slow query logging for SQLAlchemy if enabled."""
    if not ENABLE_SLOW_QUERY_LOGGING:
        return
    
    logger.info(f"Slow query logging enabled. Threshold: {SLOW_QUERY_THRESHOLD}ms")
    
    @event.listens_for(Engine, "before_cursor_execute")
    def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        context._query_start_time = time.time()

    @event.listens_for(Engine, "after_cursor_execute")
    def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        total_time = int((time.time() - context._query_start_time) * 1000)
        
        if total_time >= SLOW_QUERY_THRESHOLD:
            logger.warning(
                f"Slow query detected: {total_time}ms\n"
                f"Statement: {statement}\n"
                f"Parameters: {parameters}\n"
                f"{'='*80}"
            )


def track_function_performance(threshold_ms=100):
    """
    Decorator to track function execution time and log if it exceeds threshold.
    
    Args:
        threshold_ms: Threshold in milliseconds after which to log the slow function
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not ENABLE_SLOW_QUERY_LOGGING:
                return func(*args, **kwargs)
                
            start_time = time.time()
            result = func(*args, **kwargs)
            end_time = time.time()
            
            execution_time = int((end_time - start_time) * 1000)
            if execution_time > threshold_ms:
                logger.warning(
                    f"Slow function detected: {func.__module__}.{func.__name__} took {execution_time}ms"
                )
                
            return result
        return wrapper
    return decorator
