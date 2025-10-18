# API Testing Guide

This guide covers comprehensive testing strategies for the Web Presence API, including the new content sync, content management, and access control endpoints.

## Test Architecture

### Test Categories

#### 1. Functional Tests
- **Purpose**: Test API behavior and endpoint availability
- **Location**: `tests/api/tests/functional/`
- **Markers**: `@pytest.mark.functional`
- **Data Changes**: None (read-only)

#### 2. Data Validation Tests
- **Purpose**: Test CRUD operations and data integrity
- **Location**: `tests/api/tests/data_validation/`
- **Markers**: `@pytest.mark.data_validation`
- **Data Changes**: Creates, updates, deletes test data

#### 3. Integration Tests
- **Purpose**: Test external service integrations
- **Location**: `tests/api/tests/functional/` (integration files)
- **Markers**: `@pytest.mark.integration`
- **External Services**: GitHub API, Cloudflare R2, D1 Database

### Test Data Management

#### Configuration-Driven Testing
Tests use YAML configuration files for data-driven testing:

```yaml
# data/test-data-dev.yaml
content_management:
  test_files:
    - type: notes
      slug_template: "test-note-{timestamp}"
      title: "Test Note"
      markdown: "# Test Note\n\nContent here."
      frontmatter:
        title: "Test Note"
        date: "2024-01-15"
```

#### Parameterized Testing
Tests use `@pytest.mark.parametrize` for comprehensive coverage:

```python
@pytest.mark.parametrize("content_type", ["notes", "ideas", "publications", "pages"])
class TestContentManagementByType:
    def test_list_content_by_type(self, api_client, content_type):
        # Test each content type
```

## New API Endpoints Testing

### Content Sync API

#### Endpoints Tested
- `POST /api/internal/content-sync/webhook` - GitHub webhook processing
- `POST /api/internal/content-sync/manual` - Manual content synchronization
- `GET /api/internal/content-sync/status` - Sync status and bucket information

#### Test Coverage
- **Webhook Validation**: Signature verification, payload processing
- **Manual Sync**: Full sync, specific files, error handling
- **Status Monitoring**: Bucket counts, object listings
- **Error Scenarios**: GitHub API failures, R2 errors, network timeouts

#### Test Files
- `test_content_sync.py` - Basic endpoint tests
- `test_content_sync_integration.py` - External service integration

### Content Management API

#### Endpoints Tested
- `GET /api/content-management/types` - Available content types
- `GET /api/content-management/list/:type` - List content by type
- `GET /api/content-management/file/:type/:slug` - Get file for editing
- `POST /api/content-management/file` - Create new file
- `PUT /api/content-management/file/:type/:slug` - Update file
- `DELETE /api/content-management/file/:type/:slug` - Delete file

#### Test Coverage
- **CRUD Operations**: Create, read, update, delete content files
- **GitHub Integration**: File operations via GitHub API
- **Validation**: Required fields, content type validation, slug format
- **Error Handling**: API failures, missing files, permission errors

#### Test Files
- `test_content_management.py` - Basic CRUD tests
- `test_content_management_integration.py` - GitHub API integration

### Access Control API

#### Endpoints Tested
- `GET /api/access-control/rules` - List all access rules
- `GET /api/access-control/rules/:type/:slug` - Get specific rule
- `POST /api/access-control/rules` - Create/update rule
- `PUT /api/access-control/rules/:type/:slug` - Update rule
- `DELETE /api/access-control/rules/:type/:slug` - Delete rule
- `GET /api/access-control/logs` - Access logs with pagination

#### Test Coverage
- **Rule Management**: Password, email-list, and open access rules
- **Database Integration**: D1 database operations
- **Validation**: Access mode validation, email list validation
- **Logging**: Access attempt logging and retrieval

#### Test Files
- `test_access_control_api.py` - Complete CRUD and validation tests

## Test Execution

### Running Tests

#### Basic Execution
```bash
# Run all new tests
cd tests/api
python scripts/run_new_tests.py

# Run specific test category
python scripts/run_new_tests.py --pattern "test_content_sync"

# Run with verbose output
python scripts/run_new_tests.py --verbose
```

#### Environment-Specific Testing
```bash
# Development (default)
python scripts/run_new_tests.py --environment dev

# Staging
python scripts/run_new_tests.py --environment staging

# Production (with safety checks)
python scripts/run_new_tests.py --environment prod
```

#### Marker-Based Filtering
```bash
# Only functional tests (no data changes)
python scripts/run_new_tests.py --markers "functional and not mutating"

# Only integration tests
python scripts/run_new_tests.py --markers "integration"

# Skip slow tests
python scripts/run_new_tests.py --markers "not slow"
```

### Test Configuration

