"""
VQA SmartDoc FastAPI Backend
Complete implementation with S3 upload and HuggingFace VQA endpoints
"""

import os
import uuid
import logging
from typing import Optional
import boto3
import requests
from botocore.exceptions import ClientError, NoCredentialsError
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="VQA SmartDoc API",
    description="Visual Question Answering API with S3 file upload and HuggingFace BLIP VQA",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration - Allow requests from localhost and Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000", 
        "http://localhost:3001",
        "https://*.vercel.app",
        "https://vercel.app",
        "https://*.netlify.app",
        "*"  # For development - restrict in production
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Configuration from environment variables
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")
HUGGINGFACE_MODEL_URL = "https://api-inference.huggingface.co/models/Salesforce/blip-vqa-base"

# File upload configuration
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".pdf", ".webp"}

# Initialize S3 client
def get_s3_client():
    """Initialize S3 client with error handling"""
    if not all([AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME]):
        raise HTTPException(
            status_code=500,
            detail="AWS S3 not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and S3_BUCKET_NAME environment variables."
        )
    
    try:
        return boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize S3 client: {str(e)}")

# Pydantic Models
class UploadResponse(BaseModel):
    success: bool
    message: str
    file_url: str
    file_name: str
    file_size: int
    upload_id: str

class VQARequest(BaseModel):
    file_url: HttpUrl
    question: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "file_url": "https://bucket.s3.amazonaws.com/uploads/image.jpg",
                "question": "What is shown in this image?"
            }
        }

class VQAResponse(BaseModel):
    success: bool
    answer: str
    confidence: float
    file_url: str
    question: str
    processing_time: Optional[float] = None

class ErrorResponse(BaseModel):
    success: bool
    error: str
    details: Optional[str] = None

# Utility Functions
def validate_file(file: UploadFile) -> tuple[bool, str]:
    """Validate uploaded file"""
    if not file.filename:
        return False, "No filename provided"
    
    # Check file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        return False, f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
    
    return True, "Valid file"

def generate_s3_key(filename: str) -> str:
    """Generate unique S3 key for file"""
    file_ext = os.path.splitext(filename)[1].lower()
    unique_id = str(uuid.uuid4())
    return f"uploads/{unique_id}{file_ext}"

def upload_to_s3(file_content: bytes, s3_key: str, content_type: str) -> str:
    """Upload file to S3 and return public URL"""
    s3_client = get_s3_client()
    
    try:
        # Upload file to S3
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=s3_key,
            Body=file_content,
            ContentType=content_type,
            ACL='public-read'  # Make file publicly accessible
        )
        
        # Generate public URL
        public_url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
        return public_url
        
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', 'Unknown')
        if error_code == 'NoSuchBucket':
            raise HTTPException(status_code=500, detail=f"S3 bucket '{S3_BUCKET_NAME}' does not exist")
        elif error_code == 'AccessDenied':
            raise HTTPException(status_code=500, detail="Access denied. Check AWS credentials and bucket permissions")
        else:
            raise HTTPException(status_code=500, detail=f"S3 upload failed: {str(e)}")
    except NoCredentialsError:
        raise HTTPException(status_code=500, detail="AWS credentials not found")

def query_huggingface_vqa(image_url: str, question: str) -> dict:
    """Query HuggingFace Inference API for VQA"""
    if not HUGGINGFACE_API_TOKEN:
        raise HTTPException(
            status_code=500,
            detail="HuggingFace API token not configured. Set HUGGINGFACE_API_TOKEN environment variable."
        )
    
    headers = {
        "Authorization": f"Bearer {HUGGINGFACE_API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "inputs": {
            "image": image_url,
            "question": question
        }
    }
    
    try:
        logger.info(f"Sending VQA request: {question[:50]}...")
        response = requests.post(HUGGINGFACE_MODEL_URL, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 503:
            raise HTTPException(
                status_code=503,
                detail="Model is loading, please try again in a few moments"
            )
        elif response.status_code == 401:
            raise HTTPException(
                status_code=401,
                detail="Invalid HuggingFace API token"
            )
        else:
            error_msg = f"HuggingFace API error: {response.status_code}"
            try:
                error_detail = response.json().get('error', response.text)
                error_msg += f" - {error_detail}"
            except:
                error_msg += f" - {response.text}"
            raise HTTPException(status_code=response.status_code, detail=error_msg)
            
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Request timeout to HuggingFace API")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Request failed: {str(e)}")

def parse_vqa_response(response: dict) -> tuple[str, float]:
    """Parse VQA response to extract answer and confidence"""
    try:
        if isinstance(response, list) and len(response) > 0:
            answer_data = response[0]
            answer = answer_data.get('answer', 'No answer provided')
            confidence = answer_data.get('score', 0.0)
        elif isinstance(response, dict):
            answer = response.get('answer', str(response))
            confidence = response.get('score', 0.5)
        else:
            answer = str(response) if response else 'No answer provided'
            confidence = 0.5
        
        return answer, confidence
    except Exception as e:
        logger.error(f"Failed to parse VQA response: {e}")
        return "Error parsing response", 0.0

