"""
Database utility functions to update SQLAlchemy patterns.
These helpers support modern SQLAlchemy patterns.
"""
from ..extensions import db
from sqlalchemy.orm import Session
from typing import Any, Type, TypeVar

T = TypeVar('T')

def get_by_id(model_class: Type[T], id: Any) -> T:
    """
    Get an object by its primary key ID using the modern Session.get() method.
    This replaces the deprecated Query.get() method.
    
    Args:
        model_class: The SQLAlchemy model class
        id: The primary key value
        
    Returns:
        The model instance or None if not found
    """
    return db.session.get(model_class, id)
