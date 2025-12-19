# Research: All-in-One Workspace Platform Technical Specification

**Date**: 2025-01-27  
**Phase**: 0 - Research & Decision Making

## Research Areas

### 1. Conflict Resolution Strategy for Real-Time Collaboration

**Decision**: Use CRDT (Conflict-free Replicated Data Types) for block-level conflict resolution

**Rationale**:
- CRDT provides automatic conflict resolution without requiring operational transforms
- Better suited for block-based architecture where blocks can be independently modified
- Lower latency compared to Operational Transform (OT)
- Proven in production (used by Notion, Figma)
- Supports offline-first scenarios

**Alternatives Considered**:
- **Operational Transform (OT)**: More complex, requires central coordination, higher latency
- **Last-Write-Wins**: Too simplistic, loses user data
- **Manual Conflict Resolution**: Poor UX, not scalable

**Implementation Approach**:
- Use Yjs or Automerge library for CRDT implementation
- Each block is a CRDT document
- Page-level merging of block CRDTs
- Client-side conflict resolution with server sync

**References**:
- Yjs: https://github.com/yjs/yjs
- Automerge: https://github.com/automerge/automerge
- CRDT Research Papers

---

### 2. Database Schema Design: JSON vs Relational for Block Content

**Decision**: Hybrid approach - Relational tables for metadata, JSON columns for block content

**Rationale**:
- Blocks have variable structure (different types have different properties)
- JSON provides flexibility for block properties and content
- Relational structure for queries, relationships, and indexing
- PostgreSQL JSONB provides indexing and querying capabilities
- Best of both worlds: structure + flexibility

**Alternatives Considered**:
- **Pure Relational**: Too rigid, requires many nullable columns, complex schema
- **Pure Document Store (MongoDB)**: Loses relational benefits, harder to query across blocks
- **Graph Database**: Overkill for this use case, adds complexity

**Implementation Approach**:
- Core tables: `pages`, `blocks`, `databases`, `database_rows` (relational)
- `blocks.content` and `blocks.properties` as JSONB columns
- `pages.content` as JSONB for full page snapshot
- Full-text search on extracted text columns (`content_text`)
- Indexes on JSONB paths for common queries

**PostgreSQL Features Used**:
- JSONB data type
- GIN indexes for JSONB
- Full-text search (tsvector, tsquery)
- Partial indexes for archived/deleted records

---

### 3. Search Engine Selection: Elasticsearch vs Meilisearch vs Typesense

**Decision**: Start with Meilisearch, plan for Elasticsearch migration if needed

**Rationale**:
- **Meilisearch**: 
  - Simpler setup and maintenance
  - Fast typo tolerance and instant search
  - Good for full-text search use case
  - Lower resource requirements
  - Good documentation and developer experience
- **Elasticsearch**: 
  - More powerful but complex
  - Better for advanced analytics and large-scale
  - Higher resource requirements
  - Overkill for initial implementation

**Alternatives Considered**:
- **PostgreSQL Full-Text Search**: Good for basic search, but limited for advanced features (fuzzy search, typo tolerance)
- **Typesense**: Similar to Meilisearch, but smaller community
- **Algolia**: Commercial, expensive at scale

**Implementation Approach**:
- Use Meilisearch for MVP and initial launch
- Design search service with abstraction layer
- Can swap to Elasticsearch later without major refactoring
- Index pages, blocks, and database rows
- Real-time indexing via event listeners

**Migration Path**:
- Search service interface abstracts implementation
- Can add Elasticsearch adapter later
- Data model designed to support both

---

### 4. File Storage Strategy: S3 vs MinIO vs Cloudflare R2

**Decision**: Support multiple storage backends with abstraction layer, default to MinIO for development, S3 for production

**Rationale**:
- **MinIO**: 
  - S3-compatible API
  - Good for local development and testing
  - Free and open-source
- **AWS S3**: 
  - Industry standard
  - Reliable and scalable
  - Good for production
- **Cloudflare R2**: 
  - No egress fees
  - S3-compatible
  - Good alternative to S3

**Implementation Approach**:
- Storage service abstraction layer
- Support multiple backends via adapters
- Configuration-based selection
- Consistent API across backends

**Alternatives Considered**:
- **Local File System**: Not scalable, not suitable for production
- **Database BLOBs**: Poor performance, expensive storage
- **Single Provider Lock-in**: Reduces flexibility

---

### 5. WebSocket Architecture: Socket.io vs Native WebSocket

**Decision**: Use Socket.io with Redis adapter for horizontal scaling

**Rationale**:
- **Socket.io Benefits**:
  - Automatic reconnection handling
  - Room/channel management
  - Fallback to polling if WebSocket unavailable
  - Built-in authentication middleware
  - Redis adapter for multi-server support
- **Native WebSocket**: 
  - More control but requires custom implementation
  - No built-in reconnection
  - More code to maintain

**Implementation Approach**:
- Socket.io server with Redis adapter
- Room-based architecture (workspace rooms, page rooms)
- Presence tracking via Redis
- Message broadcasting via Redis pub/sub
- Connection management and cleanup

**Scaling Considerations**:
- Redis adapter enables horizontal scaling
- Multiple server instances can share connections
- Load balancer with sticky sessions (optional)
- Connection limits per server instance

---

### 6. State Management: Zustand vs Redux vs Jotai