#### Environment Variables
```bash
# Required
export API_BASE_URL="https://your-api.workers.dev"
export API_KEY="your-api-key"

# Optional
export TEST_ENV="dev"                    # dev/staging/prod
export ALLOW_DATA_MUTATION="true"        # Allow data-changing tests
export CLEANUP_TEST_DATA="true"          # Clean up test data
export GITHUB_TOKEN="your-github-token"  # For integration tests
```

#### Test Data Configuration
Test data is configured in environment-specific YAML files:
- `data/test-data-dev.yaml` - Development test data
- `data/test-data-staging.yaml` - Staging test data
- `data/test-data-prod.yaml` - Production test data

## Safety Features

### Production Protection
- Mutating tests are disabled in production by default
- Extra safety checks and confirmations required
- Test data cleanup uses strict criteria

### Resource Management
- All created resources are tracked for cleanup
- Automatic cleanup after test completion
- Test resource identification patterns

### Error Handling
- Comprehensive error scenario testing
- Network timeout handling
- External service failure simulation

## Test Data Patterns

### Unique Resource Generation
```python
@pytest.fixture
def unique_slug():
    """Generate a unique slug for test data"""
    return f"test-{int(time.time())}"

@pytest.fixture
def test_content_file_data(test_data, unique_slug):
    """Generate test content file data with unique slug"""
    file_template = test_data['content_management']['test_files'][0]
    return {
        'type': file_template['type'],
        'slug': file_template['slug_template'].format(timestamp=int(time.time())),
        # ... other fields
    }
```

### Resource Cleanup
```python
@pytest.fixture
def created_resources(api_client):
    """Track and cleanup created resources"""
    resources = []
    yield resources
    
    # Cleanup only if enabled and for test resources
    if CLEANUP_TEST_DATA:
        for resource in resources:
            if is_test_resource(resource):
                try:
                    api_client.delete_access_rule(resource['type'], resource['slug'])
                except Exception as e:
                    print(f"Failed to cleanup resource: {e}")
```

## Mocking and Integration

### External Service Mocking
```python
# Mock GitHub API calls
with patch('api.src.services.github_service.GitHubService.createFile') as mock_create:
    mock_create.return_value = {'content': {'sha': 'abc123'}}
    response_data, status_code = api_client.create_content_file(test_data)
```

### Integration Testing
```python
@pytest.mark.integration
class TestContentSyncIntegration:
    def test_full_sync_workflow(self, api_client):
        # Test with real external services
        response_data, status_code = api_client.content_sync_manual({'full_sync': True})
        # Handle both success and failure cases
```

## Troubleshooting

### Common Issues

#### 1. Authentication Errors
```bash
# Check API key configuration
echo $API_KEY

# Verify API key is valid
curl -H "X-API-Key: $API_KEY" $API_BASE_URL/health
```

#### 2. External Service Errors
```bash
# Check GitHub token for integration tests
echo $GITHUB_TOKEN

# Verify R2 bucket access
# Check Cloudflare Workers environment variables
```

#### 3. Database Connection Issues
```bash
# Verify D1 database binding
# Check database schema migrations
# Ensure database is accessible from Workers
```

### Debug Mode
```bash
# Maximum verbosity
python scripts/run_new_tests.py --verbose

# Run single test
python scripts/run_new_tests.py --pattern "test_content_sync.py::TestContentSyncEndpoints::test_webhook_endpoint_exists"

# List available tests
python scripts/run_new_tests.py --list-tests
```

### Test Data Issues
- Verify test data templates use `{timestamp}` for uniqueness
- Check cleanup criteria match test resource patterns
- Ensure environment-specific data is properly configured

## Continuous Integration

### GitHub Actions Integration
```yaml
# .github/workflows/api-tests.yml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run API Tests
        run: |
          cd tests/api
          python scripts/run_new_tests.py --environment dev
        env:
          API_BASE_URL: ${{ secrets.API_BASE_URL }}
          API_KEY: ${{ secrets.API_KEY }}
```

### Test Reporting
- Pytest generates detailed test reports
- Coverage reports for code coverage analysis
- Test results include timing and failure details
- Integration with CI/CD pipelines for automated testing

## Best Practices

### Test Design
1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Mocking**: Mock external services for unit tests
4. **Integration**: Test real integrations separately
5. **Error Cases**: Test both success and failure scenarios

### Test Data
1. **Uniqueness**: Use timestamps for unique identifiers
2. **Templates**: Use configuration-driven test data
3. **Cleanup**: Implement proper cleanup mechanisms
4. **Environment**: Use environment-specific test data

### Test Execution
1. **Markers**: Use appropriate pytest markers
2. **Filtering**: Filter tests by environment and type
3. **Safety**: Implement production safety checks
4. **Monitoring**: Monitor test execution and results