# API Endpoints
@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "VQA SmartDoc API is running",
        "version": "1.0.0",
        "endpoints": ["/upload/", "/ask/", "/health"],
        "configuration": {
            "s3_configured": bool(AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and S3_BUCKET_NAME),
            "huggingface_configured": bool(HUGGINGFACE_API_TOKEN),
            "max_file_size_mb": MAX_FILE_SIZE / (1024 * 1024),
            "allowed_extensions": list(ALLOWED_EXTENSIONS)
        }
    }

@app.post("/upload/", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a file to AWS S3 and return the public URL
    
    - **file**: The file to upload (Images: JPG, PNG, GIF, WEBP; Documents: PDF)
    - **Returns**: Upload response with file URL, name, size, and upload ID
    """
    try:
        # Validate file
        is_valid, validation_message = validate_file(file)
        if not is_valid:
            raise HTTPException(status_code=400, detail=validation_message)
        
        # Read file content
        file_content = await file.read()
        
        # Check file size
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large ({len(file_content) / (1024*1024):.1f}MB). Maximum size: {MAX_FILE_SIZE / (1024*1024):.1f}MB"
            )
        
        if not file_content:
            raise HTTPException(status_code=400, detail="Empty file provided")
        
        # Generate S3 key and upload
        s3_key = generate_s3_key(file.filename)
        upload_id = str(uuid.uuid4())
        
        public_url = upload_to_s3(
            file_content, 
            s3_key, 
            file.content_type or 'application/octet-stream'
        )
        
        logger.info(f"File uploaded successfully: {file.filename} -> {public_url}")
        
        return UploadResponse(
            success=True,
            message="File uploaded successfully",
            file_url=public_url,
            file_name=file.filename,
            file_size=len(file_content),
            upload_id=upload_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post("/ask/", response_model=VQAResponse)
async def ask_question(request: VQARequest):
    """
    Ask a question about an uploaded file using HuggingFace BLIP VQA
    
    - **file_url**: The public URL of the uploaded file (from /upload/ endpoint)
    - **question**: The question to ask about the file content
    - **Returns**: VQA response with answer, confidence score, and metadata
    """
    import time
    start_time = time.time()
    
    try:
        # Validate input
        if not request.file_url:
            raise HTTPException(status_code=400, detail="file_url is required")
        
        if not request.question or len(request.question.strip()) < 3:
            raise HTTPException(
                status_code=400,
                detail="Question must be at least 3 characters long"
            )
        
        # Query HuggingFace VQA model
        hf_response = query_huggingface_vqa(str(request.file_url), request.question)
        
        # Parse response
        answer, confidence = parse_vqa_response(hf_response)
        
        processing_time = time.time() - start_time
        
        logger.info(f"VQA completed in {processing_time:.2f}s: '{request.question[:30]}...' -> '{answer[:30]}...'")
        
        return VQAResponse(
            success=True,
            answer=answer,
            confidence=confidence,
            file_url=str(request.file_url),
            question=request.question,
            processing_time=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"VQA processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process question: {str(e)}")

@app.get("/health")
async def detailed_health_check():
    """Detailed health check with service status"""
    s3_configured = bool(AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and S3_BUCKET_NAME)
    hf_configured = bool(HUGGINGFACE_API_TOKEN)
    
    # Test S3 connection
    s3_status = "unknown"
    if s3_configured:
        try:
            s3_client = get_s3_client()
            s3_client.head_bucket(Bucket=S3_BUCKET_NAME)
            s3_status = "accessible"
        except Exception as e:
            s3_status = f"error: {str(e)}"
    else:
        s3_status = "not_configured"
    
    # Test HuggingFace connection
    hf_status = "unknown"
    if hf_configured:
        try:
            test_response = requests.get(
                "https://api-inference.huggingface.co/status/Salesforce/blip-vqa-base",
                headers={"Authorization": f"Bearer {HUGGINGFACE_API_TOKEN}"},
                timeout=5
            )
            hf_status = "accessible" if test_response.status_code == 200 else f"status_{test_response.status_code}"
        except Exception as e:
            hf_status = f"error: {str(e)}"
    else:
        hf_status = "not_configured"
    
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "services": {
            "s3": {
                "configured": s3_configured,
                "status": s3_status,
                "bucket": S3_BUCKET_NAME,
                "region": AWS_REGION
            },
            "huggingface": {
                "configured": hf_configured,
                "status": hf_status,
                "model": "Salesforce/blip-vqa-base"
            }
        },
        "configuration": {
            "max_file_size_mb": MAX_FILE_SIZE / (1024 * 1024),
            "allowed_extensions": list(ALLOWED_EXTENSIONS),
            "cors_enabled": True
        }
    }

# Error handlers
@app.exception_handler(413)
async def payload_too_large_handler(request, exc):
    return {"error": "File too large", "max_size_mb": MAX_FILE_SIZE / (1024 * 1024)}

@app.exception_handler(422)
async def validation_exception_handler(request, exc):
    return {"error": "Validation error", "details": str(exc)}

if __name__ == "__main__":
    import uvicorn
    import time
    
    logger.info("Starting VQA SmartDoc API server...")
    
    # Check configuration on startup
    config_issues = []
    if not all([AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME]):
        config_issues.append("AWS S3 not configured")
    if not HUGGINGFACE_API_TOKEN:
        config_issues.append("HuggingFace API token not configured")
    
    if config_issues:
        logger.warning(f"Configuration issues: {', '.join(config_issues)}")
        logger.warning("Some endpoints may not work without proper configuration")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info",
        access_log=True
    )
