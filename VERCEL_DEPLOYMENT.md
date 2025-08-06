# Vercel Deployment Guide for VQA SmartDoc Frontend

This guide covers deploying the Next.js frontend to Vercel with proper integration to your FastAPI backend on Render.

## 📋 Prerequisites

- ✅ FastAPI backend deployed to Render (from DEPLOYMENT.md)
- ✅ GitHub repository with your frontend code
- ✅ Vercel account (free tier available)
- ✅ Backend API URL from Render deployment

## 🚀 Quick Deployment Steps

### 1. Prepare Your Repository

Ensure these files are in your repository root:
- ✅ `next.config.ts` - Updated with Vercel optimizations
- ✅ `vercel.json` - Vercel configuration
- ✅ `.env.production.example` - Production environment variables
- ✅ `package.json` - Dependencies and build scripts

### 2. Connect to Vercel

#### Option A: Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js configuration

#### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from your project directory
cd /path/to/vqa-smartdoc
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: vqa-smartdoc
# - Directory: ./
```

### 3. Configure Environment Variables

In the Vercel dashboard, go to Project Settings → Environment Variables and add:

#### Required Variables
| Variable | Value | Example |
|----------|-------|---------|
| `NEXT_PUBLIC_API_URL` | Your Render backend URL | `https://vqa-smartdoc-api.onrender.com` |
| `NEXT_PUBLIC_APP_ENV` | `production` | `production` |

#### Optional Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_APP_NAME` | VQA SmartDoc | Application name |
| `NEXT_PUBLIC_APP_VERSION` | 1.0.0 | Version number |
| `NEXT_PUBLIC_MAX_FILE_SIZE_MB` | 10 | Max upload size |
| `NEXT_PUBLIC_SUPPORTED_FILE_TYPES` | pdf,png,jpg,jpeg,gif,webp | Supported formats |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | true | Enable analytics |
| `NEXT_PUBLIC_ENABLE_DEBUG` | false | Debug mode |

### 4. Update Backend CORS

Your FastAPI backend needs to allow your Vercel domain. Update the backend's CORS configuration:

```python
# In your backend's environment variables (Render dashboard)
CORS_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000,https://localhost:3000
```

Replace `your-vercel-app` with your actual Vercel deployment URL.

### 5. Deploy and Test

1. **Deploy**: Vercel will automatically build and deploy
2. **Check Build Logs**: Monitor the deployment in Vercel dashboard
3. **Test Endpoints**: Visit your Vercel URL and test file upload/VQA

## 🔧 Configuration Details

### next.config.ts Features

```typescript
// Optimizations included:
- output: 'standalone'           // Optimized builds
- swcMinify: true               // Fast minification
- compress: true                // Gzip compression
- optimizeCss: true            // CSS optimization
- Image optimization           // WebP/AVIF support
- Security headers             // XSS protection
- API rewrites                 // Development proxy
```

### vercel.json Features

```json
{
  "version": 2,
  "routes": [
    // API proxy for development
    "/api/backend/(.*)" → "https://your-render-app.onrender.com/$1"
  ],
  "env": {
    // Environment variable mapping
  },
  "functions": {
    // Function timeouts
  }
}
```

## 🔍 Troubleshooting

### Common Issues

#### 1. API Connection Errors

**Symptoms**: Network errors, CORS issues, failed API calls

**Solutions**:
```bash
# Check environment variables
vercel env ls

# Verify API URL is correct
curl https://your-vercel-app.vercel.app/api/health

# Update CORS in backend
CORS_ORIGINS=https://your-vercel-app.vercel.app
```

#### 2. Build Failures

**Symptoms**: TypeScript errors, missing dependencies

**Solutions**:
```bash
# Check build logs in Vercel dashboard
# Fix TypeScript errors locally first
npm run build

# Ensure all dependencies are in package.json
npm install --save missing-package
```

#### 3. Large Bundle Size

**Symptoms**: Slow loading, bundle warnings

