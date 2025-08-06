# VQA SmartDoc Backend

FastAPI backend service for Visual Question Answering on documents with AWS S3 integration.

## Features

- 🚀 **FastAPI**: Modern, fast web framework for building APIs with Python
- 📤 **File Upload**: Upload files to AWS S3 with validation
- 🤖 **AI Integration**: HuggingFace Inference API with BLIP VQA model
- ⚡ **Async Support**: Full async/await support for better performance
- 🔧 **Configuration**: Environment-based configuration with validation
- 📝 **Auto Documentation**: Interactive API docs at `/docs`
- 🐳 **Docker Support**: Containerized deployment

## Technology Stack

- **Framework**: FastAPI
- **Cloud Storage**: AWS S3
- **AI Model**: HuggingFace BLIP VQA (Salesforce/blip-vqa-base)
- **File Validation**: python-magic
- **Configuration**: Pydantic Settings
- **Deployment**: Docker, Uvicorn

## Quick Start

### 1. Environment Setup

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Fill in your configuration:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-vqa-smartdoc-bucket

# HuggingFace Configuration
HUGGINGFACE_API_TOKEN=your_huggingface_api_token

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Application

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Health Check
- `GET /` - Basic health check
- `GET /health` - Detailed health check with component status

### File Upload
- `POST /upload/` - Upload file to S3

**Request**: Multipart form with file
**Response**:
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "fileUrl": "https://bucket.s3.region.amazonaws.com/uploads/uuid.ext",
  "fileName": "document.pdf",
  "fileSize": 1024000
}
```

### Question Answering
- `POST /ask/` - Ask questions about uploaded files

**Request**:
```json
{
  "fileUrl": "https://bucket.s3.region.amazonaws.com/uploads/uuid.jpg",
  "question": "What is shown in this image?"
}
```

**Response**:
```json
{
  "success": true,
  "answer": "A document with text and graphs",
  "confidence": 0.95,
  "fileUrl": "https://bucket.s3.region.amazonaws.com/uploads/uuid.jpg",
  "question": "What is shown in this image?"
}
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AWS_ACCESS_KEY_ID` | AWS access key | - | Yes |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | - | Yes |
| `AWS_REGION` | AWS region | `us-east-1` | No |
| `S3_BUCKET_NAME` | S3 bucket name | - | Yes |
| `HUGGINGFACE_API_TOKEN` | HF API token | - | Yes |
| `HF_MODEL_URL` | HF model endpoint | BLIP VQA | No |
| `MAX_FILE_SIZE_MB` | Max file size in MB | `10.0` | No |
| `SUPPORTED_EXTENSIONS` | Supported file types | `.pdf,.png,.jpg,.jpeg,.gif` | No |
| `CORS_ORIGINS` | CORS allowed origins | `http://localhost:3000` | No |
| `API_HOST` | API bind host | `0.0.0.0` | No |
| `API_PORT` | API bind port | `8000` | No |

### Supported File Types

- **Images**: PNG, JPG, JPEG, GIF
- **Documents**: PDF
- **Size Limit**: 10MB (configurable)

## Development

### Project Structure

```
backend/
├── main.py              # FastAPI application
├── config.py            # Configuration management
├── services/
│   ├── __init__.py
│   ├── s3_service.py    # AWS S3 operations
│   └── huggingface_service.py  # HF API integration
├── utils/
│   ├── __init__.py
│   └── file_validation.py      # File validation utilities
├── requirements.txt     # Python dependencies
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose for development
└── .env.example        # Environment template
```

### Running with Docker

```bash
# Build and run
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Testing the API

1. **Interactive Documentation**: Visit `http://localhost:8000/docs`
2. **Health Check**: `curl http://localhost:8000/health`
3. **Upload File**:
   ```bash
   curl -X POST "http://localhost:8000/upload/" \
        -H "accept: application/json" \
        -H "Content-Type: multipart/form-data" \
        -F "file=@your-image.jpg"
   ```
4. **Ask Question**:
   ```bash
   curl -X POST "http://localhost:8000/ask/" \
        -H "accept: application/json" \
        -H "Content-Type: application/json" \
        -d '{
          "fileUrl": "https://your-bucket.s3.amazonaws.com/uploads/file.jpg",
          "question": "What is in this image?"
        }'
   ```

## AWS S3 Setup

1. **Create S3 Bucket**:
   - Go to AWS S3 Console
   - Create a new bucket with public read access
   - Note the bucket name and region

2. **Configure Bucket Policy** (for public read access):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```

3. **Create IAM User** with S3 permissions:
   - `s3:PutObject`
   - `s3:GetObject`
   - `s3:DeleteObject`

## HuggingFace Setup

1. **Create Account**: Sign up at [HuggingFace](https://huggingface.co/)
2. **Generate Token**: Go to Settings → Access Tokens
3. **Model Access**: The BLIP VQA model is public and free to use

## Error Handling

The API provides detailed error responses:

```json
{
  "detail": "Error message",
  "status_code": 400
}
```

Common error codes:
- `400`: Bad request (invalid file, missing parameters)
- `413`: File too large
- `500`: Server error (S3, HuggingFace API issues)
- `503`: Model loading (temporary, retry in a few seconds)

## Performance Considerations

- **File Size**: Large files take longer to upload and process
- **Model Loading**: First request to HuggingFace may take longer (model loading)
- **Rate Limits**: HuggingFace free tier has rate limits
- **Caching**: Consider implementing caching for repeated questions

## Security Notes

- Store sensitive credentials in environment variables
- Use IAM roles in production instead of access keys
- Validate all uploaded files
- Implement rate limiting in production
- Use HTTPS in production

## Production Deployment

For production deployment:

1. **Environment**: Use environment variables or AWS Parameter Store
2. **Database**: Add database for storing metadata
3. **Monitoring**: Implement logging and monitoring
4. **Load Balancing**: Use multiple instances behind a load balancer
5. **HTTPS**: Configure SSL/TLS certificates
6. **Rate Limiting**: Implement API rate limiting
7. **File Cleanup**: Implement periodic cleanup of old files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## License

This project is licensed under the MIT License.
