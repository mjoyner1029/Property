"""
Metrics endpoints for application performance monitoring.
Provides Prometheus-compatible metrics.
"""
from flask import Blueprint, Response, current_app
import time
import os
import psutil
import json
from prometheus_client import generate_latest, Counter, Histogram, Gauge, CollectorRegistry, multiprocess

# Create metrics blueprint
bp = Blueprint('metrics', __name__)

# Define metrics
REQUEST_COUNT = Counter(
    'request_count', 'App Request Count',
    ['app_name', 'method', 'endpoint', 'http_status']
)
REQUEST_LATENCY = Histogram(
    'request_latency_seconds', 'Request latency',
    ['app_name', 'endpoint']
)
ERROR_COUNT = Counter(
    'error_count', 'Application Error Count',
    ['app_name', 'error_type']
)
ACTIVE_SESSIONS = Gauge(
    'active_sessions', 'Number of active user sessions',
    ['app_name']
)
CPU_USAGE = Gauge('cpu_usage_percent', 'CPU Usage Percentage')
MEMORY_USAGE = Gauge('memory_usage_bytes', 'Memory Usage in Bytes')
DB_QUERY_LATENCY = Histogram(
    'db_query_latency_seconds', 'Database Query Latency',
    ['app_name', 'query_type']
)

def track_request_latency(start_time, endpoint):
    """Track request latency for a specific endpoint."""
    latency = time.time() - start_time
    REQUEST_LATENCY.labels('property_backend', endpoint).observe(latency)

def track_request_count(method, endpoint, status):
    """Track request count for specific method, endpoint and status code."""
    REQUEST_COUNT.labels('property_backend', method, endpoint, status).inc()

def track_error(error_type):
    """Track application errors by type."""
    ERROR_COUNT.labels('property_backend', error_type).inc()

def update_system_metrics():
    """Update system metrics (CPU, memory)."""
    CPU_USAGE.set(psutil.cpu_percent())
    MEMORY_USAGE.set(psutil.virtual_memory().used)

def init_metrics(app):
    """Initialize metrics collection for the app."""
    @app.before_request
    def before_request():
        # Store the start time of each request
        from flask import request
        request.start_time = time.time()

    @app.after_request
    def after_request(response):
        from flask import request
        # Skip metrics for the metrics endpoint itself to avoid recursion
        if request.path != '/api/metrics':
            # Track request latency
            latency = time.time() - getattr(request, 'start_time', time.time())
            REQUEST_LATENCY.labels('property_backend', request.path).observe(latency)
            
            # Track request count
            REQUEST_COUNT.labels(
                'property_backend',
                request.method,
                request.path,
                response.status_code
            ).inc()
            
            # Track errors
            if response.status_code >= 400:
                ERROR_COUNT.labels(
                    'property_backend',
                    f'http_{response.status_code}'
                ).inc()

        return response

    # Register metrics blueprint
    app.register_blueprint(bp, url_prefix='/api')

@bp.route('/metrics')
def metrics():
    """Expose metrics in Prometheus format."""
    # Update system metrics
    update_system_metrics()
    
    # Generate and return metrics
    registry = CollectorRegistry()
    multiprocess.MultiProcessCollector(registry)
    
    return Response(generate_latest(registry), mimetype='text/plain')
