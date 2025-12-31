# Docker Setup Guide

This guide explains how to set up and run the workspace platform using Docker.

## Prerequisites

- Docker 20.10+ installed
- Docker Compose 2.0+ installed
- At least 4GB of available RAM
- 10GB of free disk space

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd workspace-platform

# Copy environment file
cp .env.example .env

# Edit .env with your configuration (optional for development)
# For production, update all secrets and passwords
```

### 2. Start Infrastructure Services Only

If you want to run only the infrastructure (PostgreSQL, Redis, MinIO, Meilisearch) and develop locally:

```bash
# Start infrastructure services
docker-compose up -d

# Or for development (separate volumes)
docker-compose -f docker-compose.dev.yml up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- MinIO on ports 9000 (API) and 9001 (Console)
- Meilisearch on port 7700

### 3. Start Full Stack (Infrastructure + Backend + Frontend)

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 4. Access Services

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)
- **Meilisearch**: http://localhost:7700

## Development Workflow

### Option 1: Docker for Infrastructure Only (Recommended for Development)

Run infrastructure in Docker, but run backend and frontend locally:

```bash
# Start infrastructure
docker-compose -f docker-compose.dev.yml up -d

# Run backend locally
cd backend
npm install
npm run start:dev

# Run frontend locally (in another terminal)
cd frontend
npm install
npm run dev
```

### Option 2: Full Docker Development

Run everything in Docker with hot reload (requires volume mounts):

```bash
# Start all services
docker-compose up
```

## Production Deployment

### 1. Prepare Environment

```bash
# Copy and edit production environment
cp .env.example .env

# Update all secrets and passwords:
# - POSTGRES_PASSWORD
# - JWT_SECRET
# - JWT_REFRESH_SECRET
# - REDIS_PASSWORD
# - MINIO_ROOT_PASSWORD
# - MEILISEARCH_MASTER_KEY
```

### 2. Build and Deploy

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. Run Database Migrations

```bash
# Migrations run automatically on backend startup
# Or run manually:
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### 4. Initialize Search Indexes

```bash
docker-compose -f docker-compose.prod.yml exec backend npm run search:init
```

## Common Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Execute Commands in Containers

```bash
# Backend shell
docker-compose exec backend sh

# Run Prisma commands
docker-compose exec backend npx prisma studio
docker-compose exec backend npx prisma migrate dev

# Frontend shell
docker-compose exec frontend sh
```

### Rebuild Services

```bash
# Rebuild all services
docker-compose build --no-cache

# Rebuild specific service
docker-compose build --no-cache backend
```

## Database Management

### Access PostgreSQL

```bash
# Using docker exec
docker-compose exec postgres psql -U user -d workspace_db

# Or using psql from host
psql -h localhost -U user -d workspace_db
```

### Backup Database

```bash
# Create backup
docker-compose exec postgres pg_dump -U user workspace_db > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U user workspace_db < backup.sql
```

### Reset Database

```bash
# Stop services
docker-compose down

# Remove volume
docker volume rm workspace-platform_postgres_data

# Start services (will recreate database)
docker-compose up -d
```

## MinIO Setup

### Access MinIO Console

1. Open http://localhost:9001
2. Login with credentials from `.env` (default: minioadmin/minioadmin)
3. Create bucket: `workspace-files`

### Configure MinIO via CLI

```bash
# Access MinIO container
docker-compose exec minio sh

# Create bucket (if not exists)
mc alias set myminio http://localhost:9000 minioadmin minioadmin
mc mb myminio/workspace-files
```

## Troubleshooting

### Port Already in Use

If a port is already in use, update the port in `.env`:

```bash
# Example: Change backend port
BACKEND_PORT=3001
```

Then update `docker-compose.yml` or restart services.

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres pg_isready -U user
```

### Redis Connection Issues

```bash
# Check if Redis is running
docker-compose ps redis

# Test connection
docker-compose exec redis redis-cli ping
```

### Backend Won't Start

```bash
# Check logs
docker-compose logs backend

# Check if database is ready
docker-compose exec postgres pg_isready -U user

# Rebuild backend
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Frontend Build Fails

```bash
# Check logs
docker-compose logs frontend

# Rebuild frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Clear All Data

```bash
# Stop and remove all containers and volumes
docker-compose down -v

# Remove images (optional)
docker-compose down --rmi all
```

## Health Checks

All services include health checks. Check status:

```bash
# Check all services
docker-compose ps

# Check specific service health
docker inspect workspace-backend | grep -A 10 Health
```

## Performance Tuning

### Increase Database Performance

Edit `docker-compose.yml`:

```yaml
postgres:
  command: postgres -c shared_buffers=256MB -c max_connections=200
```

### Increase Redis Memory

Edit `docker-compose.yml`:

```yaml
redis:
  command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
```

## Security Notes

⚠️ **Important for Production:**

1. Change all default passwords in `.env`
2. Use strong JWT secrets
3. Enable Redis password authentication
4. Use SSL/TLS for MinIO in production
5. Restrict network access (use internal Docker network)
6. Regularly update Docker images
7. Use secrets management (Docker secrets, Vault, etc.)

## Next Steps

1. ✅ Services are running
2. ✅ Access frontend at http://localhost:5173
3. ✅ Create your first workspace
4. ✅ Start building!

For more information, see:
- [Deployment Guide](./docs/deployment.md)
- [Quick Start Guide](./specs/001-technical-spec/quickstart.md)
- [README](./README.md)

