import logging
from logging.config import fileConfig

from alembic import context
from flask import current_app

# Alembic Config object (gives access to alembic.ini)
config = context.config

# Set up logging from config file
fileConfig(config.config_file_name)
logger = logging.getLogger("alembic.env")

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

def get_engine_url():
    try:
        return get_engine().url.render_as_string(hide_password=False).replace('%', '%%')
    except AttributeError:
        return str(get_engine().url).replace('%', '%%')

# Inject DB URL into Alembic config
config.set_main_option('sqlalchemy.url', get_engine_url())

# Get SQLAlchemy DB instance
target_db = current_app.extensions['migrate'].db

def get_metadata():
    if hasattr(target_db, 'metadatas'):
        return target_db.metadatas[None]
    return target_db.metadata

def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url, target_metadata=get_metadata(), literal_binds=True
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

    conf_args = current_app.extensions['migrate'].configure_args
    if conf_args.get("process_revision_directives") is None:
        conf_args["process_revision_directives"] = process_revision_directives

    connectable = get_engine()

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=get_metadata(),
            **conf_args
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
