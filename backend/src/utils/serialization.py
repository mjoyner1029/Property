"""
Utility functions for consistent model serialization and safe property access.
"""

def safe_property_dict(obj):
    """
    Safely extract basic property information from an object with a property relation.
    Returns None if property is not set, otherwise returns a dict with id and name.
    
    Args:
        obj: The model object that might have a property relation
        
    Returns:
        dict: {"id": property_id, "name": property_name} or None if property not set
    """
    # First try to get property as a relationship
    p = getattr(obj, "property", None)
    
    # If there's no property relation, try to get property_id directly
    if not p and hasattr(obj, "property_id"):
        property_id = getattr(obj, "property_id")
        if property_id:
            # Basic info with just the ID
            return {"id": property_id, "name": None}
        return None
    
    # If we got a property object, extract its details
    if p:
        return {"id": getattr(p, "id", None), "name": getattr(p, "name", None)}
        
    # No property found
    return None
