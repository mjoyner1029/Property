import pytest
import json
import os
from io import BytesIO
from datetime import datetime 
from werkzeug.datastructures import FileStorage

from ..models.document import Document
from ..extensions import db


@pytest.fixture
def sample_pdf():
    """Create a sample PDF file for testing"""
    # This creates a minimal valid PDF file
    pdf_content = b"%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%EOF"
    return FileStorage(
        stream=BytesIO(pdf_content),
        filename="test.pdf",
        content_type="application/pdf",
    )


def test_upload_document(client, test_users, auth_headers, sample_pdf, monkeypatch):
    """Test uploading a document"""
    # Mock file saving to avoid actual file operations
    def mock_save(self, path):
        return True
        
    monkeypatch.setattr(FileStorage, 'save', mock_save)
    
    # Set up test upload folder
    test_upload_folder = "/tmp/test_uploads"
    os.makedirs(test_upload_folder, exist_ok=True)
    
    # Patch the config
    with client.application.app_context():
        client.application.config['UPLOAD_FOLDER'] = test_upload_folder
    
    response = client.post('/api/documents',
                          headers=auth_headers['landlord'],
                          data={
                              'file': sample_pdf,
                              'name': 'Test Document',
                              'description': 'This is a test document',
                              'document_type': 'lease'
                          },
                          content_type='multipart/form-data')
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['document']['name'] == 'Test Document'
    assert data['document']['document_type'] == 'lease'


def test_get_user_documents(client, test_users, auth_headers, session):
    """Test getting documents for a user"""
    # Create a test document in the database
    document = Document(
        user_id=test_users['landlord'].id,
        title='Test Document',  # Added title field
        name='Test Document',
        description='Description for test document',
        file_path='/fake/path/document.pdf',
        file_name='document.pdf',
        original_name='original_document.pdf',
        file_size=1024,
        file_type='pdf',
        document_type='contract',
        created_at=datetime.utcnow()
    )
    session.add(document)
    session.commit()
    
    response = client.get('/api/documents',
                         headers=auth_headers['landlord'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'documents' in data
    assert len(data['documents']) >= 1
    assert data['documents'][0]['name'] == 'Test Document'


def test_delete_document(client, test_users, auth_headers, session, monkeypatch):
    """Test deleting a document"""
    # Mock file removal to avoid actual file operations
    def mock_remove(path):
        return True
        
    monkeypatch.setattr("os.remove", mock_remove)
    
    # Create a test document in the database
    document = Document(
        user_id=test_users['landlord'].id,
        title='Document to Delete',  # Added title field
        name='Document to Delete',
        description='This document will be deleted',
        file_path='/fake/path/to_delete.pdf',
        file_name='to_delete.pdf',
        original_name='original_to_delete.pdf',
        file_size=2048,
        file_type='pdf',
        document_type='other',
        created_at=datetime.utcnow()
    )
    session.add(document)
    session.commit()
    
    response = client.delete(f'/api/documents/{document.id}',
                            headers=auth_headers['landlord'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'success' in data['message'].lower()
    
    # Verify document was deleted from database
    deleted_doc = db.session.get(Document, document.id)
    assert deleted_doc is None