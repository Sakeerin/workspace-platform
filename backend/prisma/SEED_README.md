# Database Seeding

This directory contains the database seed script for populating the database with demo data.

## What Gets Created

The seed script creates comprehensive demo data including:

- **10 Users** - Demo users with different names and roles
- **8 Workspaces** - Various workspace types (enterprise, team, personal, free)
- **Workspace Members** - Users assigned to workspaces with different roles (owner, admin, member, guest)
- **Pages** - Regular pages and database pages with content
- **Databases** - Database pages with properties and views
- **Database Rows** - Sample rows in databases
- **Blocks** - Content blocks for pages (headings, paragraphs, lists, code, etc.)
- **Comments** - Comments on pages
- **Favorites** - Favorited pages by users
- **Activity Logs** - Activity history for workspaces
- **Notifications** - Sample notifications for users

## Demo Credentials

All demo users have the same password: **`demo123`**

Sample users:
- `user1@demo.com` - Alice Johnson
- `user2@demo.com` - Bob Smith
- `user3@demo.com` - Charlie Brown
- `user4@demo.com` - Diana Prince
- `user5@demo.com` - Ethan Hunt
- ... and 5 more users

## Running the Seed Script

### Prerequisites

1. Make sure your database is set up and migrations are applied:
   ```bash
   npx prisma migrate dev
   ```

2. Ensure Prisma Client is generated:
   ```bash
   npx prisma generate
   ```

### Run Seed

```bash
# From the backend directory
npm run prisma:seed

# Or directly with Prisma
npx prisma db seed
```

### Warning

⚠️ **The seed script will DELETE all existing data** before creating new demo data. This ensures a clean state for demos.

If you want to keep existing data, comment out the cleanup section in `seed.ts` (lines that start with `await prisma.*.deleteMany()`).

## Customizing the Seed Data

You can modify `seed.ts` to:
- Change the number of users, workspaces, or pages
- Modify sample content
- Adjust relationships between entities
- Add more realistic data

## Troubleshooting

If you encounter errors:

1. **TypeScript errors**: Make sure `ts-node` is installed and Prisma Client is generated
2. **Database connection errors**: Check your `DATABASE_URL` in `.env`
3. **Permission errors**: Ensure your database user has CREATE, DELETE, and INSERT permissions

