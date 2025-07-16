import logging
import os
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename
from sqlalchemy.exc import SQLAlchemyError
from src.extensions import db
from src.models.document import Document
from flask import current_app, send_from_directory

logger = logging.getLogger(__name__)

# Define allowed file extensions
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'}

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def upload_document(file, data):
    """
    Upload a new document to the system.
    
    Args:
        file: The file object from request.files
        data: Dict containing document metadata (property_id, tenant_id, doc_type, etc.)
    
    Returns:
        Tuple of (response_dict, status_code)
    """
    # Validate required fields
    if not file:
        return {"error": "No file provided"}, 400
    
    if not allowed_file(file.filename):
        return {"error": f"File type not allowed. Must be one of {', '.join(ALLOWED_EXTENSIONS)}"}, 400
    
    required_fields = ["title", "doc_type"]
    for field in required_fields:
        if field not in data:
            return {"error": f"Missing required field: {field}"}, 400
    
    try:
        # Create unique filename to prevent collisions
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        
        # Create upload directory if it doesn't exist
        uploads_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'documents')
        os.makedirs(uploads_dir, exist_ok=True)
        
        # Save file to filesystem
        file_path = os.path.join(uploads_dir, unique_filename)
        file.save(file_path)
        
        # Create database record
        document = Document(
            title=data["title"],
            filename=unique_filename,
            original_filename=filename,
            file_path=file_path,
            file_size=os.path.getsize(file_path),
            doc_type=data["doc_type"],
            property_id=data.get("property_id"),
            tenant_id=data.get("tenant_id"),
            uploaded_by=data.get("user_id"),
            description=data.get("description", "")
        )
        
        db.session.add(document)
        db.session.commit()
        
        logger.info(f"Document uploaded: {unique_filename} (ID: {document.id})")
        return {
            "message": "Document uploaded successfully",
            "id": document.id,
            "title": document.title,
            "filename": document.original_filename
        }, 201
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Database error when uploading document: {str(e)}")
        return {"error": "Failed to upload document"}, 500
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        return {"error": "Failed to upload document"}, 500

def get_document(document_id):
    """
    Get document metadata by ID.
    
    Args:
        document_id: ID of the document to retrieve
    
    Returns:
        Tuple of (response_dict, status_code)
    """
    try:
        document = Document.query.get(document_id)
        
        if not document:
            return {"error": "Document not found"}, 404
            
        return {
            "id": document.id,
            "title": document.title,
            "filename": document.original_filename,
            "file_size": document.file_size,
            "doc_type": document.doc_type,
            "property_id": document.property_id,
            "tenant_id": document.tenant_id,
            "uploaded_by": document.uploaded_by,
            "upload_date": document.upload_date.isoformat(),
            "description": document.description
        }, 200
    except SQLAlchemyError as e:
        logger.error(f"Database error when getting document {document_id}: {str(e)}")
        return {"error": "Failed to retrieve document"}, 500

def download_document(document_id):
    """
    Download a document by ID.
    
    Args:
        document_id: ID of the document to download
    
    Returns:
        Flask send_from_directory response or error
    """
    try:
        document = Document.query.get(document_id)
        
        if not document:
            return {"error": "Document not found"}, 404
            
        # Log access
        logger.info(f"Document {document_id} downloaded")
        
        # Return file for download
        directory = os.path.dirname(document.file_path)
        filename = os.path.basename(document.file_path)
        
        return send_from_directory(
            directory, 
            filename,
            as_attachment=True,
            download_name=document.original_filename
        )
    except SQLAlchemyError as e:
        logger.error(f"Database error when downloading document {document_id}: {str(e)}")
        return {"error": "Failed to retrieve document"}, 500
    except FileNotFoundError:
        logger.error(f"File not found for document {document_id}")
        return {"error": "Document file not found"}, 404

def list_documents(filters=None):
    """
    List all documents with optional filtering.
    
    Args:
        filters: Dict with optional filters (property_id, tenant_id, doc_type)
    
    Returns:
        Tuple of (response_dict, status_code)
    """
    try:
        query = Document.query
        
        # Apply filters if provided
        if filters:
            if 'property_id' in filters:
                query = query.filter_by(property_id=filters['property_id'])
            if 'tenant_id' in filters:
                query = query.filter_by(tenant_id=filters['tenant_id'])
            if 'doc_type' in filters:
                query = query.filter_by(doc_type=filters['doc_type'])
            if 'uploaded_by' in filters:
                query = query.filter_by(uploaded_by=filters['uploaded_by'])
                
        documents = query.all()
        
        return [{
            "id": doc.id,
            "title": doc.title,
            "filename": doc.original_filename,
            "doc_type": doc.doc_type,
            "property_id": doc.property_id,
            "tenant_id": doc.tenant_id,
            "upload_date": doc.upload_date.isoformat(),
            "file_size": doc.file_size
        } for doc in documents], 200
    except SQLAlchemyError as e:
        logger.error(f"Database error when listing documents: {str(e)}")
        return {"error": "Failed to retrieve documents"}, 500

def update_document(document_id, data):
    """
    Update document metadata.
    
    Args:
        document_id: ID of the document to update
        data: Dict containing fields to update
    
    Returns:
        Tuple of (response_dict, status_code)
    """
    try:
        document = Document.query.get(document_id)
        
        if not document:
            return {"error": "Document not found"}, 404
            
        # Update allowed fields
        if "title" in data:
            document.title = data["title"]
        if "description" in data:
            document.description = data["description"]
        if "doc_type" in data:
            document.doc_type = data["doc_type"]
            
        db.session.commit()
        logger.info(f"Document {document_id} updated")
        
        return {"message": "Document updated successfully"}, 200
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Database error when updating document {document_id}: {str(e)}")
        return {"error": "Failed to update document"}, 500

def delete_document(document_id):
    """
    Delete a document and its file.
    
    Args:
        document_id: ID of the document to delete
    
    Returns:
        Tuple of (response_dict, status_code)
    """
    try:
        document = Document.query.get(document_id)
        
        if not document:
            return {"error": "Document not found"}, 404
            
        # Delete the file
        try:
            os.remove(document.file_path)
        except OSError as e:
            logger.warning(f"Could not delete document file {document.file_path}: {str(e)}")
            
        # Delete database record
        db.session.delete(document)
        db.session.commit()
        logger.info(f"Document {document_id} deleted")
        
        return {"message": "Document deleted successfully"}, 200
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Database error when deleting document {document_id}: {str(e)}")
        return {"error": "Failed to delete document"}, 500

def share_document(document_id, share_data):
    """
    Share a document with specified users.
    
    Args:
        document_id: ID of the document to share
        share_data: Dict containing user_ids to share with and permissions
    
    Returns:
        Tuple of (response_dict, status_code)
    """
    try:
        document = Document.query.get(document_id)
        
        if not document:
            return {"error": "Document not found"}, 404
            
        if "user_ids" not in share_data or not share_data["user_ids"]:
            return {"error": "No users specified for sharing"}, 400
            
        # In a real implementation, you would:
        # 1. Create document_share records in the database
        # 2. Send notifications to users
        # 3. Return success or error
        
        # This is a simplified placeholder implementation
        logger.info(f"Document {document_id} shared with users: {share_data['user_ids']}")
        
        return {
            "message": "Document shared successfully",
            "shared_with": share_data["user_ids"]
        }, 200
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Database error when sharing document {document_id}: {str(e)}")
        return {"error": "Failed to share document"}, 500