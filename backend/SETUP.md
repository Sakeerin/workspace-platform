# Backend Setup Instructions

## Fix TypeScript Errors

The TypeScript errors you're seeing are due to:

1. **Prisma Client not generated** - Run this first:
   ```bash
   cd backend
   npx prisma generate
   ```

2. **Missing npm packages** - Install dependencies:
   ```bash
   npm install
   ```

3. **Type issues fixed** - The following files have been updated:
   - `src/repositories/base.repository.ts` - Changed ID types from `number` to `bigint | number`
   - `src/utils/jwt.ts` - Fixed JWT signing types
   - `src/middlewares/performance.middleware.ts` - Fixed res.end override typing
   - `src/repositories/block.repository.ts` - Fixed extractContentText return type
   - `src/services/database.service.ts` - Fixed reduce function types
   - `src/dto/block.dto.ts` - Added position field to UpdateBlockDto
   - `src/websocket/handlers/presence.handler.ts` - Exported PresenceData interface
   - `src/services/websocket.service.ts` - Fixed getPresence return type

## Quick Fix Commands

```bash
cd backend

# 1. Install dependencies (includes meilisearch and isomorphic-dompurify)
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Run database migrations (if database is set up)
npx prisma migrate dev

# 4. Build the project
npm run build
```

## If Prisma Schema Needs Updates

If you see errors about missing fields (like `preferences` in User model), you may need to:

1. Check `prisma/schema.prisma` for the User model
2. Add missing fields or remove references to non-existent fields
3. Run migrations:
   ```bash
   npx prisma migrate dev --name add_missing_fields
   npx prisma generate
   ```

## Docker Setup

If using Docker, the Prisma client generation happens automatically in the Dockerfile, but for local development:

```bash
# Make sure DATABASE_URL is set in .env
# Then generate Prisma client
npx prisma generate
```

