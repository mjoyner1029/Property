import pytest
import json

def test_log_frontend_error(client):
    """Test logging client-side errors"""
    response = client.post('/api/logs/frontend-error',
                          json={
                              'message': 'Test error message',
                              'stack': 'Error stack trace...',
                              'url': 'https://example.com/page',
                              'user_agent': 'Test Browser'
                          })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data


def test_get_admin_logs(client, auth_headers):
    """Test admin getting system logs"""
    response = client.get('/api/admin/logs',
                         headers=auth_headers['admin'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'logs' in data


def test_get_audit_log(client, auth_headers, test_users, session):
    """Test getting audit log entries"""
    response = client.get('/api/admin/audit-log',
                         headers=auth_headers['admin'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'entries' in data