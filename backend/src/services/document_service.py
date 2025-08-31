from ..models.document import Document
from ..models.user import User
from ..models.property import Property
from ..extensions import db
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app

class DocumentService:
    ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'}
    
    @staticmethod
    def allowed_file(filename):
        """Check if file extension is allowed"""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in DocumentService.ALLOWED_EXTENSIONS
    
    @staticmethod
    def save_file(file, directory):
        """Save file to filesystem"""
        if not file or not DocumentService.allowed_file(file.filename):
            return None, "Invalid file or file type not allowed"
        
        # Create unique filename
        original_filename = secure_filename(file.filename)
        ext = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else ''
        unique_filename = f"{str(uuid.uuid4())}.{ext}"
        
        # Ensure directory exists
        os.makedirs(directory, exist_ok=True)
        
        # Save file
        file_path = os.path.join(directory, unique_filename)
        file.save(file_path)
        
        return {
            'original_filename': original_filename,
            'filename': unique_filename,
            'path': file_path,
            'size': os.path.getsize(file_path),
            'extension': ext
        }, None
    
    @staticmethod
    def upload_document(user_id, file, data):
        """Upload a new document"""
        try:
            # Verify user exists
            user = db.session.get(User, user_id)
            if not user:
                return None, "User not found"
            
            # Save file to appropriate directory
            upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], f"user_{user_id}")
            file_data, error = DocumentService.save_file(file, upload_dir)
            
            if error:
                return None, error
            
            # Create document record
            document = Document(
                user_id=user_id,
                title=data.get('title', file_data['original_filename']),
                name=data.get('name', file_data['original_filename']),
                description=data.get('description'),
                file_path=file_data['path'],
                file_name=file_data['filename'],
                original_name=file_data['original_filename'],
                file_size=file_data['size'],
                file_type=file_data['extension'],
                document_type=data.get('document_type', 'other'),
                property_id=data.get('property_id'),
                created_at=datetime.utcnow()
            )
            
            db.session.add(document)
            db.session.commit()
            
            return document, None
        
        except SQLAlchemyError as e:
            db.session.rollback()
            return None, str(e)
        except Exception as e:
            return None, str(e)
    
    @staticmethod
    def get_user_documents(user_id, filters=None, page=1, per_page=10):
        """Get documents for a user"""
        try:
            query = Document.query.filter_by(user_id=user_id)
            
            # Apply filters if provided
            if filters:
                if 'document_type' in filters:
                    query = query.filter_by(document_type=filters['document_type'])
                if 'property_id' in filters:
                    query = query.filter_by(property_id=filters['property_id'])
                if 'search' in filters and filters['search']:
                    search = f"%{filters['search']}%"
                    query = query.filter(
                        (Document.name.ilike(search)) | 
                        (Document.description.ilike(search))
                    )
            
            # Order by most recent first
            query = query.order_by(Document.created_at.desc())
            
            # Paginate results
            paginated_docs = query.paginate(page=page, per_page=per_page)
            
            return paginated_docs.items, paginated_docs.total, None
        
        except SQLAlchemyError as e:
            return [], 0, str(e)
    
    @staticmethod
    def delete_document(document_id, user_id):
        """Delete a document"""
        try:
            document = db.session.get(Document, document_id)
            
            if not document:
                return False, "Document not found"
            
            # Verify ownership
            if document.user_id != user_id:
                return False, "Not authorized to delete this document"
            
            # Delete file from filesystem
            if os.path.exists(document.file_path):
                os.remove(document.file_path)
            
            # Delete database record
            db.session.delete(document)
            db.session.commit()
            
            return True, None
        
        except SQLAlchemyError as e:
            db.session.rollback()
            return False, str(e)
        except Exception as e:
            return False, str(e)