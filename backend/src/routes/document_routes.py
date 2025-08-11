from flask import Blueprint
from ..controllers.document_controller import (
    upload_document, get_documents, get_document,
    update_document, delete_document
)

document_bp = Blueprint('documents', __name__)

document_bp.route('/', methods=['POST'])(upload_document)
document_bp.route('/', methods=['GET'])(get_documents)
document_bp.route('/<int:document_id>', methods=['GET'])(get_document)
document_bp.route('/<int:document_id>', methods=['PUT'])(update_document)
document_bp.route('/<int:document_id>', methods=['DELETE'])(delete_document)