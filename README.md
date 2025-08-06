# VQA SmartDoc

A full-stack Next.js 14 TypeScript application for Visual Question Answering on documents. Upload PDF documents or images and ask intelligent questions to get AI-powered answers using HuggingFace BLIP VQA.

## 🏗️ Architecture

This project consists of two main components:

### 🎨 Frontend (Next.js)
- Modern React application with TypeScript
- File upload interface and question forms
- Integration with FastAPI backend
- Responsive design with Tailwind CSS
- **Deployment**: Optimized for Vercel

### 🚀 Backend (FastAPI)
- Python FastAPI server for AI processing
- AWS S3 integration for file storage
- HuggingFace BLIP VQA model integration
- RESTful API with automatic documentation
- **Deployment**: Production-ready Docker for Render/Railway

## ✨ Features

- 📄 **Document Upload**: Support for PDF documents and images (PNG, JPG, JPEG, GIF, WebP)
- 🤖 **AI Question Answering**: Ask questions about your uploaded documents using BLIP VQA
- 🎨 **Clean UI**: Modern, responsive design with Tailwind CSS
- ⚡ **Fast Performance**: Built with Next.js 14 and App Router
- 🔧 **TypeScript**: Full type safety throughout the application
- 🌐 **Production Ready**: Docker containerization and cloud deployment configs
- 🔒 **Secure**: Non-root containers, secure environment handling
- 📊 **Monitoring**: Health checks and structured logging

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4
- **HTTP Client**: Axios with enhanced error handling
- **Deployment**: Vercel with production optimizations
- **Development**: ESLint, TypeScript compiler

### Backend
- **Framework**: FastAPI (Python 3.11)
- **AI Model**: HuggingFace BLIP VQA (Salesforce/blip-vqa-base)
- **Cloud Storage**: AWS S3 with boto3
- **Containerization**: Docker with security best practices
- **Deployment**: Render/Railway ready with health checks
- **Documentation**: Auto-generated OpenAPI/Swagger

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (for frontend)
- Python 3.10+ (for backend)
- AWS Account with S3 bucket
- HuggingFace account and API token

## 📦 Deployment

### 🎨 Frontend Deployment (Vercel)

The frontend is optimized for Vercel deployment with:
- ✅ Production-ready `next.config.ts`
- ✅ Environment variable configuration
- ✅ Automatic API integration
- ✅ Performance optimizations

**Quick Deploy**: See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for complete guide.

### 🚀 Backend Deployment (Render/Railway)

The backend includes production-ready Docker configuration:
- ✅ Optimized Dockerfile with security features
- ✅ Render and Railway deployment configs
- ✅ Environment variable management
- ✅ Health checks and monitoring

**Quick Deploy**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete guide.

## 🔧 Configuration

### 🔒 Security Notice

**⚠️ IMPORTANT**: Never commit sensitive data to your repository!

- ✅ Use `.env.example` files as templates
- ✅ Copy `.env.example` to `.env` and add real values
- ✅ All `.env*` files are ignored by git
- ✅ Set environment variables in deployment platforms
- ❌ Never commit real API keys, passwords, or credentials

📚 **See [SECURITY.md](./SECURITY.md) for complete security checklist and best practices.**

### Frontend Environment Variables

```env
# Required
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_APP_ENV=production

# Optional
NEXT_PUBLIC_MAX_FILE_SIZE_MB=10
NEXT_PUBLIC_SUPPORTED_FILE_TYPES=pdf,png,jpg,jpeg,gif,webp
```

### Backend Environment Variables

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your_bucket_name

# HuggingFace Configuration
HUGGINGFACE_API_TOKEN=your_hf_token

# CORS Configuration
CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
```

### Frontend Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Run the development server**:
```bash
npm run dev
```

3. **Open your browser**:
Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

### Backend Setup

1. **Navigate to backend directory**:
```bash
cd backend
```

2. **Create environment file**:
```bash
copy .env.example .env
```

3. **Configure your credentials in `.env`**:
```env
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
S3_BUCKET_NAME=your-vqa-smartdoc-bucket
HUGGINGFACE_API_TOKEN=your_huggingface_api_token
```

4. **Start the backend server**:
```bash
# Windows
start.bat

# Linux/Mac
./start.sh

