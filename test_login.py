import requests
import json
import traceback

def login_test():
    try:
        print("Starting test_login.py...")
        url = "http://localhost:5050/api/auth/login"
        data = {
            "email": "admin@assetanchor.com", 
            "password": "admin123",
            "portal": "admin"
        }
        
        print(f"Sending login request to {url} with data: {data}")
        response = requests.post(url, json=data)
        print(f"Status code: {response.status_code}")
        print(f"Response content: {response.text}")
        
        if response.status_code == 200:
            print("Login successful!")
            response_json = response.json()
            print(f"Response JSON: {response_json}")
            token = response_json.get('access_token')
            if token:
                print(f"Token: {token[:30]}...")
                
                # Test a protected endpoint
                headers = {"Authorization": f"Bearer {token}"}
                print(f"Using headers: {headers}")
                test_url = "http://localhost:5050/api/maintenance/"
                print(f"Testing protected endpoint: {test_url}")
                test_response = requests.get(test_url, headers=headers)
                print(f"Protected endpoint status: {test_response.status_code}")
                print(f"Protected endpoint response: {test_response.text}")
                if test_response.status_code == 200:
                    print("Protected endpoint access successful")
                    print(f"Data length: {len(test_response.json())}")
                else:
                    print("Protected endpoint access failed")
                    print(f"Error: {test_response.text}")
            else:
                print("No access_token found in response!")
                print(f"Full response: {response_json}")
        else:
            print(f"Login failed: {response.text}")
    except Exception as e:
        print(f"Exception occurred: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    login_test()
