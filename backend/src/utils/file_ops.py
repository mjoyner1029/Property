"""
Utilities for file operations.
"""
import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app
import mimetypes
import hashlib

def allowed_file(filename, allowed_extensions=None):
    """
    Check if a file has an allowed extension.
    
    Args:
        filename: Filename to check
        allowed_extensions: Set of allowed extensions (default: from app config)
        
    Returns:
        Boolean indicating if file is allowed
    """
    if not allowed_extensions:
        allowed_extensions = current_app.config.get(
            'ALLOWED_EXTENSIONS', 
            {'pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx'}
        )
        
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

def secure_save_file(file, directory=None, prefix=''):
    """
    Securely save an uploaded file with a unique name.
    
    Args:
        file: FileStorage object from request.files
        directory: Directory to save the file (default: app's upload folder)
        prefix: Optional prefix for the filename
        
    Returns:
        Dictionary with file information or None if save failed
    """
    if not file or file.filename == '':
        return None
        
    if directory is None:
        directory = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        
    # Create directory if it doesn't exist
    if not os.path.exists(directory):
        os.makedirs(directory)
        
    # Generate secure and unique filename
    filename = secure_filename(file.filename)
    name, ext = os.path.splitext(filename)
    unique_id = uuid.uuid4().hex
    final_filename = f"{prefix}_{unique_id}{ext}" if prefix else f"{unique_id}{ext}"
    
    # Full path to save the file
    filepath = os.path.join(directory, final_filename)
    
    try:
        # Save the file
        file.save(filepath)
        
        # Get file size and hash
        file_size = os.path.getsize(filepath)
        file_hash = get_file_hash(filepath)
        
        # Get mimetype
        mimetype = mimetypes.guess_type(filepath)[0] or 'application/octet-stream'
        
        return {
            'filename': final_filename,
            'original_name': filename,
            'path': filepath,
            'size': file_size,
            'mimetype': mimetype,
            'hash': file_hash
        }
    except Exception as e:
        current_app.logger.error(f"Error saving file: {str(e)}")
        return None

def get_file_hash(filepath, algorithm='sha256'):
    """
    Calculate a hash of a file.
    
    Args:
        filepath: Path to the file
        algorithm: Hash algorithm to use
        
    Returns:
        Hexadecimal hash string
    """
    hash_obj = hashlib.new(algorithm)
    
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b''):
            hash_obj.update(chunk)
            
    return hash_obj.hexdigest()

def delete_file(filepath):
    """
    Delete a file safely.
    
    Args:
        filepath: Path to the file
        
    Returns:
        Boolean indicating success
    """
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
            return True
        return False
    except Exception as e:
        current_app.logger.error(f"Error deleting file: {str(e)}")
        return False

def get_file_extension(filename):
    """
    Extract the extension from a filename.
    
    Args:
        filename: Filename
        
    Returns:
        Extension without the dot
    """
    if '.' in filename:
        return filename.rsplit('.', 1)[1].lower()
    return ""