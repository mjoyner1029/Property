# backend/migrate.py

from flask import Flask
from src import create_app
from src.extensions import db
from flask_migrate import Migrate

app = create_app()
migrate = Migrate(app, db)

if __name__ == "__main__":
    app.run()
