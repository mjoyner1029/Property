# backend/src/tests/test_file_validator.py
import io
import pytest

from ..utils.file_validator import (
    is_allowed_file_extension,
    is_allowed_file_size,
    validate_file_upload,
    FileValidationError,
    MAX_UPLOAD_SIZE,
)


def test_allowed_file_extension():
    """File extension validation accepts known types and rejects others."""
    # Valid extensions
    assert is_allowed_file_extension("test.jpg")
    assert is_allowed_file_extension("test.pdf")
    assert is_allowed_file_extension("test.docx")
    assert is_allowed_file_extension("test.csv")

    # Invalid extensions
    assert not is_allowed_file_extension("test.exe")
    assert not is_allowed_file_extension("test.js")
    assert not is_allowed_file_extension("test.php")
    assert not is_allowed_file_extension("test")  # No extension


def test_allowed_file_size():
    """Stream size validation should not consume the stream."""
    # Small file (1KB)
    small_file = io.BytesIO(b"x" * 1024)
    assert is_allowed_file_size(small_file)

    # Ensure function rewinds after checking size
    assert small_file.tell() == 0

    # Attempt to create an over-limit file
    try:
        large_file = io.BytesIO(b"x" * (MAX_UPLOAD_SIZE + 1))
    except MemoryError:
        pytest.skip("Not enough memory to allocate a >MAX_UPLOAD_SIZE buffer for this test")
    else:
        assert not is_allowed_file_size(large_file)
        assert large_file.tell() == 0  # should also rewind


def test_validate_file_upload_success(monkeypatch):
    """Happy path: valid filename and content returns (filename, sha256hex)."""
    # Set testing environment variable
    monkeypatch.setenv('TESTING', 'true')
    
    valid_file = io.BytesIO(b"valid file content")
    # Some frameworks attach .filename; our validator accepts (stream, provided_name)
    # Ensure stream is at position 0
    valid_file.seek(0)

    try:
        filename, file_hash = validate_file_upload(valid_file, "test.pdf")
    except FileValidationError as e:
        pytest.fail(f"validate_file_upload raised unexpectedly: {e}")

    assert filename == "test.pdf"
    assert isinstance(file_hash, str)
    assert len(file_hash) == 64  # SHA-256 is 64 hex chars
    assert isinstance(file_hash, str) and len(file_hash) == 64 and all(c in "0123456789abcdef" for c in file_hash)


def test_validate_file_upload_invalid_extension():
    """Invalid extensions should raise a clear error."""
    invalid_file = io.BytesIO(b"invalid file content")
    with pytest.raises(FileValidationError) as excinfo:
        validate_file_upload(invalid_file, "test.exe")
    assert "extension" in str(excinfo.value).lower()


def test_validate_file_upload_empty_filename():
    """Empty or missing filename should be rejected."""
    empty_name_file = io.BytesIO(b"file content")
    with pytest.raises(FileValidationError) as excinfo:
        validate_file_upload(empty_name_file, "")
    assert "filename" in str(excinfo.value).lower()


def test_validate_file_upload_size_limit():
    """Oversized uploads should be rejected with a clear message."""
    # Keep allocation sane in low-memory CI environments
    if MAX_UPLOAD_SIZE > 10 * 1024 * 1024:
        pytest.skip("MAX_UPLOAD_SIZE too large for reliable in-memory allocation in CI")

    try:
        large_file = io.BytesIO(b"x" * (MAX_UPLOAD_SIZE + 1024))
    except MemoryError:
        pytest.skip("Not enough memory to allocate a >MAX_UPLOAD_SIZE buffer for this test")

    with pytest.raises(FileValidationError) as excinfo:
        validate_file_upload(large_file, "large.pdf")
    assert any(term in str(excinfo.value).lower() for term in ("file too large", "size"))

