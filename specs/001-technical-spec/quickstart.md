# Quick Start Guide: All-in-One Workspace Platform

**Date**: 2025-01-27  
**Phase**: 1 - Design & Contracts

## Overview

This guide provides a quick start for developers working on the All-in-One Workspace Platform. It covers setup, architecture overview, and key development workflows.

## Prerequisites

- **Node.js**: 20+ LTS
- **PostgreSQL**: 16+
- **Redis**: 7.0+
- **Docker**: (optional, for local development)
- **Git**: Latest version

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer (Nginx)                 │
│              SSL Termination / CDN                       │
└─────────────────────────────────────────────────────────┘
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
│  (Primary)  │  │   (Cache)    │  │   (Search)  │
└─────────────┘  └─────────────┘  └─────────────┘
        │
        ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ PostgreSQL  │  │   Bull MQ   │  │  S3/MinIO   │
│  (Replica)  │  │   (Queue)   │  │  (Storage)  │
└─────────────┘  └─────────────┘  └─────────────┘
```

## Project Structure

```
workspace-platform/
├── backend/                 # NestJS backend
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── controllers/     # API controllers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Data models
│   │   ├── repositories/    # Data access
│   │   ├── websocket/       # WebSocket handlers
│   │   └── ...
│   └── tests/
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── store/           # Zustand stores
│   │   └── ...
│   └── tests/
└── specs/                   # Documentation
    └── 001-technical-spec/
```

## Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/your-org/workspace-platform.git
cd workspace-platform
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your configuration
# DATABASE_URL=postgresql://user:password@localhost:5432/workspace_db
# REDIS_URL=redis://localhost:6379
# JWT_SECRET=your-secret-key

# Run database migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed

# Start development server
npm run dev
```

Backend will run on `http://localhost:3000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env
# VITE_API_URL=http://localhost:3000/api/v1
# VITE_WS_URL=ws://localhost:3000

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

### 4. Database Setup (PostgreSQL)

```bash
# Using Docker
docker run -d \
  --name workspace-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=workspace_db \
  -p 5432:5432 \
  postgres:16

# Or install locally and create database
createdb workspace_db
```

### 5. Redis Setup

```bash
# Using Docker
docker run -d \
  --name workspace-redis \
  -p 6379:6379 \
  redis:7

# Or install locally
redis-server
```

### 6. Meilisearch Setup (Optional for MVP)

```bash
# Using Docker
docker run -d \
  --name workspace-meilisearch \
  -p 7700:7700 \
  getmeili/meilisearch:latest

# Or install locally
# Follow Meilisearch installation guide
```

## Development Workflow

### Running Tests

```bash
# Backend tests
cd backend
npm run test              # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e          # E2E tests

# Frontend tests
cd frontend
npm run test              # Unit tests
npm run test:e2e          # E2E tests (Playwright)
```

### Database Migrations

```bash
cd backend

# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Code Quality

```bash
# Backend
cd backend
npm run lint              # ESLint
npm run format            # Prettier
npm run type-check        # TypeScript check

# Frontend
cd frontend
npm run lint
npm run format
npm run type-check
```

## Key Concepts

### Block-Based Architecture

All content is structured as **blocks**:
- Each block has a `type` (paragraph, heading, list, etc.)
- Blocks can be nested (parent-child relationships)
- Blocks have `content` (JSONB) and `properties` (JSONB)
- Blocks are ordered by `position` within their parent

### Real-Time Collaboration

- **WebSocket**: Socket.io for real-time updates
- **CRDT**: Conflict-free Replicated Data Types for conflict resolution
- **Presence**: Live cursors and user presence
- **Events**: Block updates, comments, page changes

### Permissions

- **Workspace-level**: Role-based (owner, admin, member, guest)
- **Page-level**: Granular permissions (view, comment, edit, full_access)
- **Inheritance**: Child pages inherit parent permissions (optional)

### Search

- **Full-text search**: PostgreSQL full-text search + Meilisearch
- **Indexing**: Pages, blocks, and database rows are indexed
- **Real-time**: Search index updated on content changes

## API Usage Examples

### Authentication

```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Get current user
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Workspaces

```bash
# List workspaces
curl -X GET http://localhost:3000/api/v1/workspaces \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Create workspace
curl -X POST http://localhost:3000/api/v1/workspaces \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Workspace",
    "slug": "my-workspace"
  }'
```

### Pages

```bash
# Create page
curl -X POST http://localhost:3000/api/v1/workspaces/WORKSPACE_UUID/pages \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Page",
    "type": "page"
  }'

# Get page
curl -X GET http://localhost:3000/api/v1/workspaces/WORKSPACE_UUID/pages/PAGE_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Blocks

```bash
# Create block
curl -X POST http://localhost:3000/api/v1/pages/PAGE_UUID/blocks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "paragraph",
    "content": {
      "text": "Hello, World!"
    }
  }'
```

## WebSocket Events

### Connect

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_ACCESS_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('Connected');
  
  // Join page room
  socket.emit('join_page', { page_id: 'PAGE_UUID' });
});
```

### Listen for Updates

```javascript
// Block created
socket.on('block.created', (data) => {
  console.log('Block created:', data);
});

// Block updated
socket.on('block.updated', (data) => {
  console.log('Block updated:', data);
});

// Presence
socket.on('presence.cursor', (data) => {
  console.log('User cursor:', data);
});
```

## Common Tasks

### Creating a New Block Type

1. **Backend**: Add block type to `blocks.type` enum
2. **Backend**: Update block validation in `validators/block.validator.ts`
3. **Frontend**: Create component in `components/Editor/blocks/`
4. **Frontend**: Register in `BlockRenderer.tsx`

### Adding a New API Endpoint

1. **Backend**: Create controller in `controllers/`
2. **Backend**: Create service in `services/`
3. **Backend**: Add route in `routes/`
4. **Backend**: Update OpenAPI spec in `contracts/openapi.yaml`
5. **Frontend**: Add service method in `services/api.ts`

### Database Changes

1. Update Prisma schema in `backend/prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name description`
3. Update data model docs in `specs/001-technical-spec/data-model.md`

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -h localhost -U postgres -d workspace_db
```

### Redis Connection Issues

```bash
# Check Redis is running
redis-cli ping

# Should return: PONG
```

### Port Conflicts

```bash
# Check what's using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Change port in .env
PORT=3001
```

## Next Steps

1. ✅ Complete setup
2. ✅ Review architecture
3. ✅ Understand block-based model
4. ⏭️ Start implementing features
5. ⏭️ Write tests
6. ⏭️ Deploy to staging

## Resources

- **API Documentation**: `specs/001-technical-spec/contracts/openapi.yaml`
- **Data Model**: `specs/001-technical-spec/data-model.md`
- **Research**: `specs/001-technical-spec/research.md`
- **Constitution**: `.specify/memory/constitution.md`

## Support

- **Documentation**: See `specs/` directory
- **Issues**: Create GitHub issue
- **Questions**: Ask in team chat

