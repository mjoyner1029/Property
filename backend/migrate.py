from src import create_app
from src.extensions import db, migrate
from flask_migrate import upgrade
from flask.cli import FlaskGroup

app = create_app()
cli = FlaskGroup(app)

if __name__ == "__main__":
    cli()
