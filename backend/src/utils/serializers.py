"""
Utilities for serializing model objects to dictionaries.
"""
from datetime import datetime, date
from decimal import Decimal
import uuid
import json

class ModelSerializer:
    """
    Class for serializing SQLAlchemy models to dictionaries.
    """
    
    @staticmethod
    def serialize(obj, exclude=None, include=None, depth=1):
        """
        Serialize a model instance to a dictionary.
        
        Args:
            obj: SQLAlchemy model instance
            exclude: List of fields to exclude
            include: List of additional fields/relationships to include
            depth: Maximum depth for relationship serialization
            
        Returns:
            Dictionary representation of the model
        """
        if obj is None:
            return None
            
        exclude = exclude or []
        include = include or []
        result = {}
        
        # If the object has a to_dict method, use it
        if hasattr(obj, 'to_dict') and callable(getattr(obj, 'to_dict')):
            return obj.to_dict()
        
        # Extract column values
        if hasattr(obj, '__table__'):
            for column in obj.__table__.columns:
                if column.name not in exclude:
                    value = getattr(obj, column.name)
                    result[column.name] = ModelSerializer._convert_value(value)
        
        # Include additional fields/relationships
        if depth > 0:
            for field in include:
                if field not in exclude:
                    value = getattr(obj, field, None)
                    
                    if value is None:
                        result[field] = None
                    elif isinstance(value, list):
                        result[field] = [
                            ModelSerializer.serialize(item, depth=depth-1) 
                            for item in value
                        ]
                    else:
                        result[field] = ModelSerializer.serialize(value, depth=depth-1)
        
        return result
    
    @staticmethod
    def _convert_value(value):
        """Convert a Python value to a JSON-serializable format."""
        if value is None:
            return None
        elif isinstance(value, (datetime, date)):
            return value.isoformat()
        elif isinstance(value, Decimal):
            return float(value)
        elif isinstance(value, uuid.UUID):
            return str(value)
        elif hasattr(value, 'to_dict') and callable(getattr(value, 'to_dict')):
            return value.to_dict()
        return value
    
    @staticmethod
    def serialize_list(objs, **kwargs):
        """
        Serialize a list of model instances.
        
        Args:
            objs: List of SQLAlchemy model instances
            **kwargs: Additional arguments to pass to serialize()
            
        Returns:
            List of dictionaries
        """
        return [ModelSerializer.serialize(obj, **kwargs) for obj in objs]


class CustomJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles additional Python types."""
    
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        elif isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, uuid.UUID):
            return str(obj)
        elif hasattr(obj, 'to_dict') and callable(getattr(obj, 'to_dict')):
            return obj.to_dict()
        return super().default(obj)