# Or manually
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend API will be available at [http://localhost:8000](http://localhost:8000)

## Usage

### Main Application Workflow
1. **Upload a Document**: Use the main page to upload a PDF or image file
2. **Automatic Navigation**: After upload, you're automatically taken to the ask page
3. **Ask Questions**: Use the question form to ask about the document content
4. **Get Answers**: Receive AI-generated answers based on your document

### API Utilities
The application includes robust API utilities in `src/utils/api.ts`:

```tsx
import { uploadFile, askQuestion, validateFile, formatFileSize } from '@/utils/api';

// Upload a file with validation and error handling
try {
  const result = await uploadFile(file);
  console.log('File URL:', result.fileUrl);
} catch (error) {
  console.error('Upload failed:', error.message);
}

// Ask a question about a file
try {
  const result = await askQuestion(fileUrl, question);
  console.log('Answer:', result.answer);
  console.log('Confidence:', result.confidence);
} catch (error) {
  console.error('Question failed:', error.message);
}

// Validate file before upload
const validation = validateFile(file);
if (!validation.isValid) {
  console.error('Invalid file:', validation.error);
}
```

### Demo Pages
- **Upload Demo** (`/upload-demo`): Test the UploadForm component
- **Complete Demo** (`/complete-demo`): Full workflow with UploadForm + AskForm

### Component Usage

#### UploadForm Component
```tsx
import UploadForm from '@/components/UploadForm';

function MyComponent() {
  const handleUploadComplete = (fileUrl: string) => {
    console.log('File uploaded:', fileUrl);
    // Use the file URL for further processing
  };

  return <UploadForm onUploadComplete={handleUploadComplete} />;
}
```

#### AskForm Component
```tsx
import AskForm from '@/components/AskForm';

function MyComponent() {
  const fileUrl = '/api/files/my-document.pdf';
  const fileName = 'my-document.pdf';

  return <AskForm fileUrl={fileUrl} fileName={fileName} />;
}
```

## Project Structure

```
vqa-smartdoc/
├── backend/                 # FastAPI Python backend
│   ├── main.py             # FastAPI application
│   ├── config.py           # Configuration management
│   ├── services/
│   │   ├── s3_service.py   # AWS S3 operations
│   │   └── huggingface_service.py  # HF API integration
│   ├── utils/
│   │   └── file_validation.py      # File validation
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile         # Docker configuration
│   ├── start.bat          # Windows startup script
│   └── start.sh           # Linux/Mac startup script
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── upload/         # File upload API endpoint (Next.js)
│   │   │   ├── question/       # Question answering API endpoint (Next.js)
│   │   │   ├── ask/            # Ask questions about files API endpoint
│   │   │   └── files/          # File serving API endpoint
│   │   ├── ask/                # Ask questions page
│   │   ├── complete-demo/      # Complete workflow demo page
│   │   ├── upload-demo/        # Upload component demo page
│   │   ├── api-demo/          # API utilities demo page
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx           # Main application page (upload)
│   ├── components/
│   │   ├── UploadForm.tsx     # Modern file upload component
│   │   ├── AskForm.tsx        # Ask questions about files component
│   │   └── ApiUtilsDemo.tsx   # API utilities demo component
│   ├── utils/
│   │   └── api.ts            # Enhanced API utilities with Axios and error handling
│   └── types/
│       └── api.ts            # TypeScript type definitions
├── package.json
└── README.md
```

## Development

This project uses modern development practices:

- **TypeScript** for type safety
- **ESLint** for code linting
- **Tailwind CSS** for styling
- **Next.js App Router** for routing and API routes

## API Endpoints

### Frontend API (Next.js - Mock/Development)
- `POST /api/upload` - Upload documents and images (development)
- `POST /api/question` - Submit questions and get answers (legacy)
- `POST /api/ask` - Ask questions about specific files using file URL
- `GET /api/files/[filename]` - Serve uploaded files

### Backend API (FastAPI - Production)
- `POST /upload/` - Upload files to AWS S3
- `POST /ask/` - Ask questions using HuggingFace BLIP VQA
- `GET /health` - Detailed health check with component status
- `GET /docs` - Interactive API documentation (Swagger UI)

## Future Enhancements

This is a foundational implementation. Future enhancements could include:

- Integration with actual AI/ML models for document processing
- Database storage for uploaded files and conversations
- User authentication and session management
- Support for more file types
- Advanced document analysis features
- Chat history and conversation persistence

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request
