# backend/src/utils/file_validator.py
"""
Utility functions for validating uploaded files.

Features:
- Extension whitelist
- Size limit enforcement
- MIME type detection (python-magic preferred, mimetypes fallback)
- SHA-256 integrity hash
- Safe filename + storage path generation
"""

import os
import time
import hashlib

from werkzeug.utils import secure_filename

# Optional python-magic for content-based MIME detection
try:
    import magic
except ImportError:
    magic = None

# ----------------------------
# Configuration
# ----------------------------
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB max file size

ALLOWED_EXTENSIONS = {
    # Images
    "jpg", "jpeg", "png", "gif", "webp", "svg",
    # Documents
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf", "csv",
    # Archives
    "zip", "tar", "gz",
}

ALLOWED_MIME_TYPES = {
    # Images
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
    # Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/rtf",
    "text/csv",
    # Archives
    "application/zip",
    "application/x-tar",
    "application/gzip",
}


# ----------------------------
# Exceptions
# ----------------------------
class FileValidationError(Exception):
    """Raised when file validation fails with a human-readable message."""

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message

    def __str__(self) -> str:
        return f"FileValidationError: {self.message}"


# ----------------------------
# Validators
# ----------------------------
def is_allowed_file_extension(filename: str) -> bool:
    """Return True if the file extension is allowed."""
    ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
    return ext in ALLOWED_EXTENSIONS


def is_allowed_file_size(file_stream) -> bool:
    """
    Return True if file size <= MAX_UPLOAD_SIZE.
    Resets the stream position after checking.
    """
    file_stream.seek(0, os.SEEK_END)
    file_size = file_stream.tell()
    file_stream.seek(0)
    return file_size <= MAX_UPLOAD_SIZE


def is_allowed_mime_type(file_stream) -> bool:
    """
    Return True if the file MIME type is allowed.
    Uses python-magic if installed, otherwise falls back to mimetypes.
    """
    file_stream.seek(0)
    file_bytes = file_stream.read(2048)  # enough for magic number detection
    file_stream.seek(0)

    if magic:
        detected_type = magic.Magic(mime=True).from_buffer(file_bytes)
    else:
        import mimetypes

        filename = getattr(file_stream, "filename", "")
        detected_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"

    return detected_type in ALLOWED_MIME_TYPES


def generate_file_hash(file_stream) -> str:
    """
    Return SHA-256 hex digest of the file contents.
    Resets the stream position after hashing.
    """
    file_stream.seek(0)
    file_hash = hashlib.sha256()
    for chunk in iter(lambda: file_stream.read(4096), b""):
        file_hash.update(chunk)
    file_stream.seek(0)
    return file_hash.hexdigest()


# ----------------------------
# Main validation
# ----------------------------
def validate_file_upload(file_stream, original_filename: str) -> tuple[str, str]:
    """
    Comprehensive file validation.

    Args:
        file_stream: File-like object containing file data
        original_filename: Original filename from the client

    Returns:
        (secure_filename, file_hash)

    Raises:
        FileValidationError if any validation fails
    """
    filename = secure_filename(original_filename)
    if not filename:
        raise FileValidationError("Invalid filename provided")

    if not is_allowed_file_extension(filename):
        raise FileValidationError(
            f"File extension not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    if not is_allowed_file_size(file_stream):
        max_size_mb = MAX_UPLOAD_SIZE / (1024 * 1024)
        raise FileValidationError(f"File too large. Maximum size: {max_size_mb:.1f} MB")

    if not is_allowed_mime_type(file_stream):
        raise FileValidationError("File type not allowed based on MIME type")

    file_hash = generate_file_hash(file_stream)
    return filename, file_hash


# ----------------------------
# Storage helpers
# ----------------------------
def safe_storage_path(base_path: str, filename: str) -> str:
    """
    Return a safe storage path for the file with a unique timestamp suffix.
    Example: uploads/file_1693274830.pdf
    """
    name, ext = os.path.splitext(filename)
    timestamp = str(int(time.time()))
    unique_name = f"{name}_{timestamp}{ext}"
    return os.path.join(base_path, unique_name)
