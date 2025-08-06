# Security Checklist for VQA SmartDoc

## 🔒 Before Committing Code

### ✅ Environment Variables
- [ ] All sensitive data is in `.env` files (not `.env.example`)
- [ ] No real API keys, passwords, or credentials in code
- [ ] `.env*` files are properly ignored by git
- [ ] Only placeholder values in `.env.example` files

### ✅ AWS Credentials
- [ ] No AWS access keys in code or config files
- [ ] No `.aws/` directory committed
- [ ] S3 bucket permissions properly configured
- [ ] IAM user has minimal required permissions

### ✅ API Tokens
- [ ] HuggingFace API token not in code
- [ ] No API keys in frontend code (use backend proxy)
- [ ] Tokens stored securely in deployment platforms

### ✅ Files & Directories
- [ ] `node_modules/` not committed
- [ ] `venv/` and virtual environments not committed
- [ ] `__pycache__/` and cache files not committed
- [ ] Upload directories (`uploads/`) not committed
- [ ] Log files not committed

## 🛡️ Production Security

### ✅ Backend Security
- [ ] Non-root user in Docker container
- [ ] Environment variables set in deployment platform
- [ ] CORS properly configured for frontend domain only
- [ ] HTTPS enabled on deployment platform
- [ ] Health checks configured
- [ ] File upload size limits enforced
- [ ] Input validation on all endpoints

### ✅ Frontend Security
- [ ] Environment variables prefixed with `NEXT_PUBLIC_` only for client-side
- [ ] Sensitive config kept on server-side
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Security headers configured in `next.config.ts`
- [ ] No sensitive data in client-side bundles

### ✅ Infrastructure Security
- [ ] S3 bucket not publicly readable (except uploaded files)
- [ ] CloudFront or CDN for file serving (optional)
- [ ] Regular security updates
- [ ] Monitor access logs
- [ ] Rate limiting configured (if needed)

## 🔍 Security Verification Commands

### Check for Committed Secrets
```bash
# Check if any sensitive files are tracked
git ls-files | findstr /R "\.env$ \.key$ \.pem$ credentials"

# Check for potential secrets in code
git log --all --full-history -- "*.env*"
```

### Verify .gitignore
```bash
# Test if .env files are properly ignored
echo "TEST_SECRET=secret123" > .env.test
git status  # Should NOT show .env.test as untracked
rm .env.test
```

### Check Environment Variables
```bash
# Backend - verify no secrets in code
findstr /S /I "AWS_ACCESS_KEY\|HUGGINGFACE_API_TOKEN\|SECRET" backend/*.py

# Frontend - verify only NEXT_PUBLIC_ vars in client code
findstr /S /I "process.env" src/**/*.{ts,tsx}
```

## 🚨 If Secrets Were Committed

### Immediate Actions
1. **Rotate all exposed credentials immediately**
2. **Remove from history** (if recent):
   ```bash
   git filter-branch --index-filter 'git rm --cached --ignore-unmatch .env' HEAD
   git push --force-with-lease origin main
   ```
3. **For older commits, consider repository reset**
4. **Update deployment platforms with new credentials**

### Prevention
- Set up pre-commit hooks to scan for secrets
- Use tools like `git-secrets` or `truffleHog`
- Regular security audits
- Team training on security practices

## 📚 Security Resources

- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [AWS Security Best Practices](https://aws.amazon.com/security/security-learning/)

## ✅ Security Checklist Summary

**Before every git commit:**
- [ ] No `.env` files with real values
- [ ] No API keys or passwords in code
- [ ] All sensitive files properly ignored
- [ ] Only example/placeholder values in templates

**Before deployment:**
- [ ] Environment variables set in platform
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Security headers configured
- [ ] File upload limits enforced

**After deployment:**
- [ ] Test all security measures
- [ ] Monitor access logs
- [ ] Regular security updates
- [ ] Backup and recovery plan

Remember: **Security is not optional!** 🔒
