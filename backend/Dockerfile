FROM python:3.11-slim

WORKDIR /app

# Create a non-root user to run the application
RUN addgroup --system app && adduser --system --group app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libc6-dev \
    curl \
    wget \
    netcat \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better layer caching
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Create necessary directories
RUN mkdir -p /app/uploads /app/logs && \
    chown -R app:app /app

# Copy application code
COPY ./src ./src
COPY ./migrations ./migrations
COPY ./config.py ./config.py
COPY ./run.py ./run.py
COPY ./wsgi.py ./wsgi.py
COPY ./setup.py ./setup.py
COPY ./run_tests.sh ./run_tests.sh
COPY ./pytest.ini ./pytest.ini
COPY ./migrate.py ./migrate.py

# Create wait-for-db script
RUN echo '#!/bin/bash\n\
echo "Waiting for database to be ready..."\n\
while ! nc -z db 5432; do\n\
  sleep 0.5\n\
done\n\
echo "Database is ready!"\n\
exec "$@"' > /app/wait-for-db.sh && \
chmod +x /app/wait-for-db.sh

# Set environment variables
ENV FLASK_APP=src.app
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV FLASK_ENV=production

# Expose port
EXPOSE 5050

# Set ownership of files
RUN chown -R app:app /app

# Switch to non-root user
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget -q -O- http://localhost:5050/api/status || exit 1

# Use gunicorn for production with proper settings
CMD ["./wait-for-db.sh", "gunicorn", "--bind", "0.0.0.0:5050", "--worker-class", "eventlet", "--workers", "4", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-", "--capture-output", "--log-level", "info", "wsgi:app"]
