#!/bin/bash
export FLASK_APP=src.app:create_app
export FLASK_ENV=development
export FLASK_RUN_HOST=0.0.0.0
export FLASK_RUN_PORT=5050
flask run
