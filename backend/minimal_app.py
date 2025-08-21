from src.app import create_app

# Create a simple app with minimal configuration
app = create_app('development')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
