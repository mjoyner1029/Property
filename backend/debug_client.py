from src.app import create_app
import pytest

app = create_app()

@pytest.fixture
def test_client():
    with app.test_client() as client:
        # Print out all routes
        print("Available routes:")
        for rule in app.url_map.iter_rules():
            print(f"{rule} - {rule.endpoint}")
        
        yield client

# Run a simple test
def test_debug():
    with app.test_client() as client:
        resp = client.get("/api/properties")
        print(f"Response status: {resp.status_code}")
        if resp.status_code != 404:
            print(f"Response data: {resp.get_data(as_text=True)}")

if __name__ == "__main__":
    test_debug()
