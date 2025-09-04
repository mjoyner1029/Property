import logging
import os
from logging.config import fileConfig

from alembic import context
from flask import current_app
from src.extensions import db


# Alembic Config object (gives access to alembic.ini)
config = context.config

# Set up logging from config file
fileConfig(config.config_file_name)
logger = logging.getLogger("alembic.env")

# Check for direct DATABASE_URL override from environment
# This allows running migrations without loading the full Flask app
database_url_override = os.environ.get("DATABASE_URL")
if database_url_override:
    logger.info("Using DATABASE_URL from environment: %s", database_url_override.split("@")[0] + "@***")
    config.set_main_option("sqlalchemy.url", database_url_override)

# Import the app to get access to its configuration
from src import app as flask_app
app = flask_app.create_app()

# Import models to detect schema
from src.models import *
from src.models.user import User
from src.models.property import Property
from src.models.notification import Notification
from src.models.message import Message
from src.models.tenant_profile import TenantProfile
from src.models.maintenance_request import MaintenanceRequest
from src.models.payment import Payment

def get_engine():
    try:
        # Flask-SQLAlchemy < 3
        return current_app.extensions['migrate'].db.get_engine()
    except (TypeError, AttributeError):
        # Flask-SQLAlchemy >= 3
        return current_app.extensions['migrate'].db.engine

# Use database URI from Flask app's config
db_url = app.config["SQLALCHEMY_DATABASE_URI"]
logger.info(f"Using database URL from app config: {db_url.split('@')[0] + '@***' if '@' in db_url else db_url}")

# Inject DB URL into Alembic config
config.set_main_option('sqlalchemy.url', db_url.replace('%', '%%'))

# Get SQLAlchemy DB instance
target_db = current_app.extensions['migrate'].db

def get_metadata():
    if hasattr(target_db, 'metadatas'):
        return target_db.metadatas[None]
    return target_db.metadata

def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url, 
        target_metadata=get_metadata(), 
        literal_binds=True,
        render_as_batch=True,
        compare_type=True,
        compare_server_default=True
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    def process_revision_directives(context, revision, directives):
        if getattr(config.cmd_opts, 'autogenerate', False):
            script = directives[0]
            if script.upgrade_ops.is_empty():
                directives[:] = []
                logger.info('No changes in schema detected.')

    # Get configuration args from Flask-Migrate
    conf_args = current_app.extensions['migrate'].configure_args
    
    # Only add process_revision_directives if it's not already present
    if conf_args.get("process_revision_directives") is None:
        conf_args["process_revision_directives"] = process_revision_directives
    
    # Remove any conflicting configuration options that we want to set explicitly
    for key in ["render_as_batch", "compare_type", "compare_server_default"]:
        if key in conf_args:
            del conf_args[key]

    connectable = get_engine()

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=get_metadata(),
            render_as_batch=True,
            compare_type=True,
            compare_server_default=True,
            **conf_args
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