**Solutions**:
```bash
# Analyze bundle
npm run build
npx @next/bundle-analyzer

# Optimize imports
import { specific } from 'library'  # instead of import * as library
```

#### 4. Environment Variables Not Working

**Symptoms**: Config values are undefined

**Solutions**:
```bash
# Ensure variables start with NEXT_PUBLIC_
# Re-deploy after adding new environment variables
vercel --prod

# Check in browser console
console.log(process.env.NEXT_PUBLIC_API_URL)
```

### Performance Monitoring

#### 1. Core Web Vitals

Monitor in Vercel dashboard:
- **Lighthouse Score**: Aim for 90+
- **First Contentful Paint**: < 1.8s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1

#### 2. API Performance

```javascript
// Monitor API response times
console.time('api-upload');
await uploadFile(file);
console.timeEnd('api-upload');
```

## 🚦 Deployment Workflow

### Development Workflow

```bash
# 1. Develop locally
npm run dev

# 2. Test with local backend
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev

# 3. Build and test
npm run build
npm run start

# 4. Deploy to preview
vercel

# 5. Deploy to production
vercel --prod
```

### Automatic Deployments

Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches
- **Development**: Local development with `vercel dev`

### Custom Domains

```bash
# Add custom domain
vercel domains add yourdomain.com

# Configure DNS (in your domain provider):
# Type: CNAME
# Name: @ (or subdomain)
# Value: cname.vercel-dns.com

# Verify domain
vercel domains verify yourdomain.com
```

## 📊 Analytics and Monitoring

### Vercel Analytics

```bash
# Enable in vercel.json
{
  "analytics": {
    "id": "your-analytics-id"
  }
}
```

### Custom Monitoring

```typescript
// Add to your components
import { useEffect } from 'react';

export function usePageView() {
  useEffect(() => {
    // Track page views
    if (typeof window !== 'undefined') {
      console.log('Page view:', window.location.pathname);
    }
  }, []);
}
```

## 🔒 Security Considerations

### Environment Variables

- ✅ Only use `NEXT_PUBLIC_` for client-side variables
- ✅ Keep sensitive data on the server-side
- ✅ Use Vercel's secure environment variables

### Headers Security

```typescript
// Included in next.config.ts:
'X-Frame-Options': 'DENY'
'X-Content-Type-Options': 'nosniff'
'Referrer-Policy': 'origin-when-cross-origin'
'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
```

## 🎯 Production Checklist

Before going live:

- [ ] ✅ Backend deployed and accessible
- [ ] ✅ Environment variables configured
- [ ] ✅ CORS updated with Vercel domain
- [ ] ✅ Custom domain configured (optional)
- [ ] ✅ Analytics enabled (optional)
- [ ] ✅ Error monitoring set up
- [ ] ✅ Performance optimized
- [ ] ✅ Security headers configured
- [ ] ✅ File upload tested
- [ ] ✅ VQA functionality tested

## 🔗 Useful Commands

```bash
# Local development with production API
NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com npm run dev

# Build optimization analysis
ANALYZE=true npm run build

# Deploy specific branch
vercel --prod --scope your-team

# Check deployment logs
vercel logs https://your-deployment-url

# List all deployments
vercel ls

# Remove deployment
vercel remove deployment-url
```

## 🎉 Success!

Your VQA SmartDoc frontend is now deployed to Vercel and connected to your FastAPI backend on Render!

**Frontend URL**: `https://your-vercel-app.vercel.app`
**Backend URL**: `https://your-render-app.onrender.com`
**API Docs**: `https://your-render-app.onrender.com/docs`

### Next Steps

1. **Test thoroughly**: Upload files and ask questions
2. **Monitor performance**: Check Vercel analytics
3. **Set up monitoring**: Add error tracking
4. **Custom domain**: Point your domain to Vercel
5. **Scale**: Upgrade plans as needed

Your full-stack VQA application is now live! 🚀
