# Environment Setup Guide

## Quick Setup

### Option 1: Automatic Setup (Recommended)

Run the setup script to automatically create `.env` and generate JWT secrets:

```powershell
# Windows PowerShell
cd backend
powershell -ExecutionPolicy Bypass -File ./scripts/setup-env.ps1
```

### Option 2: Manual Setup

1. **Copy the example file**:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Generate JWT Secrets**:
   ```bash
   # Using Node.js
   node -e "const crypto = require('crypto'); console.log('JWT_SECRET=' + crypto.randomBytes(32).toString('base64')); console.log('JWT_REFRESH_SECRET=' + crypto.randomBytes(32).toString('base64'));"
   
   # Or using OpenSSL (Linux/Mac)
   openssl rand -base64 32
   openssl rand -base64 32
   ```

3. **Update `.env` file** with the generated secrets:
   ```env
   JWT_SECRET=<generated-secret-1>
   JWT_REFRESH_SECRET=<generated-secret-2>
   ```

## Required Environment Variables

### Critical (Must be set):

- **JWT_SECRET**: Secret key for signing access tokens
- **JWT_REFRESH_SECRET**: Secret key for signing refresh tokens
- **DATABASE_URL**: PostgreSQL connection string

### Optional (have defaults):

- **PORT**: Server port (default: 3000)
- **REDIS_URL**: Redis connection (default: redis://localhost:6379)
- **CORS_ORIGIN**: Frontend URL (default: http://localhost:5173)

## Example .env File

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/workspace_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT (REQUIRED - Generate strong random strings)
JWT_SECRET=XwUSRbxPK/JvxbnTdgXuybzx+BoctKgoJFL7ZGd80og=
JWT_REFRESH_SECRET=y6Z/4cH/bjCv+Qd3BH7Rzet+b2iX2NW/Hdyd1PJiX1I=

# CORS
CORS_ORIGIN=http://localhost:5173

# Storage
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Search
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_MASTER_KEY=masterKey
```

## Security Notes

⚠️ **Important**:
- Never commit `.env` file to version control
- Use strong, random secrets in production
- Change default secrets before deploying
- Keep secrets secure and rotate them periodically

## Troubleshooting

### Error: "secretOrPrivateKey must have a value"

This means JWT secrets are not set. Run:
```bash
cd backend
powershell -ExecutionPolicy Bypass -File ./scripts/setup-env.ps1
```

### Error: "Missing required environment variables"

Check that all required variables are set in your `.env` file.

### Verify Environment Variables

```bash
# Check if variables are loaded
cd backend
node -e "require('dotenv').config(); console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');"
```

