# Debugging Workflow Guidelines

This document establishes conventions for creating and managing debugging scripts in the Web Presence project.

## Purpose

Debugging scripts are temporary utilities created during development to test specific functionality, troubleshoot issues, or verify API endpoints. They should be organized, documented, and easily discoverable.

## Location and Organization

### Directory Structure
- **Location**: Create `debug-scripts/` folders within relevant project areas (e.g., `api/debug-scripts/`, `web/debug-scripts/`)
- **Organization**: Categorize scripts by feature area or functionality
- **Naming**: Use descriptive names with `-debug.ts` suffix for TypeScript files

### Example Structure
```
api/
├── debug-scripts/
│   ├── README.md
│   ├── access-control-debug.ts
│   ├── content-processing-debug.ts
│   ├── database-debug.ts
│   └── access-control-api.sh
```

## Script Conventions

### TypeScript Scripts
- Use TypeScript for better type safety and IDE support
- Include proper shebang: `#!/usr/bin/env npx tsx`
- Add comprehensive JSDoc comments
- Include error handling and logging
- Make scripts executable and self-contained

### Bash Scripts
- Use for comprehensive test suites or system-level operations
- Include proper error handling and exit codes
- Use descriptive output with emojis for clarity
- Make scripts executable: `chmod +x script-name.sh`

### Naming Conventions
- **TypeScript**: `feature-area-debug.ts`
- **Bash**: `feature-area-api.sh` or `feature-area-test.sh`
- **Documentation**: `README.md` in each debug-scripts folder

## Content Guidelines

### What to Include
- **API Endpoint Tests**: Test all relevant endpoints for the feature
- **Mock Data**: Include realistic test data and scenarios
- **Error Cases**: Test both success and failure scenarios
- **Documentation**: Clear comments explaining what each test does
- **Environment Setup**: Instructions for running the scripts

### What to Avoid
- **Production Data**: Never include real user data or sensitive information
- **Hardcoded Secrets**: Use environment variables or mock data
- **Complex Dependencies**: Keep scripts simple and focused
- **Long-running Tests**: Keep execution time reasonable

## API Testing Best Practices

### Prefer API Endpoints
- Test via actual API endpoints rather than mocking services
- This ensures the full stack works correctly
- Catches integration issues that unit tests might miss

### Test Coverage
- **Health Checks**: Basic connectivity and service status
- **CRUD Operations**: Create, read, update, delete functionality
- **Authentication**: Login, token validation, access control
- **Error Handling**: Invalid inputs, unauthorized access, server errors
- **Edge Cases**: Empty responses, malformed data, timeouts

### Environment Configuration
- Use consistent base URLs and API keys
- Document required environment variables
- Include fallback values for development

## Lifecycle Management

### Creation
1. Create scripts in appropriate `debug-scripts/` folder
2. Add to folder's `README.md` with description
3. Test scripts thoroughly before committing
4. Include usage instructions

### Maintenance
- Update scripts when APIs change
- Keep test data current and realistic
- Remove obsolete or broken scripts
- Update documentation as needed

### Retention
- **Keep**: Scripts that test core functionality or are useful for ongoing development
- **Archive**: Scripts for one-time debugging sessions (move to `debug-scripts/archive/`)
- **Delete**: Scripts that are no longer relevant or functional

## Documentation Requirements

### README.md in debug-scripts folder
Include:
- Purpose and scope of debugging utilities
- Prerequisites and setup instructions
- How to run each script
- What each script tests
- Expected outputs and troubleshooting

### Script Headers
Each script should include:
- Purpose and description
- Usage instructions
- Required environment variables
- Example commands

## Integration with Development Workflow

### Before Committing
- Run relevant debug scripts to verify changes
- Ensure all scripts in the area still work
- Update documentation if APIs changed

### During Code Reviews
- Check if new debug scripts are needed
- Verify existing scripts still work
- Ensure proper organization and documentation

### When Debugging Issues
- Create focused debug scripts for specific problems
- Document findings and solutions
- Keep scripts that might be useful for similar issues

## Examples

### Good Debug Script
```typescript
#!/usr/bin/env npx tsx
/**
 * Access Control Debug Script
 * 
 * Test access control service and authentication flows
 * 
 * Usage: npx tsx debug-scripts/access-control-debug.ts
 * 
 * Prerequisites:
 * - API server running on localhost:8787
 * - Valid API_KEY environment variable
 */

const API_KEY = process.env.API_KEY || 'default-dev-key'
const BASE_URL = 'http://localhost:8787'

async function testAccessControl() {
  // Implementation with proper error handling
}
```

### Good README
```markdown
# Debug Scripts

This folder contains debugging utilities for testing backend functionality.

## Scripts

- `access-control-debug.ts` - Test access control and authentication
- `database-debug.ts` - Test database connections and queries

## Usage

```bash
# Run individual scripts
npx tsx debug-scripts/access-control-debug.ts
npx tsx debug-scripts/database-debug.ts
```

## Prerequisites

- API server running on localhost:8787
- Valid API_KEY environment variable
```

## Best Practices Summary

1. **Organize**: Use `debug-scripts/` folders, not root directories
2. **Categorize**: Group by feature area or functionality
3. **Document**: Include README and script headers
4. **Test**: Verify scripts work before committing
5. **Maintain**: Keep scripts current and remove obsolete ones
6. **API First**: Prefer API endpoint tests over mocking
7. **TypeScript**: Use TypeScript for better development experience
8. **Error Handling**: Include proper error handling and logging
9. **Environment**: Use environment variables for configuration
10. **Lifecycle**: Archive or delete when no longer needed

---

These guidelines ensure debugging scripts are useful, maintainable, and well-integrated into the development workflow.
