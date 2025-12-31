-- CreateEnum
CREATE TYPE "WorkspacePlan" AS ENUM ('free', 'personal', 'team', 'enterprise');

-- CreateEnum
CREATE TYPE "WorkspaceMemberRole" AS ENUM ('owner', 'admin', 'member', 'guest');

-- CreateEnum
CREATE TYPE "PageType" AS ENUM ('page', 'database');

-- CreateEnum
CREATE TYPE "DatabaseType" AS ENUM ('table', 'board', 'calendar', 'gallery', 'list', 'timeline');

-- CreateEnum
CREATE TYPE "PageVisibility" AS ENUM ('private', 'workspace', 'public');

-- CreateEnum
CREATE TYPE "PermissionType" AS ENUM ('view', 'comment', 'edit', 'full_access');

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "avatar_url" TEXT,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC',
    "locale" VARCHAR(10) NOT NULL DEFAULT 'en',
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "two_factor_secret" VARCHAR(255),
    "two_factor_recovery_codes" TEXT[],
    "email_verified_at" TIMESTAMP,
    "last_login_at" TIMESTAMP,
    "last_login_ip" INET,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "domain" VARCHAR(255),
    "icon" VARCHAR(50),
    "cover_image" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "plan" "WorkspacePlan" NOT NULL DEFAULT 'free',
    "plan_expires_at" TIMESTAMP,
    "max_members" INTEGER NOT NULL DEFAULT 10,
    "max_storage_gb" INTEGER NOT NULL DEFAULT 5,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" BIGSERIAL NOT NULL,
    "workspace_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "role" "WorkspaceMemberRole" NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "joined_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invited_by" BIGINT,
    "invitation_accepted_at" TIMESTAMP,
    "last_accessed_at" TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "workspace_id" BIGINT NOT NULL,
    "parent_id" BIGINT,
    "created_by" BIGINT NOT NULL,
    "last_edited_by" BIGINT NOT NULL,
    "title" VARCHAR(500) NOT NULL DEFAULT 'Untitled',
    "icon" VARCHAR(50),
    "cover_image" TEXT,
    "cover_position" VARCHAR(20) NOT NULL DEFAULT 'center',
    "content" JSONB NOT NULL DEFAULT '{}',
    "content_text" TEXT,
    "type" "PageType" NOT NULL DEFAULT 'page',
    "database_type" "DatabaseType",
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "visibility" "PageVisibility" NOT NULL DEFAULT 'workspace',
    "allow_comments" BOOLEAN NOT NULL DEFAULT true,
    "allow_duplicate" BOOLEAN NOT NULL DEFAULT true,
    "slug" VARCHAR(500),
    "meta_description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP,
    "archived_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocks" (
    "id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "page_id" BIGINT NOT NULL,
    "parent_block_id" BIGINT,
    "created_by" BIGINT NOT NULL,
    "last_edited_by" BIGINT NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "content" JSONB NOT NULL DEFAULT '{}',
    "content_text" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "databases" (
    "id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "page_id" BIGINT NOT NULL,
    "workspace_id" BIGINT NOT NULL,
    "title" VARCHAR(500),
    "description" TEXT,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "views" JSONB NOT NULL DEFAULT '[]',
    "default_view_id" VARCHAR(100),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,

    CONSTRAINT "databases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "database_rows" (
    "id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "database_id" BIGINT NOT NULL,
    "page_id" BIGINT,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "properties_text" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_by" BIGINT NOT NULL,
    "last_edited_by" BIGINT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,

    CONSTRAINT "database_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "page_id" BIGINT NOT NULL,
    "block_id" BIGINT,
    "parent_comment_id" BIGINT,
    "user_id" BIGINT NOT NULL,
    "content" TEXT NOT NULL,
    "mentions" JSONB NOT NULL DEFAULT '[]',
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_by" BIGINT,
    "resolved_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_versions" (
    "id" BIGSERIAL NOT NULL,
    "page_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "title" VARCHAR(500),
    "content" TEXT NOT NULL,
    "changes_summary" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_permissions" (
    "id" BIGSERIAL NOT NULL,
    "page_id" BIGINT NOT NULL,
    "user_id" BIGINT,
    "team_id" BIGINT,
    "permission_type" "PermissionType" NOT NULL,
    "granted_by" BIGINT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP,

    CONSTRAINT "page_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "workspace_id" BIGINT NOT NULL,
    "uploaded_by" BIGINT NOT NULL,
    "filename" VARCHAR(500) NOT NULL,
    "original_filename" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(255) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "storage_disk" VARCHAR(50) NOT NULL DEFAULT 's3',
    "width" INTEGER,
    "height" INTEGER,
    "page_id" BIGINT,
    "block_id" BIGINT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "public_url" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "page_id" BIGINT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" BIGSERIAL NOT NULL,
    "workspace_id" BIGINT NOT NULL,
    "user_id" BIGINT,
    "page_id" BIGINT,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" BIGINT,
    "details" JSONB NOT NULL DEFAULT '{}',
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "user_id" BIGINT NOT NULL,
    "workspace_id" BIGINT NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "message" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',
    "page_id" BIGINT,
    "triggered_by" BIGINT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_uuid_key" ON "users"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_uuid" ON "users"("uuid");

-- CreateIndex
CREATE INDEX "idx_users_active" ON "users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_uuid_key" ON "workspaces"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");

-- CreateIndex
CREATE INDEX "idx_workspaces_slug" ON "workspaces"("slug");

-- CreateIndex
CREATE INDEX "idx_workspaces_uuid" ON "workspaces"("uuid");

-- CreateIndex
CREATE INDEX "idx_workspaces_active" ON "workspaces"("is_active");

-- CreateIndex
CREATE INDEX "idx_workspace_members_workspace" ON "workspace_members"("workspace_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_workspace_members_user" ON "workspace_members"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_workspace_members_role" ON "workspace_members"("workspace_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_workspace_id_user_id_key" ON "workspace_members"("workspace_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "pages_uuid_key" ON "pages"("uuid");

-- CreateIndex
CREATE INDEX "idx_pages_workspace" ON "pages"("workspace_id", "is_archived", "deleted_at");

-- CreateIndex
CREATE INDEX "idx_pages_parent" ON "pages"("parent_id", "position");

-- CreateIndex
CREATE INDEX "idx_pages_uuid" ON "pages"("uuid");

-- CreateIndex
CREATE INDEX "idx_pages_type" ON "pages"("type", "workspace_id");

-- CreateIndex
CREATE INDEX "idx_pages_visibility" ON "pages"("visibility", "workspace_id");

-- CreateIndex
CREATE INDEX "idx_pages_created_by" ON "pages"("created_by");

-- CreateIndex
CREATE INDEX "idx_pages_updated_at" ON "pages"("workspace_id", "updated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "blocks_uuid_key" ON "blocks"("uuid");

-- CreateIndex
CREATE INDEX "idx_blocks_page" ON "blocks"("page_id", "parent_block_id", "position");

-- CreateIndex
CREATE INDEX "idx_blocks_parent" ON "blocks"("parent_block_id", "position");

-- CreateIndex
CREATE INDEX "idx_blocks_uuid" ON "blocks"("uuid");

-- CreateIndex
CREATE INDEX "idx_blocks_type" ON "blocks"("type", "page_id");

-- CreateIndex
CREATE INDEX "idx_blocks_updated_at" ON "blocks"("page_id", "updated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "databases_uuid_key" ON "databases"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "databases_page_id_key" ON "databases"("page_id");

-- CreateIndex
CREATE INDEX "idx_databases_page" ON "databases"("page_id");

-- CreateIndex
CREATE INDEX "idx_databases_workspace" ON "databases"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_databases_uuid" ON "databases"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "database_rows_uuid_key" ON "database_rows"("uuid");

-- CreateIndex
CREATE INDEX "idx_database_rows_database" ON "database_rows"("database_id", "position");

-- CreateIndex
CREATE INDEX "idx_database_rows_page" ON "database_rows"("page_id");

-- CreateIndex
CREATE INDEX "idx_database_rows_uuid" ON "database_rows"("uuid");

-- CreateIndex
CREATE INDEX "idx_database_rows_updated_at" ON "database_rows"("database_id", "updated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "comments_uuid_key" ON "comments"("uuid");

-- CreateIndex
CREATE INDEX "idx_comments_page" ON "comments"("page_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_comments_block" ON "comments"("block_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_comments_parent" ON "comments"("parent_comment_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_comments_user" ON "comments"("user_id");

-- CreateIndex
CREATE INDEX "idx_comments_uuid" ON "comments"("uuid");

-- CreateIndex
CREATE INDEX "idx_comments_resolved" ON "comments"("page_id", "is_resolved");

-- CreateIndex
CREATE INDEX "idx_page_versions_page" ON "page_versions"("page_id", "version_number" DESC);

-- CreateIndex
CREATE INDEX "idx_page_versions_user" ON "page_versions"("user_id");

-- CreateIndex
CREATE INDEX "idx_page_versions_created" ON "page_versions"("page_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "page_versions_page_id_version_number_key" ON "page_versions"("page_id", "version_number");

-- CreateIndex
CREATE INDEX "idx_page_permissions_page" ON "page_permissions"("page_id");

-- CreateIndex
CREATE INDEX "idx_page_permissions_user" ON "page_permissions"("user_id");

-- CreateIndex
CREATE INDEX "idx_page_permissions_type" ON "page_permissions"("page_id", "permission_type");

-- CreateIndex
CREATE UNIQUE INDEX "page_permissions_page_id_user_id_key" ON "page_permissions"("page_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "files_uuid_key" ON "files"("uuid");

-- CreateIndex
CREATE INDEX "idx_files_workspace" ON "files"("workspace_id", "deleted_at");

-- CreateIndex
CREATE INDEX "idx_files_uploaded_by" ON "files"("uploaded_by");

-- CreateIndex
CREATE INDEX "idx_files_page" ON "files"("page_id");

-- CreateIndex
CREATE INDEX "idx_files_block" ON "files"("block_id");

-- CreateIndex
CREATE INDEX "idx_files_uuid" ON "files"("uuid");

-- CreateIndex
CREATE INDEX "idx_files_mime_type" ON "files"("mime_type");

-- CreateIndex
CREATE INDEX "idx_files_public" ON "files"("is_public", "public_url");

-- CreateIndex
CREATE INDEX "idx_favorites_user" ON "favorites"("user_id", "position");

-- CreateIndex
CREATE INDEX "idx_favorites_page" ON "favorites"("page_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_page_id_key" ON "favorites"("user_id", "page_id");

-- CreateIndex
CREATE INDEX "idx_activity_logs_workspace" ON "activity_logs"("workspace_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_activity_logs_user" ON "activity_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_activity_logs_page" ON "activity_logs"("page_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_activity_logs_action" ON "activity_logs"("action", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_activity_logs_entity" ON "activity_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_uuid_key" ON "notifications"("uuid");

-- CreateIndex
CREATE INDEX "idx_notifications_user" ON "notifications"("user_id", "is_read", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_notifications_workspace" ON "notifications"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_notifications_page" ON "notifications"("page_id");

-- CreateIndex
CREATE INDEX "idx_notifications_uuid" ON "notifications"("uuid");

-- CreateIndex
CREATE INDEX "idx_notifications_unread" ON "notifications"("user_id", "is_read");

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_last_edited_by_fkey" FOREIGN KEY ("last_edited_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_parent_block_id_fkey" FOREIGN KEY ("parent_block_id") REFERENCES "blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_last_edited_by_fkey" FOREIGN KEY ("last_edited_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "databases" ADD CONSTRAINT "databases_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "databases" ADD CONSTRAINT "databases_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "database_rows" ADD CONSTRAINT "database_rows_database_id_fkey" FOREIGN KEY ("database_id") REFERENCES "databases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "database_rows" ADD CONSTRAINT "database_rows_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_versions" ADD CONSTRAINT "page_versions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_permissions" ADD CONSTRAINT "page_permissions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "blocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_triggered_by_fkey" FOREIGN KEY ("triggered_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
