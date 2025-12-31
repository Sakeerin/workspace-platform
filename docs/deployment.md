# Deployment Guide: All-in-One Workspace Platform

**Date**: 2025-01-27  
**Version**: 1.0.0

## Overview

This guide covers deployment strategies for the All-in-One Workspace Platform, including production setup, environment configuration, and scaling considerations.

## Prerequisites

- **Node.js**: 20+ LTS
- **PostgreSQL**: 16+ (with replication for production)
- **Redis**: 7.0+ (cluster mode for production)
- **Meilisearch**: Latest stable version
- **Docker**: 20.10+ (optional, for containerized deployment)
- **Nginx**: 1.20+ (for reverse proxy and load balancing)

## Deployment Architecture

### Production Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CDN / CloudFlare                      │
│              SSL Termination / DDoS Protection           │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Nginx     │  │   Nginx     │  │   Nginx     │
│ Load Balancer│  │ Load Balancer│  │ Load Balancer│
└─────────────┘  └─────────────┘  └─────────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  App Server │  │  App Server │  │  App Server │
│   (NestJS)  │  │   (NestJS)  │  │   (NestJS)  │
└─────────────┘  └─────────────┘  └─────────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ PostgreSQL  │  │    Redis     │  │ Meilisearch │
│  (Primary)  │  │   (Cluster)  │  │   (Cluster) │
└─────────────┘  └─────────────┘  └─────────────┘
        │
        ▼
┌─────────────┐  ┌─────────────┐
│ PostgreSQL  │  │   S3/MinIO  │
│  (Replica)  │  │  (Storage)  │
└─────────────┘  └─────────────┘
```

## Environment Configuration

### Backend Environment Variables

Create `.env` file in `backend/` directory:

```bash
# Application
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:password@postgres-primary:5432/workspace_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://redis-cluster:6379
REDIS_CLUSTER_MODE=true

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://yourdomain.com

# Storage
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=workspace-files

# Search
SEARCH_ENGINE=meilisearch
MEILISEARCH_URL=http://meilisearch:7700
MEILISEARCH_MASTER_KEY=your-meilisearch-master-key

# WebSocket
WS_PORT=3001

# Application URLs
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### Frontend Environment Variables

Create `.env.production` file in `frontend/` directory:

```bash
VITE_API_URL=https://api.yourdomain.com/api/v1
VITE_WS_URL=wss://api.yourdomain.com
VITE_APP_NAME=Workspace Platform
```

## Deployment Methods

### Method 1: Docker Compose (Recommended for Small/Medium Scale)

1. **Build Docker images**:
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. **Start services**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Run database migrations**:
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
   ```

4. **Initialize search indexes**:
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend npm run search:init
   ```

### Method 2: Manual Deployment

#### Backend Deployment

1. **Build application**:
   ```bash
   cd backend
   npm ci --production
   npm run build
   ```

2. **Run database migrations**:
   ```bash
   npx prisma migrate deploy
   ```

3. **Start application with PM2**:
   ```bash
   pm2 start dist/main.js --name workspace-backend -i max
   pm2 save
   pm2 startup
   ```

#### Frontend Deployment

1. **Build application**:
   ```bash
   cd frontend
   npm ci --production
   npm run build
   ```

2. **Serve with Nginx**:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       root /var/www/workspace-platform/frontend/dist;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Method 3: Kubernetes Deployment

See `k8s/` directory for Kubernetes manifests (create if needed).

## Database Setup

### PostgreSQL Setup

1. **Create database**:
   ```sql
   CREATE DATABASE workspace_db;
   CREATE USER workspace_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE workspace_db TO workspace_user;
   ```

2. **Run migrations**:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

3. **Setup replication** (for production):
   - Configure primary database
   - Setup streaming replication
   - Configure read replicas

### Redis Setup

1. **Standalone mode** (development):
   ```bash
   redis-server --port 6379
   ```

2. **Cluster mode** (production):
   ```bash
   # Setup Redis cluster with 6 nodes (3 masters, 3 replicas)
   redis-cli --cluster create \
     node1:6379 node2:6379 node3:6379 \
     node4:6379 node5:6379 node6:6379 \
     --cluster-replicas 1
   ```

## Security Checklist

- [ ] Change all default passwords and secrets
- [ ] Enable SSL/TLS certificates (Let's Encrypt)
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Setup CSRF protection
- [ ] Configure CORS properly
- [ ] Enable input sanitization
- [ ] Setup database backups
- [ ] Configure log rotation
- [ ] Enable security headers (Helmet)
- [ ] Setup monitoring and alerting
- [ ] Configure DDoS protection

## Monitoring & Logging

### Application Monitoring

1. **Setup PM2 monitoring**:
   ```bash
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 7
   ```

2. **Setup application logs**:
   - Logs stored in `backend/logs/`
   - Rotate logs daily
   - Keep 30 days of logs

### Performance Monitoring

- Use APM tools (New Relic, Datadog, etc.)
- Monitor database query performance
- Track API response times
- Monitor WebSocket connections
- Track error rates

## Scaling Considerations

### Horizontal Scaling

1. **Application Servers**:
   - Run multiple instances behind load balancer
   - Use sticky sessions for WebSocket connections
   - Share Redis for session storage

2. **Database**:
   - Use read replicas for read-heavy operations
   - Implement connection pooling
   - Use database connection limits

3. **Cache**:
   - Use Redis cluster for high availability
   - Implement cache warming strategies
   - Monitor cache hit rates

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Use database indexes effectively
- Implement caching strategies

## Backup & Recovery

### Database Backups

```bash
# Automated daily backup
pg_dump -h localhost -U workspace_user workspace_db | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore from backup
gunzip < backup_20250127.sql.gz | psql -h localhost -U workspace_user workspace_db
```

### File Storage Backups

- Use S3 versioning
- Setup cross-region replication
- Regular backup verification

## Health Checks

### Application Health Endpoint

```bash
curl https://api.yourdomain.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "meilisearch": "connected"
}
```

## Troubleshooting

### Common Issues

1. **Database connection errors**:
   - Check connection string
   - Verify database is running
   - Check firewall rules

2. **Redis connection errors**:
   - Verify Redis is running
   - Check cluster configuration
   - Verify network connectivity

3. **High memory usage**:
   - Check for memory leaks
   - Review cache sizes
   - Optimize database queries

## Rollback Procedure

1. **Stop new deployments**
2. **Revert to previous version**:
   ```bash
   git checkout <previous-tag>
   npm ci
   npm run build
   pm2 restart workspace-backend
   ```
3. **Rollback database migrations** (if needed):
   ```bash
   npx prisma migrate resolve --rolled-back <migration-name>
   ```

## Maintenance Windows

- Schedule maintenance during low-traffic periods
- Notify users in advance
- Use blue-green deployment for zero-downtime updates
- Monitor during and after deployment

## Support

For deployment issues:
- Check logs: `backend/logs/`
- Review monitoring dashboards
- Contact DevOps team
- Create GitHub issue

