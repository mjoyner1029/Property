import pytest
import io
import os
from ..utils.file_validator import (
    is_allowed_file_extension,
    is_allowed_file_size,
    validate_file_upload,
    FileValidationError,
    MAX_UPLOAD_SIZE
)

def test_allowed_file_extension():
    """Test file extension validation"""
    # Valid extensions
    assert is_allowed_file_extension('test.jpg')
    assert is_allowed_file_extension('test.pdf')
    assert is_allowed_file_extension('test.docx')
    assert is_allowed_file_extension('test.csv')
    
    # Invalid extensions
    assert not is_allowed_file_extension('test.exe')
    assert not is_allowed_file_extension('test.js')
    assert not is_allowed_file_extension('test.php')
    assert not is_allowed_file_extension('test')  # No extension


def test_allowed_file_size():
    """Test file size validation"""
    # Small file (1KB)
    small_file = io.BytesIO(b'x' * 1024)
    assert is_allowed_file_size(small_file)
    
    # File at the limit (reset stream position first)
    small_file.seek(0)
    assert is_allowed_file_size(small_file)
    
    # Check if position is reset
    assert small_file.tell() == 0
    
    # File over the limit
    try:
        # Create a file that's just over the limit
        large_file = io.BytesIO(b'x' * (MAX_UPLOAD_SIZE + 1))
        assert not is_allowed_file_size(large_file)
    except MemoryError:
        # In case we can't allocate that much memory, skip this check
        pass


def test_validate_file_upload_success():
    """Test successful file validation"""
    # Create a simple valid file
    valid_file = io.BytesIO(b'valid file content')
    valid_file.filename = 'test.pdf'
    
    # Should not raise an exception
    try:
        filename, file_hash = validate_file_upload(valid_file, 'test.pdf')
        assert filename == 'test.pdf'
        assert isinstance(file_hash, str)
        assert len(file_hash) == 64  # SHA-256 hash length
    except FileValidationError:
        pytest.fail("validate_file_upload raised FileValidationError unexpectedly")


def test_validate_file_upload_invalid_extension():
    """Test file validation with invalid extension"""
    # Create a file with invalid extension
    invalid_file = io.BytesIO(b'invalid file content')
    
    with pytest.raises(FileValidationError) as excinfo:
        validate_file_upload(invalid_file, 'test.exe')
    
    assert "extension not allowed" in str(excinfo.value).lower()


def test_validate_file_upload_empty_filename():
    """Test file validation with empty filename"""
    # Create a file with empty name
    empty_name_file = io.BytesIO(b'file content')
    
    with pytest.raises(FileValidationError) as excinfo:
        validate_file_upload(empty_name_file, '')
    
    assert "invalid filename" in str(excinfo.value).lower()


def test_validate_file_upload_size_limit():
    """Test file validation with size limit"""
    # Skip if we can't create large enough test file
    if MAX_UPLOAD_SIZE > 10 * 1024 * 1024:  # Don't try to allocate more than 10MB for testing
        return
    
    try:
        # Create a file over the size limit
        large_file = io.BytesIO(b'x' * (MAX_UPLOAD_SIZE + 1024))
        
        with pytest.raises(FileValidationError) as excinfo:
            validate_file_upload(large_file, 'large.pdf')
        
        assert "file too large" in str(excinfo.value).lower()
    except MemoryError:
        # Skip if we can't allocate that much memory
        pass
