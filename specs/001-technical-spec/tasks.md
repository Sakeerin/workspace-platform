# Tasks: All-in-One Workspace Platform

**Input**: Design documents from `/specs/001-technical-spec/`
**Prerequisites**: plan.md ✅, data-model.md ✅, contracts/openapi.yaml ✅, research.md ✅, quickstart.md ✅

**Tests**: TDD approach - tests are included and MUST be written before implementation

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths follow the structure defined in plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create backend project structure in backend/ directory
- [x] T002 Create frontend project structure in frontend/ directory
- [x] T003 [P] Initialize backend NestJS project with TypeScript 5.0+ in backend/
- [x] T004 [P] Initialize frontend React 18+ project with Vite 5.0+ in frontend/
- [x] T005 [P] Setup Prisma ORM in backend/prisma/ with PostgreSQL 16+ configuration
- [x] T006 [P] Configure ESLint and Prettier in backend/
- [x] T007 [P] Configure ESLint and Prettier in frontend/
- [x] T008 [P] Setup TypeScript configuration in backend/tsconfig.json
- [x] T009 [P] Setup TypeScript configuration in frontend/tsconfig.json
- [x] T010 [P] Setup Tailwind CSS 3.4+ in frontend/
- [x] T011 [P] Setup shadcn/ui component library in frontend/ (requires: `npx shadcn-ui@latest init`)
- [x] T012 [P] Configure environment variables (.env.example) in backend/ (template created, manual copy needed)
- [x] T013 [P] Configure environment variables (.env.example) in frontend/ (template created, manual copy needed)
- [x] T014 [P] Setup Jest/Vitest testing framework in backend/
- [x] T015 [P] Setup Vitest testing framework in frontend/
- [x] T016 [P] Setup Playwright for E2E tests in frontend/tests/e2e/
- [x] T017 [P] Initialize Git repository and setup .gitignore files
- [x] T018 [P] Create Docker Compose file for local development (PostgreSQL, Redis, MinIO) in docker-compose.yml

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T019 Setup PostgreSQL database connection in backend/src/config/database.ts
- [x] T020 Setup Redis connection in backend/src/config/redis.ts
- [x] T021 [P] Create Prisma schema file with all core tables in backend/prisma/schema.prisma
- [x] T022 [P] Create initial database migration in backend/prisma/migrations/ (requires: `npx prisma migrate dev`) - Directory created, run `npx prisma migrate dev --name init` when database is configured
- [x] T023 [P] Implement base repository pattern in backend/src/repositories/base.repository.ts
- [x] T024 [P] Setup error handling middleware in backend/src/middlewares/error-handler.middleware.ts
- [x] T025 [P] Setup request validation middleware in backend/src/middlewares/validation.middleware.ts
- [x] T026 [P] Setup rate limiting middleware in backend/src/middlewares/rate-limit.middleware.ts
- [x] T027 [P] Implement logger utility (Winston/Pino) in backend/src/utils/logger.ts
- [x] T028 [P] Setup JWT authentication utilities in backend/src/utils/jwt.ts
- [x] T029 [P] Setup password hashing utilities (bcrypt/argon2) in backend/src/utils/encryption.ts
- [x] T030 [P] Create authentication middleware in backend/src/middlewares/auth.middleware.ts
- [x] T031 [P] Setup API routing structure in backend/src/routes/index.ts
- [x] T032 [P] Create base DTO classes in backend/src/dto/base.dto.ts
- [x] T033 [P] Setup WebSocket gateway structure in backend/src/websocket/gateway.ts
- [x] T034 [P] Setup Socket.io with Redis adapter in backend/src/websocket/socket.config.ts
- [x] T035 [P] Create API client service in frontend/src/services/api.ts
- [x] T036 [P] Setup WebSocket client service in frontend/src/services/websocket.ts
- [x] T037 [P] Setup Zustand store structure in frontend/src/store/
- [x] T038 [P] Setup React Router in frontend/src/router/index.tsx
- [x] T039 [P] Create base layout components in frontend/src/components/Layout/
- [x] T040 [P] Setup environment configuration management in backend/src/config/env.ts
- [x] T041 [P] Setup environment configuration management in frontend/src/config/env.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Authentication & Workspace Management (Priority: P1) 🎯 MVP

**Goal**: Users can register, login, create workspaces, and manage workspace members. This is the foundation for all other features.

