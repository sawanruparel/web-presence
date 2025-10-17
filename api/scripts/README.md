# Database Management Scripts

This directory contains scripts for managing database rules and ensuring alignment with content files.

## Scripts Overview

### 1. `cleanup-database.js`
**Purpose**: Removes test/development rules from the database, keeping only rules for actual content files.

**Usage**:
```bash
node scripts/cleanup-database.js
```

**What it does**:
- Analyzes actual content files in the `content/` directory
- Fetches all database rules
- Identifies orphaned rules (database rules without corresponding content files)
- Deletes orphaned rules
- Verifies final alignment

### 2. `generate-seed-config.js`
**Purpose**: Analyzes content files and generates a configuration file for seeding the database.

**Usage**:
```bash
node scripts/generate-seed-config.js
```

**What it does**:
- Scans all content files in the `content/` directory
- Parses frontmatter for access control hints
- Generates access rules based on content type and frontmatter
- Creates `seed-config.json` with the generated rules

**Generated Configuration**:
- **Notes**: Open by default
- **Ideas**: Password-protected by default (unless `public: true` in frontmatter)
- **Publications**: Email-list by default (unless `public: true` in frontmatter)
- **Pages**: Open by default

### 3. `seed-database-dynamic.sh`
**Purpose**: Seeds the database using the generated configuration file.

**Usage**:
```bash
./seed-database-dynamic.sh
```

**What it does**:
- Reads configuration from `seed-config.json`
- Checks API availability
- Creates access rules for each content file
- Handles existing rules gracefully
- Provides detailed progress and summary

### 4. `verify-alignment.js`
**Purpose**: Verifies that database rules exactly match content files.

**Usage**:
```bash
node scripts/verify-alignment.js
```

**What it does**:
- Compares content files with database rules
- Identifies orphaned rules and missing rules
- Reports alignment status
- Provides access mode breakdown

## Workflow

### Initial Setup
1. **Clean up existing database**:
   ```bash
   node scripts/cleanup-database.js
   ```

2. **Generate seed configuration**:
   ```bash
   node scripts/generate-seed-config.js
   ```

3. **Seed database with content-based rules**:
   ```bash
   ./seed-database-dynamic.sh
   ```

4. **Verify alignment**:
   ```bash
   node scripts/verify-alignment.js
   ```

### Adding New Content
1. Add new content files to the `content/` directory
2. Run the workflow above to update database rules

### Regular Maintenance
- Run `verify-alignment.js` to check for discrepancies
- Run the full workflow if alignment issues are found

## Configuration

All scripts use the following configuration (in order of precedence):

### Environment Variables
- **API_BASE_URL**: API base URL (default: `http://localhost:8787`)
- **API_KEY**: API key for authentication

### Configuration Files
- **`.dev.vars`**: Contains `INTERNAL_API_KEY` (used if environment variables not set)
- **Content Directory**: `../../content/` (relative to scripts directory)

### Usage Examples

**Using environment variables:**
```bash
API_KEY=your-api-key API_BASE_URL=http://localhost:3000 node scripts/cleanup-database.js
```

**Using .dev.vars file (default):**
```bash
# Scripts automatically read from .dev.vars
node scripts/cleanup-database.js
```

**Using shell script with environment variables:**
```bash
API_KEY=your-api-key ./seed-database-dynamic.sh
```

## Benefits

- **Perfect Alignment**: Database rules always match actual content files
- **No Orphaned Rules**: Test/development rules are automatically cleaned up
- **Content-Driven**: Rules are generated based on actual content, not hardcoded
- **Verification**: Easy to check alignment status
- **Maintainable**: Adding new content automatically updates database rules

## Troubleshooting

### API Not Running
```
❌ API is not running or not accessible
```
**Solution**: Start the API with `npm run dev`

### Configuration File Missing
```
❌ Configuration file not found: scripts/seed-config.json
```
**Solution**: Run `node scripts/generate-seed-config.js` first

### API Key Not Found
```
❌ API_KEY environment variable not set and .dev.vars file not found
```
**Solution**: Either set the `API_KEY` environment variable or ensure `.dev.vars` exists with `INTERNAL_API_KEY`

### Alignment Issues
```
❌ Alignment Status: MISMATCH
```
**Solution**: Run the full workflow to clean up and reseed the database

## Security Notes

- **No Hardcoded Keys**: All scripts now read API keys from environment variables or `.dev.vars`
- **Environment Variables**: Preferred method for production environments
- **`.dev.vars` File**: Convenient for local development (already in `.gitignore`)
- **API Key Rotation**: Easy to update by changing environment variables or `.dev.vars`
