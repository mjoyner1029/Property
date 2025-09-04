import os
from src.app import create_app

if __name__ == "__main__":
  app = create_app()
  port = int(os.getenv("PORT", "5050"))
  host = os.getenv("HOST", "0.0.0.0")
  print(f"Serving on {host}:{port}")
  app.run(host=host, port=port, debug=True)