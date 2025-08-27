"""
Utility for managing request tracing and context.
"""
from __future__ import annotations

import uuid
import threading
from typing import Dict, Any, Optional

from flask import request, current_app

# Thread-local storage for trace context
_thread_local = threading.local()


def initialize_request_context() -> str:
    """
    Initialize the request context with a trace ID.
    
    Returns:
        str: The generated trace ID
    """
    trace_id = getattr(request, 'trace_id', str(uuid.uuid4()))
    set_trace_context({'trace_id': trace_id})
    return trace_id


def set_trace_context(context: Dict[str, Any]) -> None:
    """
    Set trace context for the current thread.
    
    Args:
        context: Dictionary of context values
    """
    _thread_local.trace_context = context


def get_trace_context() -> Dict[str, Any]:
    """
    Get trace context for the current thread.
    
    Returns:
        Dict containing trace context or empty dict if not set
    """
    return getattr(_thread_local, 'trace_context', {})


def get_trace_id() -> Optional[str]:
    """
    Get trace ID from current context.
    
    Returns:
        Trace ID or None if not set
    """
    context = get_trace_context()
    return context.get('trace_id')


def clear_trace_context() -> None:
    """Clear trace context for the current thread."""
    if hasattr(_thread_local, 'trace_context'):
        delattr(_thread_local, 'trace_context')


def log_with_context(message: str, level: str = 'info', **kwargs) -> None:
    """
    Log a message with the current trace context.
    
    Args:
        message: Log message
        level: Log level (info, warning, error, critical, debug)
        **kwargs: Additional log data to include
    """
    context = get_trace_context()
    log_data = {**context, **kwargs}
    
    if hasattr(current_app, 'logger'):
        logger = current_app.logger
        log_method = getattr(logger, level.lower(), logger.info)
        log_method(message, extra=log_data)
