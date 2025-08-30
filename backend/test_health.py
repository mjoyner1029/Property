try:
    import sys
    import os
    sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
    
    from src.app import create_app
    import json

    app = create_app('testing')

    with app.test_client() as client:
        # Test /api/health endpoint
        response = client.get('/api/health')
        print(f"/api/health status: {response.status_code}")
        print(f"/api/health response: {response.data.decode()}")
        
        # Test /healthz endpoint
        response = client.get('/healthz')
        print(f"/healthz status: {response.status_code}")
        print(f"/healthz response: {response.data.decode()}")
        
        # Test /readyz endpoint
        response = client.get('/readyz')
        print(f"/readyz status: {response.status_code}")
        print(f"/readyz response: {response.data.decode()}")
except Exception as e:
    print(f"Error: {str(e)}")
    import traceback
    traceback.print_exc()
