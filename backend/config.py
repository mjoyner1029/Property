# backend/config.py

import os
from dotenv import load_dotenv

load_dotenv()  # Load .env into environment variables

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev_key')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev_jwt_key')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/asset_anchor')

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/asset_anchor_test')
    WTF_CSRF_ENABLED = False

class ProductionConfig(Config):
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