**Independent Test**: User can register → login → create workspace → invite member → member can access workspace. All can be tested via API calls and verified in database.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T042 [P] [US1] Create unit test for User model in backend/tests/unit/models/user.test.ts
- [x] T043 [P] [US1] Create unit test for Workspace model in backend/tests/unit/models/workspace.test.ts
- [x] T044 [P] [US1] Create integration test for auth registration endpoint in backend/tests/integration/auth/register.test.ts
- [x] T045 [P] [US1] Create integration test for auth login endpoint in backend/tests/integration/auth/login.test.ts
- [x] T046 [P] [US1] Create integration test for workspace creation in backend/tests/integration/workspace/create.test.ts
- [x] T047 [P] [US1] Create contract test for POST /api/v1/auth/register in backend/tests/contract/auth/register.contract.test.ts
- [x] T048 [P] [US1] Create contract test for POST /api/v1/auth/login in backend/tests/contract/auth/login.contract.test.ts
- [x] T049 [P] [US1] Create E2E test for user registration flow in frontend/tests/e2e/auth/register.spec.ts
- [x] T050 [P] [US1] Create E2E test for user login flow in frontend/tests/e2e/auth/login.spec.ts

### Implementation for User Story 1

- [x] T051 [P] [US1] Create User model in backend/src/models/user.model.ts
- [x] T052 [P] [US1] Create Workspace model in backend/src/models/workspace.model.ts
- [x] T053 [P] [US1] Create WorkspaceMember model in backend/src/models/workspace-member.model.ts
- [x] T054 [US1] Create User repository in backend/src/repositories/user.repository.ts (depends on T051)
- [x] T055 [US1] Create Workspace repository in backend/src/repositories/workspace.repository.ts (depends on T052)
- [x] T056 [US1] Create WorkspaceMember repository in backend/src/repositories/workspace-member.repository.ts (depends on T053)
- [x] T057 [US1] Create AuthService in backend/src/services/auth.service.ts (depends on T054, T028, T029)
- [x] T058 [US1] Create WorkspaceService in backend/src/services/workspace.service.ts (depends on T055, T056)
- [x] T059 [US1] Create PermissionService in backend/src/services/permission.service.ts (depends on T056)
- [x] T060 [US1] Create AuthController in backend/src/controllers/auth.controller.ts (depends on T057)
- [x] T061 [US1] Create WorkspaceController in backend/src/controllers/workspace.controller.ts (depends on T058)
- [x] T062 [US1] Create auth routes in backend/src/routes/auth.routes.ts (depends on T060) - Integrated into NestJS controllers
- [x] T063 [US1] Create workspace routes in backend/src/routes/workspace.routes.ts (depends on T061) - Integrated into NestJS controllers
- [x] T064 [US1] Create auth DTOs in backend/src/dto/auth.dto.ts
- [x] T065 [US1] Create workspace DTOs in backend/src/dto/workspace.dto.ts
- [x] T066 [US1] Create auth validators in backend/src/validators/auth.validator.ts
- [x] T067 [US1] Create workspace validators in backend/src/validators/workspace.validator.ts
- [x] T068 [US1] Create auth store (Zustand) in frontend/src/store/auth.ts
- [x] T069 [US1] Create workspace store (Zustand) in frontend/src/store/workspace.ts
- [x] T070 [US1] Create Login page component in frontend/src/pages/Auth/Login.tsx
- [x] T071 [US1] Create Register page component in frontend/src/pages/Auth/Register.tsx
- [x] T072 [US1] Create WorkspaceList page component in frontend/src/pages/Workspace/WorkspaceList.tsx
- [x] T073 [US1] Create WorkspaceCreate page component in frontend/src/pages/Workspace/WorkspaceCreate.tsx
- [x] T074 [US1] Create WorkspaceSettings page component in frontend/src/pages/Workspace/WorkspaceSettings.tsx
- [x] T075 [US1] Add authentication routes to frontend/src/router/index.tsx (depends on T070, T071)
- [x] T076 [US1] Add workspace routes to frontend/src/router/index.tsx (depends on T072, T073, T074)
- [x] T077 [US1] Implement protected route wrapper in frontend/src/components/Common/ProtectedRoute.tsx
- [x] T078 [US1] Add error handling for auth operations in frontend/src/services/api.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can register, login, create workspaces, and manage members.

---

