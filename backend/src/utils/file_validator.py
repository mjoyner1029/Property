# backend/src/utils/file_validator.py

import os
import mimetypes
import hashlib
import time
# Note: Requires python-magic package to be installed
# pip install python-magic
try:
    import magic
except ImportError:
    # Fallback to mimetypes if python-magic is not installed
    magic = None
from werkzeug.utils import secure_filename

# Configuration
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB max file size
ALLOWED_EXTENSIONS = {
    # Images
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
    # Documents
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'csv',
    # Other common files
    'zip', 'tar', 'gz'
}

# Mime type validation
ALLOWED_MIME_TYPES = {
    # Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    # Documents
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/rtf', 'text/csv',
    # Archives
    'application/zip', 'application/x-tar', 'application/gzip'
}


class FileValidationError(Exception):
    """Exception raised when file validation fails"""
    pass


def is_allowed_file_extension(filename):
    """Check if the file extension is allowed"""
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    return ext in ALLOWED_EXTENSIONS


def is_allowed_file_size(file_stream):
    """Check if the file size is within limits"""
    file_stream.seek(0, os.SEEK_END)
    file_size = file_stream.tell()
    file_stream.seek(0)  # Reset stream position
    return file_size <= MAX_UPLOAD_SIZE


def is_allowed_mime_type(file_stream):
    """Check if the file MIME type is allowed using python-magic or fallback to mimetypes"""
    file_stream.seek(0)
    file_bytes = file_stream.read(2048)  # Read first 2048 bytes for magic number detection
    file_stream.seek(0)  # Reset stream position
    
    if magic:
        # Use python-magic if available
        mime = magic.Magic(mime=True)
        detected_type = mime.from_buffer(file_bytes)
    else:
        # Fallback to mimetypes (less accurate, relies on file extension)
        import mimetypes
        filename = getattr(file_stream, 'filename', '')
        detected_type = mimetypes.guess_type(filename)[0] or 'application/octet-stream'
        
    return detected_type in ALLOWED_MIME_TYPES


def generate_file_hash(file_stream):
    """Generate SHA-256 hash of file contents"""
    file_stream.seek(0)
    file_hash = hashlib.sha256()
    for chunk in iter(lambda: file_stream.read(4096), b""):
        file_hash.update(chunk)
    file_stream.seek(0)  # Reset stream position
    return file_hash.hexdigest()


def validate_file_upload(file_stream, original_filename):
    """
    Comprehensive file validation.
    
    Args:
        file_stream: File-like object with the file data
        original_filename: Original filename as provided by the user
        
    Returns:
        tuple: (secure_filename, file_hash)
        
    Raises:
        FileValidationError: If validation fails
    """
    # Secure the filename to prevent directory traversal
    filename = secure_filename(original_filename)
    
    if not filename:
        raise FileValidationError("Invalid filename")
    
    # Check file extension
    if not is_allowed_file_extension(filename):
        raise FileValidationError(f"File extension not allowed. Allowed extensions: {', '.join(ALLOWED_EXTENSIONS)}")
    
    # Check file size
    if not is_allowed_file_size(file_stream):
        max_size_mb = MAX_UPLOAD_SIZE / (1024 * 1024)
        raise FileValidationError(f"File too large. Maximum size: {max_size_mb}MB")
    
    # Verify MIME type
    if not is_allowed_mime_type(file_stream):
        raise FileValidationError("File type not allowed based on content analysis")
    
    # Generate file hash for integrity verification
    file_hash = generate_file_hash(file_stream)
    
    return filename, file_hash


def safe_storage_path(base_path, filename):
    """Generate a safe storage path for the file"""
    # Create a unique filename to prevent collisions and overwriting
    name, ext = os.path.splitext(filename)
    timestamp = str(int(time.time()))
    unique_name = f"{name}_{timestamp}{ext}"
    
    return os.path.join(base_path, unique_name)
