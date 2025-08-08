# Use Python 3.10 slim base image for stability and broad compatibility
FROM python:3.10-slim

# Set environment variables for Python optimization and security
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Set working directory
WORKDIR /app

# Install system dependencies required for python-magic and other packages
RUN apt-get update && apt-get install -y \
    gcc \
    libmagic1 \
    libmagic-dev \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy requirements first for better Docker layer caching
COPY requirements.txt .

# Install Python dependencies with optimizations
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories with proper permissions
RUN mkdir -p uploads logs && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose default platform port (Render typically uses 10000; informational only)
EXPOSE 8000

# Health check for container orchestration platforms
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Run the application with production settings and platform port
# Use shell form to expand env vars at runtime
CMD ["sh", "-c", "uvicorn vqa_api:app --host 0.0.0.0 --port ${PORT:-8000} --workers ${WORKERS:-1} --access-log --log-level ${LOG_LEVEL:-info}"]
