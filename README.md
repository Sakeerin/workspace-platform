# All-in-One Workspace Platform

A Notion-like workspace platform built with modern web technologies.

## Tech Stack

### Backend
- **Framework**: NestJS (Node.js 20+)
- **Language**: TypeScript 5.0+
- **Database**: PostgreSQL 16+ with Prisma ORM
- **Cache**: Redis 7.0+
- **Search**: Meilisearch
- **Real-time**: Socket.io
- **File Storage**: MinIO (S3-compatible)

### Frontend
- **Framework**: React 18+ with TypeScript 5.0+
- **Build Tool**: Vite 5.0+
- **Styling**: Tailwind CSS 3.4+
- **UI Components**: shadcn/ui
- **Editor**: Lexical
- **State Management**: Zustand
- **Testing**: Vitest, Playwright

## Getting Started

### Prerequisites

- Node.js 20+ LTS
- PostgreSQL 16+
- Redis 7.0+
- Docker & Docker Compose (optional, for local development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd workspace-platform
   ```

2. **Start infrastructure services** (using Docker Compose)
   ```bash
   docker-compose up -d
   ```

3. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npx prisma generate
   npx prisma migrate dev
   npm run start:dev
   ```

4. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Prisma Studio: `cd backend && npx prisma studio`

## Development

### Backend Commands
```bash
cd backend
npm run start:dev    # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Lint code
npm run format       # Format code
```

### Frontend Commands
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
npm run lint         # Lint code
npm run format       # Format code
```

## Project Structure

```
workspace-platform/
├── backend/          # NestJS backend application
│   ├── src/         # Source code
│   ├── prisma/      # Database schema and migrations
│   └── tests/       # Test files
├── frontend/         # React frontend application
│   ├── src/         # Source code
│   └── tests/       # Test files
├── specs/           # Technical specifications
└── docker-compose.yml  # Local development infrastructure
```

## Documentation

- [Technical Specification](./specs/001-technical-spec/)
- [Implementation Plan](./specs/001-technical-spec/plan.md)
- [Database Schema](./specs/001-technical-spec/data-model.md)
- [API Documentation](./specs/001-technical-spec/contracts/openapi.yaml)
- [Quick Start Guide](./specs/001-technical-spec/quickstart.md)

## License

UNLICENSED

