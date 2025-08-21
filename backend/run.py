import os

def create_app():
  # import your factory here; adjust path if different
  from src.app import create_app as factory
  return factory()

if __name__ == "__main__":
  app = create_app()
  port = int(os.getenv("PORT", "5050"))
  app.run(host="0.0.0.0", port=port)