## Phase 4: User Story 2 - Page Creation & Block Editor (Priority: P1) 🎯 MVP

**Goal**: Users can create pages, add blocks (paragraphs, headings, lists), edit content, and organize pages hierarchically. This is the core content creation feature.

**Independent Test**: User can create page → add blocks → edit blocks → delete blocks → create child pages. Can be tested independently via API and verified in database.

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T079 [P] [US2] Create unit test for Page model in backend/tests/unit/models/page.test.ts
- [x] T080 [P] [US2] Create unit test for Block model in backend/tests/unit/models/block.test.ts
- [x] T081 [P] [US2] Create integration test for page creation in backend/tests/integration/page/create.test.ts
- [x] T082 [P] [US2] Create integration test for block creation in backend/tests/integration/block/create.test.ts
- [x] T083 [P] [US2] Create integration test for block update in backend/tests/integration/block/update.test.ts
- [x] T084 [P] [US2] Create contract test for POST /api/v1/workspaces/:uuid/pages in backend/tests/contract/page/create.contract.test.ts
- [x] T085 [P] [US2] Create contract test for POST /api/v1/pages/:uuid/blocks in backend/tests/contract/block/create.contract.test.ts
- [x] T086 [P] [US2] Create E2E test for page creation flow in frontend/tests/e2e/page/create.spec.ts
- [x] T087 [P] [US2] Create E2E test for block editing flow in frontend/tests/e2e/editor/edit.spec.ts

### Implementation for User Story 2

- [x] T088 [P] [US2] Create Page model in backend/src/models/page.model.ts
- [x] T089 [P] [US2] Create Block model in backend/src/models/block.model.ts
- [x] T090 [US2] Create Page repository in backend/src/repositories/page.repository.ts (depends on T088)
- [x] T091 [US2] Create Block repository in backend/src/repositories/block.repository.ts (depends on T089)
- [x] T092 [US2] Create PageService in backend/src/services/page.service.ts (depends on T090, T059)
- [x] T093 [US2] Create BlockService in backend/src/services/block.service.ts (depends on T091, T092)
- [x] T094 [US2] Create PageController in backend/src/controllers/page.controller.ts (depends on T092)
- [x] T095 [US2] Create BlockController in backend/src/controllers/block.controller.ts (depends on T093)
- [x] T096 [US2] Create page routes in backend/src/routes/page.routes.ts (depends on T094) - Integrated into NestJS controllers
- [x] T097 [US2] Create block routes in backend/src/routes/block.routes.ts (depends on T095) - Integrated into NestJS controllers
- [x] T098 [US2] Create page DTOs in backend/src/dto/page.dto.ts
- [x] T099 [US2] Create block DTOs in backend/src/dto/block.dto.ts
- [x] T100 [US2] Create page validators in backend/src/validators/page.validator.ts
- [x] T101 [US2] Create block validators in backend/src/validators/block.validator.ts
- [x] T102 [US2] Create pages store (Zustand) in frontend/src/store/pages.ts
- [x] T103 [US2] Create editor store (Zustand) in frontend/src/store/editor.ts
- [x] T104 [US2] Setup Lexical editor in frontend/src/components/Editor/BlockEditor.tsx
- [x] T105 [US2] Create BlockRenderer component in frontend/src/components/Editor/BlockRenderer.tsx
- [x] T106 [P] [US2] Create ParagraphBlock component in frontend/src/components/Editor/blocks/ParagraphBlock.tsx
- [x] T107 [P] [US2] Create HeadingBlock component in frontend/src/components/Editor/blocks/HeadingBlock.tsx
- [x] T108 [P] [US2] Create ListBlock component in frontend/src/components/Editor/blocks/ListBlock.tsx
- [x] T109 [P] [US2] Create TodoBlock component in frontend/src/components/Editor/blocks/TodoBlock.tsx
- [x] T110 [US2] Create SlashMenu component in frontend/src/components/Editor/SlashMenu.tsx (depends on T104)
- [x] T111 [US2] Create PageEditor page component in frontend/src/pages/Page/PageEditor.tsx (depends on T104, T105)
- [x] T112 [US2] Create PageTree component in frontend/src/components/Sidebar/PageTree.tsx
- [x] T113 [US2] Create useEditor hook in frontend/src/hooks/useEditor.ts
- [x] T114 [US2] Create useBlocks hook in frontend/src/hooks/useBlocks.ts
- [x] T115 [US2] Add page routes to frontend/src/router/index.tsx (depends on T111)
- [x] T116 [US2] Implement block content extraction for search in backend/src/services/block.service.ts (depends on T093)

