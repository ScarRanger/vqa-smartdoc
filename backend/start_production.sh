#!/bin/bash

# Production startup script for VQA SmartDoc API
# This script can be used as an alternative entry point

set -e

echo "🚀 Starting VQA SmartDoc API in production mode..."

# Check if running in container
if [ -f /.dockerenv ]; then
    echo "📦 Running in Docker container"
else
    echo "🖥️  Running on host system"
fi

# Set default values for environment variables
export API_HOST=${API_HOST:-"0.0.0.0"}
export API_PORT=${API_PORT:-"8000"}
export LOG_LEVEL=${LOG_LEVEL:-"info"}
export WORKERS=${WORKERS:-"1"}

# Validate critical environment variables
echo "🔍 Validating environment configuration..."

if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ] || [ -z "$S3_BUCKET_NAME" ]; then
    echo "⚠️  AWS S3 credentials not fully configured"
    echo "   - AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID:+Set}"
    echo "   - AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY:+Set}"
    echo "   - S3_BUCKET_NAME: ${S3_BUCKET_NAME:-Not Set}"
fi

if [ -z "$HUGGINGFACE_API_TOKEN" ]; then
    echo "⚠️  HuggingFace API token not configured"
    echo "   - HUGGINGFACE_API_TOKEN: Not Set"
fi

# Display configuration
echo "📋 Configuration:"
echo "   - Host: $API_HOST"
echo "   - Port: $API_PORT"
echo "   - Workers: $WORKERS"
echo "   - Log Level: $LOG_LEVEL"
echo "   - Environment: ${ENVIRONMENT:-development}"

# Health check before starting
echo "🔍 Pre-flight checks..."
python -c "
import sys
import importlib

required_modules = ['fastapi', 'uvicorn', 'boto3', 'requests', 'pydantic']
missing_modules = []

for module in required_modules:
    try:
        importlib.import_module(module)
        print(f'✅ {module}: Available')
    except ImportError:
        missing_modules.append(module)
        print(f'❌ {module}: Missing')

if missing_modules:
    print(f'❌ Missing required modules: {missing_modules}')
    sys.exit(1)
else:
    print('✅ All required modules available')
"

echo "🚀 Starting FastAPI server..."

# Choose startup method based on environment
if [ "$ENVIRONMENT" = "production" ] && [ "$WORKERS" -gt 1 ]; then
    echo "📊 Starting with Gunicorn (multi-worker)..."
    exec gunicorn vqa_api:app \
        --bind $API_HOST:$API_PORT \
        --workers $WORKERS \
        --worker-class uvicorn.workers.UvicornWorker \
        --access-logfile - \
        --error-logfile - \
        --log-level $LOG_LEVEL \
        --preload \
        --max-requests 1000 \
        --max-requests-jitter 50 \
        --timeout 120
else
    echo "⚡ Starting with Uvicorn (single-worker)..."
    exec uvicorn vqa_api:app \
        --host $API_HOST \
        --port $API_PORT \
        --workers $WORKERS \
        --access-log \
        --log-level $LOG_LEVEL \
        --loop uvloop \
        --http httptools
fi
