# Database Migrations

This document describes how to manage database migrations in this project.

## Overview

Migrations are SQL files stored in `/api/migrations/` that modify the database schema. This project uses a **custom migration system** that tracks migrations in the `schema_migrations` table with rich metadata.

### Migration System Architecture

- **Custom Migration System**: Uses `wrangler d1 execute --file=` to apply migrations
- **Tracking Table**: `schema_migrations` (custom table with rich metadata)
- **Not Used**: Cloudflare's `d1_migrations` table (removed - we use our own tracking)

### Why Custom System?

The custom migration system provides:
- **Rich Metadata**: Tracks who applied migrations, execution time, descriptions
- **Manual Control**: Can apply migrations manually and still track them
- **Better Debugging**: Execution times and descriptions help troubleshoot issues
- **Flexibility**: Handle edge cases and manual fixes easily

**Note**: This project does NOT use `wrangler d1 migrations apply` (Cloudflare's built-in migration system). We use `wrangler d1 execute --file=` directly and track migrations in our own `schema_migrations` table.

## Migration Files

Migration files are named with a numeric prefix and descriptive name:
- `0000_migrations_table.sql` - Creates the migrations tracking table (run first)
- `0001_initial_schema.sql` - Initial database schema
- `0002_build_logs.sql` - Build logs table
- etc.

## Quick Start

### 1. Verify Current Status

Check which migrations have been applied:

```bash
# Local database
npm run migrate:verify:local

# Production database
npm run migrate:verify:remote
```

### 2. Apply Migrations

Apply pending migrations:

```bash
# Local database
npm run migrate:local

# Production database
npm run migrate:remote
```

### 3. Dry Run

See what would be applied without making changes:

```bash
node scripts/run-migrations.js --local --dry-run
node scripts/run-migrations.js --remote --dry-run
```

## Manual Migration (First Time Setup)

Since the migrations tracking table needs to exist before the runner can work, you must manually create it first:

### For Local Database:

```bash
# 1. Create migrations table
npx wrangler d1 execute web-presence-db-local --local --file=./migrations/0000_migrations_table.sql

# 2. Record that 0001 was already applied (if it was)
npx wrangler d1 execute web-presence-db-local --local --command="INSERT INTO schema_migrations (migration_name, migration_file, description, applied_by) VALUES ('0001_initial_schema', '0001_initial_schema.sql', 'Initial Schema for Access Control System', 'manual')"

# 3. Now you can use the migration runner for future migrations
npm run migrate:local
```

### For Production Database:

```bash
# 1. Create migrations table
npx wrangler d1 execute web-presence-db --remote --file=./migrations/0000_migrations_table.sql

# 2. Record that 0001 was already applied (if it was)
npx wrangler d1 execute web-presence-db --remote --command="INSERT INTO schema_migrations (migration_name, migration_file, description, applied_by) VALUES ('0001_initial_schema', '0001_initial_schema.sql', 'Initial Schema for Access Control System', 'manual')"

# 3. Now you can use the migration runner for future migrations
npm run migrate:remote
```

## Creating New Migrations

1. Create a new SQL file in `/api/migrations/` with the next sequential number:
   ```
   0003_your_migration_name.sql
   ```

2. Add a description comment at the top:
   ```sql
   -- Migration: Your Migration Name
   -- Created: YYYY-MM-DD
   -- Description: What this migration does
   ```

3. Write your SQL statements:
   ```sql
   CREATE TABLE IF NOT EXISTS your_table (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     ...
   );
   ```

4. Apply the migration:
   ```bash
   npm run migrate:local  # Test locally first
   npm run migrate:remote # Then apply to production
   ```

## Migration Tracking Table

The `schema_migrations` table is the **single source of truth** for migration tracking in this project. It tracks:
- `migration_name` - Unique identifier (e.g., '0001_initial_schema')
- `migration_file` - Full filename
- `applied_at` - Timestamp when applied
- `applied_by` - User/system that applied it
- `execution_time_ms` - How long it took
- `description` - Description from migration file

**Important**: This project does NOT use Cloudflare's `d1_migrations` table. The `schema_migrations` table is the only migration tracking system used. Cloudflare's built-in migration system (`wrangler d1 migrations apply`) is not used - we use `wrangler d1 execute --file=` directly and track migrations in our custom table.

## Best Practices

1. **Always test locally first** - Run migrations on local database before production
2. **Verify before applying** - Use `migrate:verify` to check status
3. **Use transactions where possible** - Wrap related changes in transactions
4. **Make migrations idempotent** - Use `IF NOT EXISTS` and `IF EXISTS` clauses
5. **Never modify applied migrations** - Create a new migration to fix issues
6. **Backup before production** - Always backup production database before migrations

## Troubleshooting

### Migration Already Applied Error

If a migration fails partway through, you may need to manually fix the database and then record the migration:

```bash
# Fix the database manually, then record the migration
npx wrangler d1 execute <database> --command="INSERT INTO schema_migrations (migration_name, migration_file, applied_by) VALUES ('000X_migration_name', '000X_migration_name.sql', 'manual-fix')"
```

### Check Migration Status

```bash
# See all applied migrations
npx wrangler d1 execute web-presence-db-local --local --command="SELECT * FROM schema_migrations ORDER BY migration_name"
```

### Rollback

This system doesn't support automatic rollbacks. To rollback:
1. Create a new migration that reverses the changes
2. Apply it using the normal process

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run migrate:local` | Apply pending migrations to local database |
| `npm run migrate:remote` | Apply pending migrations to production database |
| `npm run migrate:verify:local` | Check migration status for local database |
| `npm run migrate:verify:remote` | Check migration status for production database |