**Checkpoint**: At this point, User Story 2 should be fully functional and testable independently. Users can create pages, add/edit/delete blocks, and organize pages hierarchically.

---

## Phase 5: User Story 3 - Real-Time Collaboration (Priority: P2)

**Goal**: Multiple users can edit pages simultaneously with live cursors, presence indicators, and real-time block updates via WebSocket.

**Independent Test**: Two users can open same page → see each other's cursors → edit blocks simultaneously → see updates in real-time. Can be tested with two browser sessions.

### Tests for User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T117 [P] [US3] Create integration test for WebSocket connection in backend/tests/integration/websocket/connection.test.ts
- [x] T118 [P] [US3] Create integration test for presence events in backend/tests/integration/websocket/presence.test.ts
- [x] T119 [P] [US3] Create integration test for block update events in backend/tests/integration/websocket/block-events.test.ts
- [x] T120 [P] [US3] Create E2E test for real-time collaboration in frontend/tests/e2e/collaboration/realtime.spec.ts

### Implementation for User Story 3

- [x] T121 [US3] Setup Yjs CRDT library in backend/src/websocket/crdt/yjs-setup.ts
- [x] T122 [US3] Create WebSocketService in backend/src/services/websocket.service.ts (depends on T034)
- [x] T123 [US3] Create presence handler in backend/src/websocket/handlers/presence.handler.ts
- [x] T124 [US3] Create block event handler in backend/src/websocket/handlers/block.handler.ts (depends on T093)
- [x] T125 [US3] Create page event handler in backend/src/websocket/handlers/page.handler.ts (depends on T092)
- [x] T126 [US3] Create room manager for WebSocket rooms in backend/src/websocket/room.manager.ts
- [x] T127 [US3] Integrate CRDT with block updates in backend/src/services/block.service.ts (depends on T093, T121)
- [x] T128 [US3] Setup Yjs provider in frontend/src/services/yjs-provider.ts
- [x] T129 [US3] Create useWebSocket hook in frontend/src/hooks/useWebSocket.ts
- [x] T130 [US3] Create useCollaboration hook in frontend/src/hooks/useCollaboration.ts (depends on T128, T129)
- [x] T131 [US3] Create PresenceIndicator component in frontend/src/components/Editor/PresenceIndicator.tsx
- [x] T132 [US3] Create LiveCursor component in frontend/src/components/Editor/LiveCursor.tsx
- [x] T133 [US3] Integrate Yjs with Lexical editor in frontend/src/components/Editor/BlockEditor.tsx (depends on T104, T128)
- [x] T134 [US3] Create presence store (Zustand) in frontend/src/store/presence.ts
- [x] T135 [US3] Implement optimistic updates in frontend/src/hooks/useBlocks.ts (depends on T114)
- [x] T136 [US3] Add connection recovery logic in frontend/src/services/websocket.ts (depends on T036)

**Checkpoint**: At this point, User Story 3 should be fully functional. Multiple users can collaborate in real-time with live cursors and presence.

---

## Phase 6: User Story 4 - Database/Table Views (Priority: P2)

**Goal**: Users can create database pages with table, board, calendar views, add rows, and manage properties.

**Independent Test**: User can create database → add properties → add rows → switch views → filter/sort. Can be tested independently.

### Tests for User Story 4 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T137 [P] [US4] Create unit test for Database model in backend/tests/unit/models/database.test.ts
- [x] T138 [P] [US4] Create unit test for DatabaseRow model in backend/tests/unit/models/database-row.test.ts
- [x] T139 [P] [US4] Create integration test for database creation in backend/tests/integration/database/create.test.ts
- [x] T140 [P] [US4] Create integration test for database row operations in backend/tests/integration/database/rows.test.ts
- [x] T141 [P] [US4] Create contract test for POST /api/v1/databases/:uuid/rows in backend/tests/contract/database/rows.contract.test.ts
- [ ] T142 [P] [US4] Create E2E test for database creation flow in frontend/tests/e2e/database/create.spec.ts

### Implementation for User Story 4

