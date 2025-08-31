"""
Test file for document service
"""
import os
import pytest
from unittest.mock import patch, MagicMock, mock_open
from werkzeug.datastructures import FileStorage

from src.services.document_service import DocumentService
from src.models.document import Document
from src.models.user import User
from src.extensions import db


class TestDocumentService:
    """Test suite for document service"""

    @pytest.fixture
    def test_user(self, app):
        """Create a test user"""
        with app.app_context():
            user = User(
                email="document_test@test.com",
                password="SecureP@ssw0rd123",
                first_name="Document",
                last_name="Tester",
                role="tenant",
                is_verified=True
            )
            db.session.add(user)
            db.session.commit()
            return user

    @pytest.fixture
    def mock_file(self):
        """Create a mock file for testing"""
        file_content = b"This is a test file content"
        file = FileStorage(
            stream=MagicMock(),
            filename="test_document.pdf",
            content_type="application/pdf",
        )
        file.read = MagicMock(return_value=file_content)
        file.seek = MagicMock()
        return file

    def test_allowed_file(self):
        """Test allowed file extensions"""
        # Allowed extensions
        assert DocumentService.allowed_file("test.pdf") is True
        assert DocumentService.allowed_file("document.doc") is True
        assert DocumentService.allowed_file("file.docx") is True
        assert DocumentService.allowed_file("image.jpg") is True
        assert DocumentService.allowed_file("picture.png") is True
        
        # Not allowed extensions
        assert DocumentService.allowed_file("script.js") is False
        assert DocumentService.allowed_file("code.py") is False
        assert DocumentService.allowed_file("noextension") is False
        assert DocumentService.allowed_file("") is False

    @patch('os.path.getsize')
    @patch('uuid.uuid4')
    @patch('os.makedirs')
    def test_save_file_success(self, mock_makedirs, mock_uuid, mock_getsize, mock_file):
        """Test successful file saving"""
        # Set up mocks
        mock_uuid.return_value = "test-uuid-12345"
        mock_getsize.return_value = 1024  # 1KB
        
        # Test the function
        with patch('builtins.open', mock_open()) as mock_file_open:
            with patch.object(FileStorage, 'save') as mock_save:
                result, error = DocumentService.save_file(mock_file, "/tmp/uploads")
                
                # Verify directory was created
                mock_makedirs.assert_called_once_with("/tmp/uploads", exist_ok=True)
                
                # Verify file was saved
                mock_save.assert_called_once()
                
                # Verify result is correct
                assert error is None
                assert result is not None
                assert result['original_filename'] == "test_document.pdf"
                assert result['filename'] == "test-uuid-12345.pdf"
                assert result['size'] == 1024
                assert result['extension'] == "pdf"

    def test_save_file_invalid(self):
        """Test saving an invalid file"""
        # Test with None file
        result, error = DocumentService.save_file(None, "/tmp/uploads")
        assert result is None
        assert "Invalid file" in error
        
        # Test with invalid extension
        invalid_file = MagicMock()
        invalid_file.filename = "test.exe"
        result, error = DocumentService.save_file(invalid_file, "/tmp/uploads")
        assert result is None
        assert "file type not allowed" in error

    @patch.object(DocumentService, 'save_file')
    def test_upload_document(self, mock_save_file, test_user, mock_file, app):
        """Test document upload"""
        # Set up mocks
        mock_save_file.return_value = (
            {
                'original_filename': 'test_document.pdf',
                'filename': 'test-uuid-12345.pdf',
                'path': '/tmp/uploads/test-uuid-12345.pdf',
                'size': 1024,
                'extension': 'pdf'
            }, 
            None
        )
        
        # Test data
        data = {
            'title': 'Test Document',
            'description': 'This is a test document',
            'document_type': 'lease',
            'property_id': 1
        }
        
        # Test document upload
        with app.app_context():
            document, error = DocumentService.upload_document(test_user.id, mock_file, data)
            
            # Verify document was created
            assert error is None
            assert document is not None
            assert document.title == 'Test Document'
            assert document.document_type == 'lease'
            assert document.user_id == test_user.id
            
            # Verify document exists in database
            db_document = Document.query.filter_by(title='Test Document').first()
            assert db_document is not None
            assert db_document.id == document.id

    @patch.object(DocumentService, 'save_file')
    def test_upload_document_failure(self, mock_save_file, test_user, mock_file, app):
        """Test document upload failure"""
        # Set up mocks for failure
        mock_save_file.return_value = (None, "File save error")
        
        # Test data
        data = {
            'title': 'Test Document',
            'description': 'This is a test document',
            'document_type': 'lease',
            'property_id': 1
        }
        
        # Test document upload failure
        with app.app_context():
            document, error = DocumentService.upload_document(test_user.id, mock_file, data)
            
            # Verify error was returned
            assert document is None
            assert "File save error" in error

    def test_get_user_documents(self, test_user, app):
        """Test retrieving user documents"""
        with app.app_context():
            # Create test documents
            doc1 = Document(
                user_id=test_user.id,
                title="Test Document 1",
                name="test1.pdf",
                file_path="/path/to/test1.pdf",
                document_type="lease"
            )
            doc2 = Document(
                user_id=test_user.id,
                title="Test Document 2",
                name="test2.pdf",
                file_path="/path/to/test2.pdf",
                document_type="invoice"
            )
            db.session.add(doc1)
            db.session.add(doc2)
            db.session.commit()
            
            # Test getting all documents
            documents = DocumentService.get_user_documents(test_user.id)
            assert len(documents) == 2
            
            # Test getting documents by type
            lease_docs = DocumentService.get_user_documents(test_user.id, document_type="lease")
            assert len(lease_docs) == 1
            assert lease_docs[0].title == "Test Document 1"

    def test_delete_document(self, test_user, app):
        """Test document deletion"""
        with app.app_context():
            # Create test document
            doc = Document(
                user_id=test_user.id,
                title="Document to Delete",
                name="delete_me.pdf",
                file_path="/path/to/delete_me.pdf",
                document_type="other"
            )
            db.session.add(doc)
            db.session.commit()
            doc_id = doc.id
            
            # Test deletion
            with patch('os.path.exists') as mock_exists:
                with patch('os.remove') as mock_remove:
                    mock_exists.return_value = True
                    
                    success = DocumentService.delete_document(doc_id, test_user.id)
                    assert success is True
                    
                    # Verify file was deleted
                    mock_remove.assert_called_once()
                    
                    # Verify document no longer exists in database
                    assert Document.query.get(doc_id) is None

    def test_delete_document_unauthorized(self, test_user, app):
        """Test document deletion by unauthorized user"""
        with app.app_context():
            # Create another user
            other_user = User(
                email="other@test.com",
                password="SecureP@ssw0rd123",
                first_name="Other",
                last_name="User",
                role="tenant",
                is_verified=True
            )
            db.session.add(other_user)
            db.session.commit()
            
            # Create test document owned by test_user
            doc = Document(
                user_id=test_user.id,
                title="Protected Document",
                name="protected.pdf",
                file_path="/path/to/protected.pdf",
                document_type="other"
            )
            db.session.add(doc)
            db.session.commit()
            doc_id = doc.id
            
            # Try to delete with wrong user
            success = DocumentService.delete_document(doc_id, other_user.id)
            assert success is False
            
            # Verify document still exists in database
            assert Document.query.get(doc_id) is not None
