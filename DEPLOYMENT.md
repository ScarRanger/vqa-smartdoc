# Deployment Guide for VQA SmartDoc API

This guide covers deploying the FastAPI backend to Render and Railway cloud platforms.

## 🐳 Docker Configuration

The included `Dockerfile` is optimized for production deployment with:

- **Python 3.11 slim**: Lightweight base image
- **Non-root user**: Enhanced security
- **Multi-stage optimization**: Better layer caching
- **Health checks**: Container orchestration support
- **Production settings**: Optimized for cloud deployment

### Key Features:
- Security: Runs as non-root user
- Performance: Optimized Python settings
- Monitoring: Built-in health checks
- Scalability: Ready for horizontal scaling

## 🎨 Render Deployment

### Prerequisites
1. GitHub repository with your code
2. Render account (free tier available)
3. AWS S3 bucket and credentials
4. HuggingFace API token

### Step 1: Prepare Repository
```bash
# Push your code to GitHub
git add .
git commit -m "Add deployment configuration"
git push origin main
```

### Step 2: Deploy with render.yaml
1. Place `render.yaml` in your repository root
2. Update the repository URL in `render.yaml`
3. Connect your GitHub repo to Render
4. Render will automatically detect the `render.yaml` configuration

### Step 3: Set Environment Variables
In Render dashboard, set these sensitive variables:
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `S3_BUCKET_NAME`: Your S3 bucket name
- `HUGGINGFACE_API_TOKEN`: Your HuggingFace API token
- `CORS_ORIGINS`: Update with your frontend domain

### Step 4: Custom Domains (Optional)
- Add your custom domain in Render dashboard
- Update CORS_ORIGINS to include your domain
- SSL certificates are automatically managed

## 🚂 Railway Deployment

### Prerequisites
1. Railway account (free tier available)
2. GitHub repository
3. Same AWS and HuggingFace credentials

### Step 1: Deploy from GitHub
```bash
# Using Railway CLI (recommended)
npm install -g @railway/cli
railway login
railway link [project-id]  # or create new project
railway up
```

### Step 2: Configure Environment Variables
```bash
# Set environment variables via CLI
railway variables set AWS_ACCESS_KEY_ID=your_access_key
railway variables set AWS_SECRET_ACCESS_KEY=your_secret_key
railway variables set S3_BUCKET_NAME=your_bucket_name
railway variables set HUGGINGFACE_API_TOKEN=your_token
railway variables set CORS_ORIGINS=https://your-frontend.railway.app,http://localhost:3000
```

### Step 3: Custom Domains (Optional)
```bash
# Add custom domain
railway domain
```

## 📋 Environment Variables Reference

### Required Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS credentials for S3 | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `S3_BUCKET_NAME` | S3 bucket for file uploads | `vqa-smartdoc-uploads` |
| `HUGGINGFACE_API_TOKEN` | HuggingFace API access | `hf_xxxxxxxxxxxxxxxxxxxx` |

### Optional Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `AWS_REGION` | `us-east-1` | AWS region for S3 |
| `MAX_FILE_SIZE_MB` | `10` | Maximum upload size |
| `SUPPORTED_EXTENSIONS` | `pdf,png,jpg,jpeg,gif,webp` | Allowed file types |
| `CORS_ORIGINS` | `*` | Allowed CORS origins |
| `LOG_LEVEL` | `info` | Logging level |

## 🔧 Production Optimizations

### 1. Performance Settings
The Dockerfile includes optimizations:
```dockerfile
ENV PYTHONDONTWRITEBYTECODE=1    # Prevent .pyc files
ENV PYTHONUNBUFFERED=1           # Real-time logging
ENV PIP_NO_CACHE_DIR=1           # Reduce image size
```

### 2. Security Features
- Non-root user execution
- Minimal base image (Python slim)
- No unnecessary packages
- Environment-based configuration

### 3. Monitoring & Health Checks
- `/health` endpoint for service monitoring
- Container health checks
- Structured logging

### 4. Scalability
- Single worker by default (suitable for free tiers)
- Easy to scale horizontally
- Stateless design

## 🔍 Troubleshooting

### Common Issues

1. **Health Check Failures**
   ```bash
   # Check logs
   railway logs  # or check Render logs
   
   # Test health endpoint locally
   curl https://your-app.railway.app/health
   ```

2. **Environment Variable Issues**
   ```bash
   # Verify variables are set
   railway variables  # or check Render dashboard
   ```

3. **CORS Issues**
   ```bash
   # Update CORS origins
   railway variables set CORS_ORIGINS=https://your-frontend.com,http://localhost:3000
   ```

4. **AWS S3 Connection Issues**
   - Verify AWS credentials are correct
   - Check S3 bucket permissions
   - Ensure bucket exists and is accessible

5. **HuggingFace API Issues**
   - Verify API token is valid
   - Check model URL accessibility
   - Monitor rate limits

### Performance Monitoring

1. **Health Check Endpoint**
   ```bash
   curl https://your-app.railway.app/health
   ```

2. **API Documentation**
   ```bash
   # Available at
   https://your-app.railway.app/docs
   ```

3. **Logs Monitoring**
   ```bash
   # Railway
   railway logs --follow
   
   # Render: Check dashboard logs section
   ```

## 🚀 Next Steps

After successful deployment:

1. **Test API Endpoints**
   - Use `/docs` for interactive testing
   - Test file upload and VQA functionality

2. **Monitor Performance**
   - Check health endpoint regularly
   - Monitor logs for errors
   - Set up alerts for downtime

3. **Scale as Needed**
   - Upgrade to paid plans for better performance
   - Add horizontal scaling if needed
   - Consider CDN for static assets

4. **Security Hardening**
   - Rotate API keys regularly
   - Monitor access logs
   - Set up rate limiting if needed

## 📞 Support

For deployment issues:
- Check the platform-specific documentation
- Review application logs
- Test endpoints using the `/docs` interface
- Verify environment variable configuration

The API will be available at:
- Render: `https://vqa-smartdoc-api.onrender.com`
- Railway: `https://your-project.railway.app`

Make sure to update your frontend to use the correct API endpoint!