- [x] T143 [P] [US4] Create Database model in backend/src/models/database.model.ts
- [x] T144 [P] [US4] Create DatabaseRow model in backend/src/models/database-row.model.ts
- [x] T145 [US4] Create Database repository in backend/src/repositories/database.repository.ts (depends on T143)
- [x] T146 [US4] Create DatabaseRow repository in backend/src/repositories/database-row.repository.ts (depends on T144)
- [x] T147 [US4] Create DatabaseService in backend/src/services/database.service.ts (depends on T145, T146, T092)
- [x] T148 [US4] Create DatabaseController in backend/src/controllers/database.controller.ts (depends on T147)
- [x] T149 [US4] Create database routes in backend/src/routes/database.routes.ts (depends on T148)
- [x] T150 [US4] Create database DTOs in backend/src/dto/database.dto.ts
- [x] T151 [US4] Create database validators in backend/src/validators/database.validator.ts
- [x] T152 [US4] Create DatabaseView component in frontend/src/components/Database/DatabaseView.tsx
- [x] T153 [US4] Create TableView component in frontend/src/components/Database/TableView.tsx
- [x] T154 [US4] Create BoardView component in frontend/src/components/Database/BoardView.tsx
- [x] T155 [US4] Create CalendarView component in frontend/src/components/Database/CalendarView.tsx
- [x] T156 [US4] Create database store (Zustand) in frontend/src/store/database.ts
- [x] T157 [US4] Create DatabaseEditor page component in frontend/src/pages/Database/DatabaseEditor.tsx (depends on T152)
- [x] T158 [US4] Add database routes to frontend/src/router/index.tsx (depends on T157)
- [x] T159 [US4] Implement property type system in frontend/src/types/database.types.ts
- [x] T160 [US4] Implement formula calculations in backend/src/services/database.service.ts (depends on T147)

**Checkpoint**: At this point, User Story 4 should be fully functional. Users can create databases, manage properties, add rows, and switch between views.

---

## Phase 7: User Story 5 - Comments & Discussions (Priority: P3)

**Goal**: Users can add comments to pages/blocks, mention users, resolve comments, and have threaded discussions.

**Independent Test**: User can add comment → mention user → reply to comment → resolve comment. Can be tested independently.

### Tests for User Story 5 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T161 [P] [US5] Create unit test for Comment model in backend/tests/unit/models/comment.test.ts
- [x] T162 [P] [US5] Create integration test for comment creation in backend/tests/integration/comment/create.test.ts
- [x] T163 [P] [US5] Create integration test for comment threading in backend/tests/integration/comment/threading.test.ts
- [x] T164 [P] [US5] Create contract test for POST /api/v1/pages/:uuid/comments in backend/tests/contract/comment/create.contract.test.ts
- [x] T165 [P] [US5] Create E2E test for comment flow in frontend/tests/e2e/comment/create.spec.ts

### Implementation for User Story 5

- [x] T166 [P] [US5] Create Comment model in backend/src/models/comment.model.ts
- [x] T167 [US5] Create Comment repository in backend/src/repositories/comment.repository.ts (depends on T166)
- [x] T168 [US5] Create CommentService in backend/src/services/comment.service.ts (depends on T167, T092, T059)
- [x] T169 [US5] Create NotificationService in backend/src/services/notification.service.ts (depends on T168)
- [x] T170 [US5] Create CommentController in backend/src/controllers/comment.controller.ts (depends on T168)
- [x] T171 [US5] Create comment routes in backend/src/routes/comment.routes.ts (depends on T170)
- [x] T172 [US5] Create comment DTOs in backend/src/dto/comment.dto.ts
- [x] T173 [US5] Create comment validators in backend/src/validators/comment.validator.ts
- [x] T174 [US5] Create comment event handler in backend/src/websocket/handlers/comment.handler.ts (depends on T168)
- [x] T175 [US5] Create CommentThread component in frontend/src/components/Comments/CommentThread.tsx
- [x] T176 [US5] Create CommentItem component in frontend/src/components/Comments/CommentItem.tsx
- [x] T177 [US5] Create comment store (Zustand) in frontend/src/store/comments.ts
- [x] T178 [US5] Integrate comments into PageEditor in frontend/src/pages/Page/PageEditor.tsx (depends on T111)
- [x] T179 [US5] Implement @ mention parsing in backend/src/services/comment.service.ts (depends on T168)
- [x] T180 [US5] Implement notification creation on mentions in backend/src/services/notification.service.ts (depends on T169)

