# Cloudflare Production Migrations

This document explains how to verify and apply migrations on Cloudflare production databases.

## Who Runs Migrations on Cloudflare?

**Developers manually run migrations** - There is no automatic CI/CD migration system. Migrations must be run by developers with access to the Cloudflare account using the Wrangler CLI.

### Prerequisites

1. **Cloudflare Account Access** - You need to be logged into Cloudflare via Wrangler
2. **Wrangler CLI** - Must have `wrangler` installed and authenticated
3. **Database Access** - Must have permissions to execute D1 database commands

### Authentication

```bash
# Login to Cloudflare (if not already logged in)
npx wrangler login

# Verify you're logged in
npx wrangler whoami
```

## Production Database Information

- **Database Name**: `web-presence-db`
- **Database ID**: `22aaa0c4-8060-4417-9649-9cc8cafa7e06`
- **Environment**: Production (Cloudflare Workers)
- **Location**: Cloudflare D1 (remote)

## Verifying Production Database Status

### 1. Check What Tables Exist

```bash
# List all tables in production database
npx wrangler d1 execute web-presence-db --remote --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```

### 2. Check Migration Status (if tracking table exists)

```bash
cd api
npm run migrate:verify:remote
```

### 3. Check Specific Table

```bash
# Check if a specific table exists
npx wrangler d1 execute web-presence-db --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name='build_logs'"

# Check table structure (if it exists)
npx wrangler d1 execute web-presence-db --remote --command="PRAGMA table_info(build_logs)"
```

## Applying Migrations to Production

### Current Production Status

As of now, production database has:
- ✅ `content_access_rules` (from 0001)
- ✅ `access_logs` (from 0001)
- ✅ `email_allowlist` (from 0001)
- ❌ `build_logs` (needs 0002)
- ❌ `schema_migrations` (needs 0000)

### Step 1: Set Up Migration Tracking (One-Time)

Since production doesn't have the migrations tracking table yet:

```bash
# 1. Create migrations tracking table
npx wrangler d1 execute web-presence-db --remote --file=./migrations/0000_migrations_table.sql

# 2. Record that 0001 was already applied
npx wrangler d1 execute web-presence-db --remote --command="INSERT INTO schema_migrations (migration_name, migration_file, description, applied_by) VALUES ('0001_initial_schema', '0001_initial_schema.sql', 'Initial Schema for Access Control System', 'manual')"
```

### Step 2: Apply Pending Migrations

```bash
# Option A: Use the migration runner (recommended)
cd api
npm run migrate:remote

# Option B: Apply manually
npx wrangler d1 execute web-presence-db --remote --file=./migrations/0002_build_logs.sql
```

### Step 3: Verify After Application

```bash
# Verify migrations were applied
npm run migrate:verify:remote

# Check table exists
npx wrangler d1 execute web-presence-db --remote --command="SELECT COUNT(*) as count FROM build_logs"

# List all tables to confirm
npx wrangler d1 execute web-presence-db --remote --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```

## Complete Production Migration Workflow

### First-Time Setup

```bash
cd api

# 1. Create migrations tracking table
npx wrangler d1 execute web-presence-db --remote --file=./migrations/0000_migrations_table.sql

# 2. Record existing migration
npx wrangler d1 execute web-presence-db --remote --command="INSERT INTO schema_migrations (migration_name, migration_file, description, applied_by) VALUES ('0001_initial_schema', '0001_initial_schema.sql', 'Initial Schema for Access Control System', 'manual')"

# 3. Apply pending migrations
npm run migrate:remote

# 4. Verify
npm run migrate:verify:remote
```

### Regular Migration Process

For future migrations:

```bash
cd api

# 1. Test locally first
npm run migrate:verify:local
npm run migrate:local

# 2. Verify production status
npm run migrate:verify:remote

# 3. Apply to production
npm run migrate:remote

# 4. Verify production
npm run migrate:verify:remote
```

## Safety Checklist

Before applying migrations to production:

- [ ] ✅ Tested migration locally
- [ ] ✅ Verified local application works with migration
- [ ] ✅ Checked production migration status
- [ ] ✅ Reviewed migration SQL for safety
- [ ] ✅ Have rollback plan if needed
- [ ] ✅ Notified team (if applicable)
- [ ] ✅ Backup production database (if critical)

## Monitoring After Migration

After applying migrations, monitor:

1. **API Health**: Check if API endpoints work correctly
2. **Error Logs**: Monitor Cloudflare Workers logs for errors
3. **Database Queries**: Verify queries against new tables work
4. **Application Functionality**: Test affected features

## Troubleshooting

### Check Current Production State

```bash
# See all tables
npx wrangler d1 execute web-presence-db --remote --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"

# See migration tracking (if exists)
npx wrangler d1 execute web-presence-db --remote --command="SELECT * FROM schema_migrations ORDER BY migration_name"

# Check specific table structure
npx wrangler d1 execute web-presence-db --remote --command="PRAGMA table_info(build_logs)"
```

### Migration Fails Partway Through

```bash
# Check what was applied
npx wrangler d1 execute web-presence-db --remote --command="SELECT * FROM schema_migrations ORDER BY migration_name"

# Manually fix the database, then record the migration
npx wrangler d1 execute web-presence-db --remote --command="INSERT INTO schema_migrations (migration_name, migration_file, applied_by) VALUES ('000X_migration_name', '000X_migration_name.sql', 'manual-fix')"
```

### Rollback

If you need to rollback:

1. Create a new migration that reverses the changes
2. Apply it using `npm run migrate:remote`
3. Or manually drop/alter tables if needed

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm run migrate:verify:remote` | Check production migration status |
| `npm run migrate:remote` | Apply pending migrations to production |
| `npx wrangler d1 execute web-presence-db --remote --command="..."` | Execute SQL on production |
| `npx wrangler d1 list` | List all D1 databases |
| `npx wrangler d1 execute web-presence-db --remote --file=./migrations/XXX.sql` | Apply specific migration file |

## CI/CD Integration (Future)

Currently, migrations are manual. For future automation, you could:

1. Add a GitHub Actions workflow that runs migrations on deploy
2. Use Cloudflare Workers Cron Triggers to check migration status
3. Add migration checks to deployment scripts

Example GitHub Actions workflow (not implemented):

```yaml
name: Run Migrations
on:
  workflow_dispatch:
jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run migrate:remote
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```
