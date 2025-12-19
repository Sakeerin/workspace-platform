# Data Model: All-in-One Workspace Platform

**Date**: 2025-01-27  
**Phase**: 1 - Design & Contracts

## Overview

This document defines the complete database schema for the All-in-One Workspace Platform. The schema uses PostgreSQL 16+ with a hybrid approach: relational tables for structure and relationships, JSONB columns for flexible block content.

## Database Design Principles

1. **Relational Structure**: Core entities (users, workspaces, pages) use relational design
2. **JSONB Flexibility**: Block content and properties stored as JSONB for flexibility
3. **Soft Deletes**: Most tables support soft deletes via `deleted_at` timestamp
4. **UUIDs**: Public-facing IDs use UUIDs for security
5. **Indexing**: Strategic indexes for performance (foreign keys, search, common queries)
6. **Full-Text Search**: Extracted text columns for full-text search indexing

## Core Tables

### users

User accounts and authentication information.

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en',
    preferences JSONB DEFAULT '{}',
    two_factor_secret VARCHAR(255),
    two_factor_recovery_codes TEXT[], -- Array of recovery codes
    email_verified_at TIMESTAMP,
    last_login_at TIMESTAMP,
    last_login_ip INET,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_uuid ON users(uuid);
CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;
```

**Fields**:
- `id`: Internal primary key
- `uuid`: Public-facing unique identifier
- `email`: Unique email address (indexed)
- `password_hash`: Bcrypt/Argon2 hashed password
- `preferences`: JSONB for user preferences (theme, editor settings, etc.)
- `two_factor_secret`: TOTP secret for 2FA
- `two_factor_recovery_codes`: Array of recovery codes

---

### workspaces

Workspace/organization containers.

```sql
CREATE TABLE workspaces (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    domain VARCHAR(255), -- Custom domain (optional)
    icon VARCHAR(50), -- Emoji or icon identifier
    cover_image TEXT,
    settings JSONB DEFAULT '{}',
    plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'personal', 'team', 'enterprise')),
    plan_expires_at TIMESTAMP,
    max_members INTEGER DEFAULT 10,
    max_storage_gb INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_workspaces_slug ON workspaces(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_workspaces_uuid ON workspaces(uuid);
CREATE INDEX idx_workspaces_active ON workspaces(is_active) WHERE deleted_at IS NULL;
```

**Fields**:
- `slug`: URL-friendly identifier (unique)
- `settings`: JSONB for workspace settings
- `plan`: Subscription plan type
- `max_members`: Maximum members allowed
- `max_storage_gb`: Storage limit in GB

---

### workspace_members

Many-to-many relationship between users and workspaces.

```sql
CREATE TABLE workspace_members (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'guest')),
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    invited_by BIGINT REFERENCES users(id),
    invitation_accepted_at TIMESTAMP,
    last_accessed_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- Indexes
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id, is_active);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id, is_active);
CREATE INDEX idx_workspace_members_role ON workspace_members(workspace_id, role) WHERE is_active = TRUE;
```

**Fields**:
- `role`: Member role (owner, admin, member, guest)
- `permissions`: JSONB for granular permissions override
- `invited_by`: User who sent the invitation
- `invitation_accepted_at`: When invitation was accepted

---

### pages

Pages and databases (hierarchical structure).

```sql
CREATE TABLE pages (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    parent_id BIGINT REFERENCES pages(id) ON DELETE SET NULL,
    created_by BIGINT NOT NULL REFERENCES users(id),
    last_edited_by BIGINT NOT NULL REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    icon VARCHAR(50),
    cover_image TEXT,
    cover_position VARCHAR(20) DEFAULT 'center', -- center, top, bottom
    content JSONB DEFAULT '{}', -- Full page content snapshot
    content_text TEXT, -- Plain text extraction for search
    type VARCHAR(50) NOT NULL DEFAULT 'page' CHECK (type IN ('page', 'database')),
    database_type VARCHAR(50) CHECK (database_type IN ('table', 'board', 'calendar', 'gallery', 'list', 'timeline')),
    is_template BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    visibility VARCHAR(50) DEFAULT 'workspace' CHECK (visibility IN ('private', 'workspace', 'public')),
    allow_comments BOOLEAN DEFAULT TRUE,
    allow_duplicate BOOLEAN DEFAULT TRUE,
    slug VARCHAR(500), -- For public pages
    meta_description TEXT,
    position INTEGER DEFAULT 0, -- For sidebar ordering
    published_at TIMESTAMP,
    archived_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_pages_workspace ON pages(workspace_id, is_archived, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_pages_parent ON pages(parent_id, position) WHERE deleted_at IS NULL;
CREATE INDEX idx_pages_uuid ON pages(uuid);
CREATE INDEX idx_pages_type ON pages(type, workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pages_visibility ON pages(visibility, workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pages_created_by ON pages(created_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_pages_updated_at ON pages(workspace_id, updated_at DESC) WHERE is_archived = FALSE AND deleted_at IS NULL;
CREATE INDEX idx_pages_slug ON pages(slug) WHERE slug IS NOT NULL AND deleted_at IS NULL;

-- Full-text search index
CREATE INDEX idx_pages_search ON pages USING GIN(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content_text, '')));
```

**Fields**:
- `parent_id`: Self-referential for hierarchical pages
- `content`: JSONB for full page content (snapshot)
- `content_text`: Plain text extraction for full-text search
- `type`: 'page' or 'database'
- `database_type`: View type for databases
- `visibility`: Access control level
- `position`: Order within parent (for sidebar)

---

### blocks

Content blocks within pages (nested structure).

```sql
CREATE TABLE blocks (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    page_id BIGINT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    parent_block_id BIGINT REFERENCES blocks(id) ON DELETE CASCADE,
    created_by BIGINT NOT NULL REFERENCES users(id),
    last_edited_by BIGINT NOT NULL REFERENCES users(id),
    type VARCHAR(100) NOT NULL, -- paragraph, heading1-6, list, todo, quote, callout, code, image, etc.
    content JSONB DEFAULT '{}', -- Block content and properties
    content_text TEXT, -- Plain text extraction for search
    position INTEGER NOT NULL DEFAULT 0, -- Order within parent
    depth INTEGER NOT NULL DEFAULT 0, -- Nesting level
    properties JSONB DEFAULT '{}', -- color, alignment, language, etc.
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_blocks_page ON blocks(page_id, parent_block_id, position) WHERE deleted_at IS NULL;
CREATE INDEX idx_blocks_parent ON blocks(parent_block_id, position) WHERE deleted_at IS NULL;
CREATE INDEX idx_blocks_uuid ON blocks(uuid);
CREATE INDEX idx_blocks_type ON blocks(type, page_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_blocks_updated_at ON blocks(page_id, updated_at DESC) WHERE deleted_at IS NULL;

-- Full-text search index
CREATE INDEX idx_blocks_search ON blocks USING GIN(to_tsvector('english', COALESCE(content_text, '')));
```

**Fields**:
- `parent_block_id`: Self-referential for nested blocks
- `content`: JSONB for block-specific content
- `content_text`: Plain text for search
- `position`: Order within parent block
- `depth`: Nesting depth (0 = top level)
- `properties`: JSONB for formatting properties

**Block Types**:
- `paragraph`, `heading1`, `heading2`, `heading3`, `heading4`, `heading5`, `heading6`
- `bullet_list`, `numbered_list`, `todo`, `toggle`
- `quote`, `callout`, `code`, `divider`
- `image`, `video`, `embed`, `file`
- `table`, `database_view`

---

### databases

Database definitions (linked to pages).

```sql
CREATE TABLE databases (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    page_id BIGINT NOT NULL UNIQUE REFERENCES pages(id) ON DELETE CASCADE,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(500),
    description TEXT,
    properties JSONB DEFAULT '{}', -- Database schema/columns definition
    views JSONB DEFAULT '[]', -- Different view configurations
    default_view_id VARCHAR(100), -- ID of default view
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_databases_page ON databases(page_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_databases_workspace ON databases(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_databases_uuid ON databases(uuid);
```

**Fields**:
- `properties`: JSONB schema definition (property types, names, etc.)
- `views`: JSONB array of view configurations (table, board, calendar, etc.)
- `default_view_id`: Which view to show by default

**Properties Schema Example**:
```json
{
  "title": { "type": "title", "name": "Name" },
  "status": { "type": "select", "name": "Status", "options": ["Todo", "In Progress", "Done"] },
  "assignee": { "type": "person", "name": "Assignee" },
  "due_date": { "type": "date", "name": "Due Date" }
}
```

---

### database_rows

Rows/entries in databases.

```sql
CREATE TABLE database_rows (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    database_id BIGINT NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
    page_id BIGINT REFERENCES pages(id) ON DELETE SET NULL, -- For full-page databases
    properties JSONB DEFAULT '{}', -- Row data
    properties_text TEXT, -- Searchable text extraction
    position INTEGER DEFAULT 0,
    created_by BIGINT NOT NULL REFERENCES users(id),
    last_edited_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_database_rows_database ON database_rows(database_id, position) WHERE deleted_at IS NULL;
CREATE INDEX idx_database_rows_page ON database_rows(page_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_database_rows_uuid ON database_rows(uuid);
CREATE INDEX idx_database_rows_updated_at ON database_rows(database_id, updated_at DESC) WHERE deleted_at IS NULL;

-- Full-text search index
CREATE INDEX idx_database_rows_search ON database_rows USING GIN(to_tsvector('english', COALESCE(properties_text, '')));
```

**Fields**:
- `properties`: JSONB row data matching database schema
- `properties_text`: Plain text extraction for search
- `page_id`: Optional link to full-page database entry

---

### comments

Comments and threaded discussions.

```sql
CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    page_id BIGINT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    block_id BIGINT REFERENCES blocks(id) ON DELETE CASCADE,
    parent_comment_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mentions JSONB DEFAULT '[]', -- Array of user IDs mentioned
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by BIGINT REFERENCES users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_comments_page ON comments(page_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_block ON comments(block_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_parent ON comments(parent_comment_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_user ON comments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_uuid ON comments(uuid);
CREATE INDEX idx_comments_resolved ON comments(page_id, is_resolved) WHERE deleted_at IS NULL;
```

**Fields**:
- `block_id`: Optional link to specific block
- `parent_comment_id`: For threaded comments
- `mentions`: JSONB array of mentioned user IDs
- `is_resolved`: Whether comment is resolved

---

### page_versions

Version history for pages.

```sql
CREATE TABLE page_versions (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    version_number INTEGER NOT NULL,
    title VARCHAR(500),
    content LONGTEXT, -- JSON or text snapshot
    changes_summary TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(page_id, version_number)
);

-- Indexes
CREATE INDEX idx_page_versions_page ON page_versions(page_id, version_number DESC);
CREATE INDEX idx_page_versions_user ON page_versions(user_id);
CREATE INDEX idx_page_versions_created ON page_versions(page_id, created_at DESC);
```

**Fields**:
- `version_number`: Sequential version number
- `content`: Full page snapshot (JSON or text)
- `changes_summary`: Human-readable summary of changes

---

### page_permissions

Page-level access control.

```sql
CREATE TABLE page_permissions (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    team_id BIGINT, -- For future team feature
    permission_type VARCHAR(50) NOT NULL CHECK (permission_type IN ('view', 'comment', 'edit', 'full_access')),
    granted_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,
    UNIQUE(page_id, user_id)
);

-- Indexes
CREATE INDEX idx_page_permissions_page ON page_permissions(page_id);
CREATE INDEX idx_page_permissions_user ON page_permissions(user_id);
CREATE INDEX idx_page_permissions_type ON page_permissions(page_id, permission_type);
```

**Fields**:
- `permission_type`: Access level (view, comment, edit, full_access)
- `expires_at`: Optional expiration date

---

### files

File attachments and media.

```sql
CREATE TABLE files (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    uploaded_by BIGINT NOT NULL REFERENCES users(id),
    filename VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    storage_disk VARCHAR(50) DEFAULT 's3', -- s3, local, etc.
    width INTEGER, -- For images
    height INTEGER, -- For images
    page_id BIGINT REFERENCES pages(id) ON DELETE SET NULL,
    block_id BIGINT REFERENCES blocks(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT FALSE,
    public_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_files_workspace ON files(workspace_id, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_page ON files(page_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_block ON files(block_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_uuid ON files(uuid);
CREATE INDEX idx_files_mime_type ON files(mime_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_public ON files(is_public, public_url) WHERE is_public = TRUE AND deleted_at IS NULL;
```

**Fields**:
- `storage_path`: Path in storage backend
- `storage_disk`: Storage backend identifier
- `width`/`height`: Image dimensions
- `is_public`: Whether file is publicly accessible
- `public_url`: Public URL if is_public = true

---

### favorites

User favorites/bookmarks.

```sql
CREATE TABLE favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    page_id BIGINT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, page_id)
);

-- Indexes
CREATE INDEX idx_favorites_user ON favorites(user_id, position);
CREATE INDEX idx_favorites_page ON favorites(page_id);
```

---

### activity_logs

Audit trail and activity tracking.

```sql
CREATE TABLE activity_logs (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    page_id BIGINT REFERENCES pages(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- created, updated, deleted, shared, etc.
    entity_type VARCHAR(100) NOT NULL, -- page, block, comment, etc.
    entity_id BIGINT,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activity_logs_workspace ON activity_logs(workspace_id, created_at DESC);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_logs_page ON activity_logs(page_id, created_at DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs(action, created_at DESC);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
```

**Fields**:
- `action`: Action type (created, updated, deleted, shared, etc.)
- `entity_type`: Type of entity (page, block, comment, etc.)
- `entity_id`: ID of affected entity
- `details`: JSONB for additional context

---

### notifications

User notifications.

```sql
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- mention, comment, share, etc.
    title VARCHAR(500) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    page_id BIGINT REFERENCES pages(id) ON DELETE SET NULL,
    triggered_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_workspace ON notifications(workspace_id);
CREATE INDEX idx_notifications_page ON notifications(page_id);
CREATE INDEX idx_notifications_uuid ON notifications(uuid);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
```

**Fields**:
- `type`: Notification type (mention, comment, share, etc.)
- `data`: JSONB for additional notification data
- `triggered_by`: User who triggered the notification
- `is_read`: Read status

---

## Additional Tables (Future)

### teams

For team/group features (future).

```sql
CREATE TABLE teams (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);
```

### tags

Tagging system (future).

```sql
CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7), -- Hex color
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, name)
);
```

### sessions

Active user sessions (for session-based auth alternative).

```sql
CREATE TABLE sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## Relationships Summary

```
users
  ├── workspace_members (many-to-many with workspaces)
  ├── pages (created_by, last_edited_by)
  ├── blocks (created_by, last_edited_by)
  ├── comments (user_id)
  ├── files (uploaded_by)
  └── notifications (user_id, triggered_by)

workspaces
  ├── workspace_members (many-to-many with users)
  ├── pages
  ├── databases
  ├── files
  ├── activity_logs
  └── notifications

pages
  ├── parent_id (self-referential, hierarchical)
  ├── blocks (one-to-many)
  ├── databases (one-to-one)
  ├── comments (one-to-many)
  ├── page_versions (one-to-many)
  ├── page_permissions (one-to-many)
  ├── favorites (many-to-many with users)
  └── files (optional link)

blocks
  ├── parent_block_id (self-referential, nested)
  └── comments (optional link)

databases
  ├── database_rows (one-to-many)
  └── page_id (one-to-one with pages)

comments
  └── parent_comment_id (self-referential, threaded)
```

---

## Indexing Strategy

### Performance Indexes
- Foreign key indexes for all relationships
- Composite indexes for common query patterns
- Partial indexes for active/non-deleted records
- Full-text search indexes (GIN) for searchable text

### Query Optimization
- Use `EXPLAIN ANALYZE` to verify index usage
- Monitor slow queries
- Consider materialized views for complex aggregations
- Use connection pooling (PgBouncer)

---

## Migration Strategy

1. **Initial Migration**: Create all core tables
2. **Indexes**: Add indexes after data migration (faster)
3. **Constraints**: Add foreign keys and checks
4. **Full-Text Search**: Create search indexes
5. **Data Seeding**: Seed initial data (templates, default workspaces)

---

## Data Retention & Cleanup

- **Soft Deletes**: Most tables use `deleted_at` for soft deletes
- **Hard Delete**: Run cleanup job to permanently delete records older than 90 days
- **Archive**: Archive old activity logs and versions (move to archive tables)
- **GDPR**: Support data export and deletion per user request

