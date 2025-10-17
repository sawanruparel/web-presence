# API Deployment

Deployment and configuration guide for the backend API.

## Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account
- Cloudflare D1 database (for production)

## Local Development

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Set Up Environment Variables

Create a `.dev.vars` file in the `api/` directory:

```bash
# Database connection (Cloudflare D1)
DB=database-name

# Internal API key for admin endpoints
INTERNAL_API_KEY=your-internal-api-key
```

### 3. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:8787`

### 4. Test the API

```bash
# Health check
curl http://localhost:8787/health

# Test content catalog
curl http://localhost:8787/api/content-catalog \
  -H "X-API-Key: your-internal-api-key"
```

## Production Deployment

### 1. Login to Cloudflare

```bash
npx wrangler login
```

### 2. Create D1 Database

```bash
# Create database
npx wrangler d1 create web-presence-db

# Run migrations
npx wrangler d1 execute web-presence-db --file=./migrations/0001_initial_schema.sql
```

### 3. Update wrangler.toml

Update the database ID in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "web-presence-db"
database_id = "your-database-id-here"
```

### 4. Deploy

```bash
npm run deploy
```

### 5. Set Environment Variables

In the Cloudflare dashboard:
1. Go to Workers & Pages > Your Worker > Settings > Variables
2. Add the following variables:
   - `INTERNAL_API_KEY` - API key for admin endpoints

## Environment-Specific Deployments

### Development Environment

```bash
# Deploy to development
wrangler deploy --env development
```

### Production Environment

```bash
# Deploy to production
wrangler deploy --env production
```

## Database Setup

### 1. Create Database

```bash
npx wrangler d1 create web-presence-db
```

### 2. Run Migrations

```bash
npx wrangler d1 execute web-presence-db --file=./migrations/0001_initial_schema.sql
```

### 3. Seed Database (Optional)

```bash
npx wrangler d1 execute web-presence-db --file=./seed-database.sh
```

## Configuration

### Wrangler Configuration

The `wrangler.toml` file configures the Cloudflare Workers deployment:

```toml
name = "web-presence-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "web-presence-db"
database_id = "your-database-id"

[env.development]
name = "web-presence-api-dev"

[env.production]
name = "web-presence-api"
```

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DB` | D1 database binding | Yes | `web-presence-db` |
| `INTERNAL_API_KEY` | API key for admin endpoints | Yes | `your-internal-api-key` |

## Monitoring

### Logs

View logs in Cloudflare dashboard:
- Workers & Pages > Your Worker > Logs

### Metrics

Monitor performance in Cloudflare dashboard:
- Workers & Pages > Your Worker > Analytics

### Database Monitoring

Monitor database usage:
- Workers & Pages > D1 > Your Database > Analytics

## Troubleshooting

### Common Issues

1. **Database Connection Errors:**
   - Verify database ID in `wrangler.toml`
   - Check database exists in Cloudflare dashboard
   - Ensure migrations have been run

2. **Authentication Failures:**
   - Verify `INTERNAL_API_KEY` is set correctly
   - Check token expiration
   - Ensure proper Authorization header format

3. **CORS Errors:**
   - Check CORS configuration in `src/index.ts`
   - Ensure frontend domain is whitelisted

4. **Rate Limiting:**
   - Check rate limiting configuration
   - Verify IP address detection
   - Review rate limit logs

### Debug Mode

Enable debug logging by setting environment variable:
```bash
NODE_ENV=development
```

### Database Debugging

```bash
# Query database directly
npx wrangler d1 execute web-presence-db --command="SELECT * FROM content_access_rules"

# Check database schema
npx wrangler d1 execute web-presence-db --command=".schema"
```

## Security Considerations

### JWT Secret

- Use a strong, random secret (minimum 32 characters)
- Store securely in environment variables
- Rotate regularly in production

### API Keys

- Use strong, random API keys
- Store securely in environment variables
- Rotate regularly
- Limit access to necessary endpoints only

### Database Security

- Use D1's built-in security features
- Implement proper access controls
- Monitor database usage
- Regular backups

### Rate Limiting

- Configure appropriate rate limits
- Monitor for abuse
- Implement IP-based blocking if needed

## Performance Optimization

### Database Optimization

- Use appropriate indexes
- Optimize queries
- Monitor query performance
- Consider connection pooling

### Caching

- Implement caching for frequently accessed data
- Use Cloudflare's edge caching
- Cache access rules and content metadata

### Monitoring

- Set up alerts for errors
- Monitor response times
- Track database performance
- Monitor memory usage

## Backup and Recovery

### Database Backups

```bash
# Export database
npx wrangler d1 export web-presence-db --output=backup.sql

# Import database
npx wrangler d1 execute web-presence-db --file=backup.sql
```

### Configuration Backup

- Backup `wrangler.toml`
- Document environment variables
- Keep migration files in version control

## Scaling

### Horizontal Scaling

- Cloudflare Workers automatically scale
- D1 database scales with usage
- Monitor usage and adjust limits

### Vertical Scaling

- Optimize code for performance
- Use appropriate data structures
- Minimize database queries
- Implement caching strategies
