# backend/setup.py
from setuptools import setup, find_packages

setup(
    name="assetanchor",
    version="1.0.0",
    description="Asset Anchor – Property management SaaS backend built with Flask",
    author="Asset Anchor Team",
    author_email="support@assetanchor.io",
    url="https://assetanchor.io",
    packages=find_packages(
        where=".", exclude=("tests", "tests.*", "migrations", "migrations.*")
    ),
    include_package_data=True,
    install_requires=[
        "Flask==3.1.2",
        "Werkzeug==3.1.3",
        "Flask-SQLAlchemy==3.1.1",
        "Flask-Migrate==4.1.0",
        "Flask-JWT-Extended==4.7.1",
        "Flask-Cors==6.0.1",
        "Flask-Mail==0.10.0",
        "Flask-SocketIO==5.5.1",
        "Flask-Talisman==1.1.0",
        "Flask-Limiter==3.12",
        "python-dotenv==1.1.1",
        "stripe==12.5.0",
        "sentry-sdk==2.35.2",
        "redis==6.4.0",
        "psycopg2-binary>=2.9.9",
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "pytest-cov>=4.1.0",
            "black>=24.0.0",
            "flake8>=7.0.0",
            "mypy>=1.10.0",
        ],
        "docs": ["sphinx>=7.2.0", "sphinx-rtd-theme>=1.3.0"],
    },
    entry_points={
        "console_scripts": [
            "assetanchor=src.app:main",
        ],
    },
    python_requires=">=3.10",
    classifiers=[
        "Programming Language :: Python :: 3",
        "Framework :: Flask",
        "Environment :: Web Environment",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    license="MIT",
)
