"""
VQA SmartDoc FastAPI Backend
Complete implementation with Cloudinary upload and HuggingFace VQA endpoints
"""

import os
import uuid
import logging
import time
from typing import Optional
import cloudinary
import cloudinary.uploader
import requests
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="VQA SmartDoc API",
    description="Visual Question Answering API with Cloudinary upload and HuggingFace BLIP VQA",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
# Note: Starlette/FASTAPI does not support wildcard strings in allow_origins.
# Use allow_origin_regex for patterns like *.vercel.app and also include exact origins.
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN") or os.getenv("NEXT_PUBLIC_SITE_URL") or os.getenv("NEXT_PUBLIC_APP_URL")

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "https://vqa-smartdoc.vercel.app",  # exact production frontend
]

if FRONTEND_ORIGIN and FRONTEND_ORIGIN not in ALLOWED_ORIGINS:
    ALLOWED_ORIGINS.append(FRONTEND_ORIGIN)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"]
)

# Configuration from environment variables
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")
HUGGINGFACE_MODEL_URL = "https://api-inference.huggingface.co/models/Salesforce/blip-vqa-base"

# File upload configuration
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".pdf", ".webp"}

# Initialize Cloudinary
def init_cloudinary():
    """Initialize Cloudinary with error handling"""
    if not all([CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET]):
        raise HTTPException(
            status_code=500,
            detail="Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables."
        )
    
    try:
        cloudinary.config(
            cloud_name=CLOUDINARY_CLOUD_NAME,
            api_key=CLOUDINARY_API_KEY,
            api_secret=CLOUDINARY_API_SECRET,
            secure=True
        )
        return True
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize Cloudinary: {str(e)}")

# Helpers
def to_camel(string: str) -> str:
    parts = string.split('_')
    return parts[0] + ''.join(word.capitalize() for word in parts[1:])

# Pydantic Models
class UploadResponse(BaseModel):
    success: bool
    message: str
    file_url: str
    file_name: str
    file_size: int
    upload_id: str

    class Config:
        alias_generator = to_camel
        allow_population_by_field_name = True

class VQARequest(BaseModel):
    file_url: HttpUrl
    question: str
    
    class Config:
        alias_generator = to_camel
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "file_url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/vqa-smartdoc/sample.jpg",
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

    class Config:
        alias_generator = to_camel
        allow_population_by_field_name = True

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

def generate_cloudinary_public_id(filename: str) -> str:
    """Generate unique public ID for Cloudinary"""
    file_ext = os.path.splitext(filename)[1].lower()
    unique_id = str(uuid.uuid4())
    return f"vqa-smartdoc/{unique_id}"

def upload_to_cloudinary(file_content: bytes, filename: str) -> str:
    """Upload file to Cloudinary and return public URL"""
    init_cloudinary()
    
    try:
        # Generate unique public ID
        public_id = generate_cloudinary_public_id(filename)
        
        # Upload to Cloudinary
        # Upload original asset; delivery optimizations (f_auto,q_auto) are applied at URL time, not at upload time
        upload_result = cloudinary.uploader.upload(
            file_content,
            public_id=public_id,
            resource_type="auto"  # Automatically detect resource type (image, raw, etc.)
        )
        
        # Return the secure URL
        public_url = upload_result.get('secure_url')
        if not public_url:
            raise HTTPException(status_code=500, detail="Failed to get Cloudinary URL from upload result")
        
        logger.info(f"File uploaded to Cloudinary: {filename} -> {public_url}")
        return public_url
        
    except Exception as e:
        logger.error(f"Cloudinary upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Cloudinary upload failed: {str(e)}")

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
            "cloudinary_configured": bool(CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET),
            "huggingface_configured": bool(HUGGINGFACE_API_TOKEN),
            "max_file_size_mb": MAX_FILE_SIZE / (1024 * 1024),
            "allowed_extensions": list(ALLOWED_EXTENSIONS)
        }
    }

@app.post("/upload/", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a file to Cloudinary and return the public URL
    
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
        
        # Upload to Cloudinary
        upload_id = str(uuid.uuid4())
        public_url = upload_to_cloudinary(file_content, file.filename)
        
        logger.info(f"File uploaded successfully: {file.filename} -> {public_url}")

        resp = UploadResponse(
            success=True,
            message="File uploaded successfully to Cloudinary",
            file_url=public_url,
            file_name=file.filename,
            file_size=len(file_content),
            upload_id=upload_id
        )
        return resp.dict(by_alias=True)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# Alias without trailing slash to handle proxies/rewrites that strip it
@app.post("/upload", response_model=UploadResponse)
async def upload_file_no_slash(file: UploadFile = File(...)):
    return await upload_file(file)

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

        resp = VQAResponse(
            success=True,
            answer=answer,
            confidence=confidence,
            file_url=str(request.file_url),
            question=request.question,
            processing_time=processing_time
        )
        return resp.dict(by_alias=True)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"VQA processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process question: {str(e)}")

# Alias without trailing slash
@app.post("/ask", response_model=VQAResponse)
async def ask_question_no_slash(request: VQARequest):
    return await ask_question(request)

@app.get("/health")
async def detailed_health_check():
    """Detailed health check with service status"""
    cloudinary_configured = bool(CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET)
    hf_configured = bool(HUGGINGFACE_API_TOKEN)
    
    # Test Cloudinary connection
    cloudinary_status = "unknown"
    if cloudinary_configured:
        try:
            init_cloudinary()
            # Test Cloudinary by checking config
            config = cloudinary.config()
            if config.cloud_name:
                cloudinary_status = "accessible"
            else:
                cloudinary_status = "config_error"
        except Exception as e:
            cloudinary_status = f"error: {str(e)}"
    else:
        cloudinary_status = "not_configured"
    
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
            "cloudinary": {
                "configured": cloudinary_configured,
                "status": cloudinary_status,
                "cloud_name": CLOUDINARY_CLOUD_NAME,
                "features": ["auto_optimization", "auto_format", "secure_delivery"]
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
    
    logger.info("Starting VQA SmartDoc API server...")
    
    # Check configuration on startup
    config_issues = []
    if not all([CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET]):
        config_issues.append("Cloudinary not configured")
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
