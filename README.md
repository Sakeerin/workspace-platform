# All-in-One Workspace Platform

A Notion-like workspace platform built with modern web technologies. Create, collaborate, and organize your work in a flexible, block-based workspace.

## ✨ Features

- **📄 Block-Based Editor**: Rich text editing with multiple block types (paragraphs, headings, lists, code, etc.)
- **👥 Real-Time Collaboration**: Live cursors, presence indicators, and real-time updates via WebSocket
- **🗄️ Database Views**: Create databases with table, board, calendar, and gallery views
- **💬 Comments & Discussions**: Threaded comments with @mentions and notifications
- **🔍 Powerful Search**: Full-text search across pages, blocks, and databases
- **⭐ Favorites & Organization**: Bookmark pages, view recent pages, and navigate efficiently
- **🔐 Security**: JWT authentication, RBAC permissions, CSRF protection, input sanitization
- **⚡ Performance**: Redis caching, optimized queries, lazy loading, virtual scrolling

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS (Node.js 20+)
- **Language**: TypeScript 5.0+
- **Database**: PostgreSQL 16+ with Prisma ORM
- **Cache**: Redis 7.0+
- **Search**: Meilisearch
- **Real-time**: Socket.io with Redis adapter
- **File Storage**: MinIO (S3-compatible)

### Frontend
- **Framework**: React 18+ with TypeScript 5.0+
- **Build Tool**: Vite 5.0+
- **Styling**: Tailwind CSS 3.4+
- **UI Components**: shadcn/ui
- **Editor**: Lexical
- **State Management**: Zustand
- **Testing**: Vitest, Playwright

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 20+ LTS
- **PostgreSQL**: 16+
- **Redis**: 7.0+
- **Meilisearch**: Latest (optional for MVP)
- **Docker & Docker Compose**: (optional, for local development)

### Quick Start

#### Option 1: Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd workspace-platform
   ```

2. **Copy environment file**
   ```bash
   cp .env.example .env
   # Edit .env if needed (defaults work for development)
   ```

3. **Start all services with Docker**
   ```bash
   docker-compose up -d --build
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000/api/v1
   - MinIO Console: http://localhost:9001 (minioadmin/minioadmin)
   - Meilisearch: http://localhost:7700

   See [DOCKER_SETUP.md](./DOCKER_SETUP.md) for detailed Docker instructions.

#### Option 2: Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd workspace-platform
   ```

2. **Start infrastructure services** (using Docker Compose)
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```
   This starts PostgreSQL, Redis, MinIO, and Meilisearch.

3. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration:
   # DATABASE_URL=postgresql://user:password@localhost:5432/workspace_db
   # REDIS_URL=redis://localhost:6379
   # JWT_SECRET=your-secret-key
   npx prisma generate
   npx prisma migrate dev
   npm run start:dev
   ```
   Backend runs on `http://localhost:3000`

4. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your configuration:
   # VITE_API_URL=http://localhost:3000/api/v1
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000/api/v1
   - API Docs: http://localhost:3000/api-docs (if Swagger is configured)
   - Prisma Studio: `cd backend && npx prisma studio`

## 📚 Development

### Backend Commands
```bash
cd backend
npm run start:dev      # Start development server with hot reload
npm run build          # Build for production
npm run start:prod     # Start production server
npm run test           # Run unit tests
npm run test:integration # Run integration tests
npm run test:e2e       # Run E2E tests
npm run lint           # Lint code with ESLint
npm run format         # Format code with Prettier
npm run prisma:studio  # Open Prisma Studio
```

### Frontend Commands
```bash
cd frontend
npm run dev            # Start development server
npm run build          # Build for production
npm run preview        # Preview production build
npm run test           # Run unit tests with Vitest
npm run test:e2e       # Run E2E tests with Playwright
npm run lint           # Lint code
npm run format         # Format code
```

## 📁 Project Structure

```
workspace-platform/
├── backend/                 # NestJS backend application
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/     # API controllers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Data models
│   │   ├── repositories/   # Data access layer
│   │   ├── middlewares/     # Express/NestJS middlewares
│   │   ├── websocket/       # WebSocket handlers
│   │   └── utils/          # Utility functions
│   ├── prisma/             # Database schema and migrations
│   └── tests/              # Test files
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── store/          # Zustand state management
│   │   ├── services/       # API services
│   │   └── router/         # React Router configuration
│   └── tests/              # Test files
├── specs/                   # Technical specifications
│   └── 001-technical-spec/
│       ├── plan.md         # Implementation plan
│       ├── data-model.md   # Database schema
│       ├── contracts/      # API contracts (OpenAPI)
│       └── quickstart.md   # Quick start guide
├── docs/                    # Additional documentation
│   └── deployment.md       # Deployment guide
└── docker-compose.yml      # Local development infrastructure
```

## 🧪 Testing

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

### Test Coverage

- Target: > 80% code coverage
- Unit tests for all services and utilities
- Integration tests for all API endpoints
- E2E tests for critical user journeys

## 🔒 Security

- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Class-validator with DTOs
- **Input Sanitization**: DOMPurify for XSS prevention
- **CSRF Protection**: Double-submit cookie pattern
- **Rate Limiting**: Per-endpoint rate limits
- **Security Headers**: Helmet.js for HTTP headers

## 📖 Documentation

- **[Technical Specification](./specs/001-technical-spec/)** - Complete technical documentation
- **[Implementation Plan](./specs/001-technical-spec/plan.md)** - Development roadmap
- **[Database Schema](./specs/001-technical-spec/data-model.md)** - Complete database design
- **[API Documentation](./specs/001-technical-spec/contracts/openapi.yaml)** - OpenAPI 3.0 specification
- **[Quick Start Guide](./specs/001-technical-spec/quickstart.md)** - Developer quick start
- **[Deployment Guide](./docs/deployment.md)** - Production deployment instructions

## 🚢 Deployment

See [Deployment Guide](./docs/deployment.md) for detailed production deployment instructions.

### Quick Deployment (Docker)

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

UNLICENSED - All rights reserved

## 🙏 Acknowledgments

- Inspired by Notion's block-based architecture
- Built with modern web technologies
- Designed for scalability and performance

## 📞 Support

- **Documentation**: See `specs/` and `docs/` directories
- **Issues**: Create a GitHub issue
- **Questions**: Contact the development team

---

**Built with ❤️ using TypeScript, React, and NestJS**

