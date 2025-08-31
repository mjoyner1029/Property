#!/usr/bin/env python
from src import create_app
from src.extensions import db
from src.models.tenant_profile import TenantProfile
from src.models.document import Document
from src.models.message_thread import MessageThread

app = create_app()

with app.app_context():
    print("Testing model constructors...")
    # Test TenantProfile with phone_number
    profile = TenantProfile(user_id=1, phone_number="555-123-4567")
    print(f"TenantProfile phone_number: {profile.phone_number}, phone: {profile.phone}")
    
    # Test Document with name
    doc = Document(user_id=1, document_type="contract", title="Test", name="Document Name", file_path="/path")
    print(f"Document name: {doc.name}")
    
    # Test MessageThread with subject
    thread = MessageThread(user1_id=1, user2_id=2, subject="Test Subject")
    print(f"MessageThread subject: {thread.subject}")
    
    print("All model constructors working correctly!")
