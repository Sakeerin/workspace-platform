# Architecture Overview

This document summarizes the current implementation shape of the Workspace Platform.

## Runtime Topology

```mermaid
flowchart LR
  Browser[React + Vite frontend]
  API[NestJS API]
  WS[Socket.IO realtime]
  Postgres[(PostgreSQL)]
  Redis[(Redis)]
  Meili[(Meilisearch)]
  MinIO[(MinIO)]

  Browser -->|REST /api/v1| API
  Browser -->|WebSocket| WS
  API --> Postgres
  API --> Redis
  API --> Meili
  API --> MinIO
  WS --> Redis
  WS --> Postgres
```

## Backend Module Boundaries

```mermaid
flowchart TD
  Controllers[HTTP controllers]
  Services[Domain services]
  Repositories[Repositories]
  Prisma[Prisma client]
  WebSocket[Realtime handlers]
  Permission[PermissionService]

  Controllers --> Services
  Services --> Repositories
  Repositories --> Prisma
  WebSocket --> Permission
  WebSocket --> Repositories
  Services --> Permission
```

## Authentication Flow

```mermaid
sequenceDiagram
  participant Client
  participant API
  participant AuthService

  Client->>API: POST /auth/login
  API->>AuthService: validate credentials
  AuthService-->>API: user + access/refresh tokens
  API-->>Client: tokens
  Client->>API: API request with access token
  API-->>Client: 401 when token expires
  Client->>API: POST /auth/refresh
  API-->>Client: new token pair
  Client->>API: retry original request
```

## Notes

- WebSocket page events must pass the same workspace membership checks as HTTP page operations.
- OpenAPI is maintained under `specs/001-technical-spec/contracts/openapi.yaml`.
- Database and search endpoints are part of the current REST surface; notifications are currently domain-service only and not exposed as REST endpoints.