**Decision**: Use Zustand for state management

**Rationale**:
- **Zustand Benefits**:
  - Simple API, less boilerplate than Redux
  - TypeScript-first design
  - Good performance (minimal re-renders)
  - Small bundle size
  - Easy to learn and use
- **Redux**: Too much boilerplate, overkill for this use case
- **Jotai**: Atomic state is interesting but adds complexity

**Implementation Approach**:
- Separate stores for: auth, workspace, pages, editor, presence
- Middleware for persistence (localStorage)
- DevTools integration for debugging
- Type-safe stores with TypeScript

---

### 7. Rich Text Editor: Lexical vs TipTap vs Slate.js

**Decision**: Use Lexical (Meta's editor framework)

**Rationale**:
- **Lexical Benefits**:
  - Modern, actively maintained by Meta
  - Framework-agnostic (works with React)
  - Excellent performance
  - Extensible plugin system
  - Good TypeScript support
  - Built for collaborative editing
- **TipTap**: Good but ProseMirror-based (more complex)
- **Slate.js**: Older, less active development

**Implementation Approach**:
- Lexical editor for block content
- Custom nodes for each block type
- Collaborative editing via Yjs integration
- Slash commands and keyboard shortcuts
- Markdown import/export

---

### 8. API Design: REST vs GraphQL vs tRPC

**Decision**: Start with RESTful API, consider GraphQL for complex queries later

**Rationale**:
- **REST Benefits**:
  - Simple and familiar
  - Easy to document (OpenAPI/Swagger)
  - Good caching support
  - Standard HTTP methods
  - Easy to test
- **GraphQL**: 
  - Good for complex queries
  - Overkill for initial implementation
  - Can add later if needed
- **tRPC**: 
  - Type-safe but requires TypeScript on both ends
  - Less standard, smaller ecosystem

**Implementation Approach**:
- RESTful API with OpenAPI documentation
- Consistent error handling
- API versioning (v1, v2)
- Consider GraphQL for admin/internal APIs later
- Webhooks for integrations

---

### 9. Authentication Strategy: JWT vs Session-based

**Decision**: Use JWT with refresh tokens

**Rationale**:
- **JWT Benefits**:
  - Stateless (scales horizontally)
  - Works well with microservices
  - Standard and widely supported
  - Can include user claims
- **Session-based**: 
  - Requires session storage (Redis)
  - More complex for horizontal scaling
  - Better for security-sensitive apps (can revoke immediately)

**Implementation Approach**:
- JWT access tokens (short-lived: 15 minutes)
- Refresh tokens (long-lived: 7 days, stored in httpOnly cookie)
- Token rotation on refresh
- Blacklist for revoked tokens (Redis)
- OAuth 2.0 for third-party auth

**Security Considerations**:
- Store refresh tokens securely (httpOnly, Secure, SameSite)
- Implement token blacklisting for logout
- Rate limiting on auth endpoints
- 2FA support (TOTP)

---

### 10. Caching Strategy: Multi-Level Caching

**Decision**: Implement L1 (browser), L2 (CDN), L3 (Redis), L4 (database query cache)

**Rationale**:
- **L1 (Browser Cache)**: 
  - Static assets, API responses
  - Reduces server load
- **L2 (CDN)**: 
  - Global distribution
  - Fast static asset delivery
- **L3 (Redis)**: 
  - Frequently accessed data
  - Session storage
  - Real-time data
- **L4 (Database Query Cache)**: 
  - Expensive queries
  - Read-heavy workloads

**Implementation Approach**:
- Browser: HTTP cache headers, service worker
- CDN: Cloudflare for static assets
- Redis: Page metadata, user sessions, frequently accessed blocks
- Database: Query result caching (PostgreSQL + application layer)

**Cache Invalidation**:
- Event-driven invalidation
- TTL-based expiration
- Manual invalidation on updates
- Cache tags for related data

---

## Technology Decisions Summary

| Area | Decision | Rationale |
|------|----------|-----------|
| Conflict Resolution | CRDT (Yjs/Automerge) | Automatic resolution, better UX |
| Database Schema | Hybrid (Relational + JSONB) | Flexibility + queryability |
| Search Engine | Meilisearch (with Elasticsearch option) | Simpler, can upgrade later |
| File Storage | Multi-backend (MinIO/S3/R2) | Flexibility, avoid lock-in |
| WebSocket | Socket.io + Redis | Easy scaling, built-in features |
| State Management | Zustand | Simple, performant, TypeScript-first |
| Rich Text Editor | Lexical | Modern, extensible, collaborative-ready |
| API Design | RESTful (GraphQL optional) | Standard, easy to document |
| Authentication | JWT + Refresh Tokens | Stateless, scalable |
| Caching | Multi-level (L1-L4) | Optimal performance |

---

## Open Questions / Future Research

1. **Database Sharding Strategy**: When to implement? How to shard by workspace?
2. **CDN Strategy**: Which CDN provider? How to handle dynamic content?
3. **Monitoring Stack**: Prometheus + Grafana setup details
4. **CI/CD Pipeline**: GitHub Actions workflow details
5. **Load Testing**: Tools and strategies for testing at scale

---

## Next Steps

1. ✅ Conflict resolution strategy decided
2. ✅ Database schema approach decided
3. ✅ Technology stack finalized
4. ⏭️ Proceed to Phase 1: Data Model Design