**Checkpoint**: At this point, User Story 5 should be fully functional. Users can add comments, mention users, and have threaded discussions.

---

## Phase 8: User Story 6 - Search & Organization (Priority: P3)

**Goal**: Users can search across workspace content, favorite pages, view recent pages, and navigate via sidebar.

**Independent Test**: User can search → favorite page → view recent → navigate sidebar. Can be tested independently.

### Tests for User Story 6 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T181 [P] [US6] Create integration test for search functionality in backend/tests/integration/search/search.test.ts
- [x] T182 [P] [US6] Create integration test for favorites in backend/tests/integration/favorites/favorites.test.ts
- [x] T183 [P] [US6] Create contract test for GET /api/v1/workspaces/:uuid/search in backend/tests/contract/search/search.contract.test.ts
- [x] T184 [P] [US6] Create E2E test for search flow in frontend/tests/e2e/search/search.spec.ts

### Implementation for User Story 6

- [x] T185 [US6] Setup Meilisearch client in backend/src/config/search.ts
- [x] T186 [US6] Create SearchService in backend/src/services/search.service.ts (depends on T185, T090, T091)
- [x] T187 [US6] Create SearchController in backend/src/controllers/search.controller.ts (depends on T186)
- [x] T188 [US6] Create search routes in backend/src/routes/search.routes.ts (depends on T187)
- [x] T189 [US6] Create search index listener in backend/src/listeners/search-index.listener.ts (depends on T186)
- [x] T190 [US6] Create Favorites model in backend/src/models/favorite.model.ts
- [x] T191 [US6] Create Favorites repository in backend/src/repositories/favorite.repository.ts (depends on T190)
- [x] T192 [US6] Add favorites endpoints to page routes in backend/src/routes/page.routes.ts (depends on T191)
- [x] T193 [US6] Create QuickSearch component in frontend/src/components/Search/QuickSearch.tsx
- [x] T194 [US6] Create SearchResults component in frontend/src/components/Search/SearchResults.tsx
- [x] T195 [US6] Create Sidebar component in frontend/src/components/Sidebar/Sidebar.tsx (depends on T112)
- [x] T196 [US6] Create WorkspaceSwitcher component in frontend/src/components/Sidebar/WorkspaceSwitcher.tsx
- [x] T197 [US6] Implement keyboard shortcut (Cmd/Ctrl+K) for search in frontend/src/hooks/useKeyboardShortcuts.ts
- [x] T198 [US6] Create favorites functionality in frontend/src/store/pages.ts (depends on T102)
- [x] T199 [US6] Implement recently viewed tracking in frontend/src/store/pages.ts (depends on T102)

