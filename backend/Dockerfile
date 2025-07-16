FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libc6-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better layer caching
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./src ./src
COPY ./migrations ./migrations
COPY ./app.py ./app.py
COPY ./wsgi.py ./wsgi.py

# Set environment variables
ENV FLASK_APP=src.app
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Create uploads directory
RUN mkdir -p uploads && chmod 777 uploads

EXPOSE 5050

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5050/api/status || exit 1

# Use gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:5050", "--worker-class", "eventlet", "--workers", "4", "--timeout", "120", "wsgi:app"]
