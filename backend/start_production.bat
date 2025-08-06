@echo off
REM Production startup script for VQA SmartDoc API (Windows)

echo 🚀 Starting VQA SmartDoc API in production mode...

REM Set default values for environment variables
if not defined API_HOST set API_HOST=0.0.0.0
if not defined API_PORT set API_PORT=8000
if not defined LOG_LEVEL set LOG_LEVEL=info
if not defined WORKERS set WORKERS=1

REM Display configuration
echo 📋 Configuration:
echo    - Host: %API_HOST%
echo    - Port: %API_PORT%
echo    - Workers: %WORKERS%
echo    - Log Level: %LOG_LEVEL%
echo    - Environment: %ENVIRONMENT%

REM Validate environment variables
echo 🔍 Validating environment configuration...

if "%AWS_ACCESS_KEY_ID%"=="" (
    echo ⚠️  AWS_ACCESS_KEY_ID not set
) else (
    echo ✅ AWS_ACCESS_KEY_ID: Set
)

if "%AWS_SECRET_ACCESS_KEY%"=="" (
    echo ⚠️  AWS_SECRET_ACCESS_KEY not set
) else (
    echo ✅ AWS_SECRET_ACCESS_KEY: Set
)

if "%S3_BUCKET_NAME%"=="" (
    echo ⚠️  S3_BUCKET_NAME not set
) else (
    echo ✅ S3_BUCKET_NAME: %S3_BUCKET_NAME%
)

if "%HUGGINGFACE_API_TOKEN%"=="" (
    echo ⚠️  HUGGINGFACE_API_TOKEN not set
) else (
    echo ✅ HUGGINGFACE_API_TOKEN: Set
)

REM Start the server
echo 🚀 Starting FastAPI server...

if "%ENVIRONMENT%"=="production" (
    echo 📊 Starting with Gunicorn for production...
    gunicorn vqa_api:app --bind %API_HOST%:%API_PORT% --workers %WORKERS% --worker-class uvicorn.workers.UvicornWorker --access-logfile - --error-logfile - --log-level %LOG_LEVEL%
) else (
    echo ⚡ Starting with Uvicorn for development...
    uvicorn vqa_api:app --host %API_HOST% --port %API_PORT% --workers %WORKERS% --access-log --log-level %LOG_LEVEL%
)

if errorlevel 1 (
    echo ❌ Server failed to start
    pause
) else (
    echo ✅ Server started successfully
)