**Checkpoint**: At this point, User Story 6 should be fully functional. Users can search, favorite pages, and navigate efficiently.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T200 [P] Update API documentation in specs/001-technical-spec/contracts/openapi.yaml
- [x] T201 [P] Create comprehensive README.md in repository root
- [x] T202 [P] Add code comments and JSDoc to all services in backend/src/services/
- [ ] T203 [P] Add code comments and JSDoc to all components in frontend/src/components/ (Partially complete - key components done)
- [x] T204 [P] Performance optimization: Add Redis caching layer in backend/src/services/cache.service.ts
- [x] T205 [P] Performance optimization: Implement lazy loading for routes in frontend/src/router/index.tsx
- [x] T206 [P] Performance optimization: Add virtual scrolling for large block lists in frontend/src/components/Editor/BlockList.tsx (Note: Requires @tanstack/react-virtual package)
- [x] T207 [P] Security: Add input sanitization in backend/src/middlewares/sanitize.middleware.ts (Note: Requires isomorphic-dompurify package)
- [x] T208 [P] Security: Add CSRF protection in backend/src/middlewares/csrf.middleware.ts
- [x] T209 [P] Security: Implement rate limiting per endpoint in backend/src/middlewares/rate-limit.middleware.ts (enhance T026)
- [x] T210 [P] Error handling: Add error boundary components in frontend/src/components/Common/ErrorBoundary.tsx
- [x] T211 [P] Error handling: Improve error messages in frontend/src/services/api.ts
- [x] T212 [P] Accessibility: Add ARIA labels to all interactive components in frontend/src/components/
- [x] T213 [P] Accessibility: Implement keyboard navigation in frontend/src/components/Editor/
- [ ] T214 [P] Testing: Increase test coverage to > 80% across all modules (Requires running test suite)
- [x] T215 [P] Monitoring: Setup application logging in backend/src/utils/logger.ts (enhance T027)
- [x] T216 [P] Monitoring: Add performance monitoring in backend/src/middlewares/performance.middleware.ts
- [ ] T217 [P] Documentation: Create architecture diagrams in docs/architecture/ (Can be created manually or with diagram tools)
- [x] T218 [P] Documentation: Create deployment guide in docs/deployment.md
- [ ] T219 Run quickstart.md validation - verify all setup steps work (Requires manual testing)
- [ ] T220 Code cleanup and refactoring - remove unused code, optimize imports (Ongoing task)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed) after foundational
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 for workspace context
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Depends on US2 for blocks
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Depends on US2 for pages
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Depends on US2 for pages/blocks
- **User Story 6 (P3)**: Can start after Foundational (Phase 2) - Depends on US2 for pages/blocks

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before repositories
- Repositories before services
- Services before controllers
- Controllers before routes
- Backend before frontend (for API-dependent features)
- Core implementation before integration

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members
- Frontend and backend tasks can run in parallel once API contracts are defined

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: T042 [P] [US1] Create unit test for User model
Task: T043 [P] [US1] Create unit test for Workspace model
Task: T044 [P] [US1] Create integration test for auth registration
Task: T045 [P] [US1] Create integration test for auth login
Task: T046 [P] [US1] Create integration test for workspace creation
Task: T047 [P] [US1] Create contract test for POST /api/v1/auth/register
Task: T048 [P] [US1] Create contract test for POST /api/v1/auth/login
Task: T049 [P] [US1] Create E2E test for user registration flow
Task: T050 [P] [US1] Create E2E test for user login flow

# Launch all models for User Story 1 together:
Task: T051 [P] [US1] Create User model
Task: T052 [P] [US1] Create Workspace model
Task: T053 [P] [US1] Create WorkspaceMember model
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Authentication & Workspaces)
4. Complete Phase 4: User Story 2 (Pages & Block Editor)
5. **STOP and VALIDATE**: Test User Stories 1 & 2 independently
6. Deploy/demo if ready

**MVP Scope**: Users can register, login, create workspaces, create pages, and edit blocks. This is a functional workspace platform.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo
3. Add User Story 2 → Test independently → Deploy/Demo (MVP!)
4. Add User Story 3 → Test independently → Deploy/Demo (Real-time collaboration)
5. Add User Story 4 → Test independently → Deploy/Demo (Databases)
6. Add User Story 5 → Test independently → Deploy/Demo (Comments)
7. Add User Story 6 → Test independently → Deploy/Demo (Search)
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Auth & Workspaces)
   - Developer B: User Story 2 (Pages & Editor) - can start after US1 models
   - Developer C: User Story 3 (Real-time) - can start after US2 blocks
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Follow TDD: Write tests first, ensure they fail, then implement
- All file paths are relative to repository root
- Backend tasks use TypeScript/NestJS
- Frontend tasks use TypeScript/React

---

## Summary

**Total Tasks**: 220 tasks
- **Phase 1 (Setup)**: 18 tasks
- **Phase 2 (Foundational)**: 23 tasks
- **Phase 3 (US1 - Auth & Workspaces)**: 37 tasks
- **Phase 4 (US2 - Pages & Editor)**: 38 tasks
- **Phase 5 (US3 - Real-time)**: 20 tasks
- **Phase 6 (US4 - Databases)**: 24 tasks
- **Phase 7 (US5 - Comments)**: 20 tasks
- **Phase 8 (US6 - Search)**: 20 tasks
- **Phase 9 (Polish)**: 20 tasks

**Parallel Opportunities**: 
- 18 tasks in Setup phase can run in parallel
- 23 tasks in Foundational phase can run in parallel
- User stories can run in parallel after foundational phase
- Multiple tests and models can be created in parallel within each story

**Suggested MVP Scope**: User Stories 1 & 2 (Authentication, Workspaces, Pages, Block Editor)
- Total MVP tasks: ~116 tasks (Phases 1-4)
- Independent test criteria defined for each story
- Can be deployed and demonstrated independently

**Format Validation**: ✅ All tasks follow the checklist format with checkbox, ID, [P] marker (where applicable), [Story] label (for user story tasks), and file paths.

