from setuptools import setup, find_packages

setup(
    name="assetanchor",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "Flask==2.3.3",
        "Werkzeug==2.3.8",
        "Flask-SQLAlchemy==3.1.1",
        "Flask-JWT-Extended==4.6.0",
        # other dependencies...
    ],
    python_requires=">=3.8",
)