import pytest

@pytest.fixture
def clear_account_locks(app):
    """Clear all account locks before a test"""
    with app.app_context():
        from src.models.user import User
        from src.extensions import db
        from src.utils.account_security import failed_attempts
        
        # Clear DB locks
        users = User.query.all()
        for user in users:
            user.locked_until = None
            user.failed_login_attempts = 0
        db.session.commit()
        
        # Clear in-memory cache
        failed_attempts.clear()
    
    return True
