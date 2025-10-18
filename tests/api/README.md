# API Tests

This directory contains comprehensive test suites for the Web Presence API.

## Test Structure

### Test Categories

- **Functional Tests** (`tests/functional/`): Test API behavior and endpoint availability
- **Data Validation Tests** (`tests/data_validation/`): Test CRUD operations and data integrity
- **Integration Tests**: Test external service integrations (GitHub, R2, D1)

### New Test Files

#### Content Sync Tests
- `test_content_sync.py` - Basic content sync endpoint tests
- `test_content_sync_integration.py` - GitHub webhook and R2 integration tests

#### Content Management Tests  
- `test_content_management.py` - Basic content management CRUD tests
- `test_content_management_integration.py` - GitHub API integration tests

#### Access Control Tests
- `test_access_control_api.py` - New access control API CRUD tests

## Running Tests

### Quick Start
```bash
# Run all new tests
python scripts/run_new_tests.py

# Run specific test category
python scripts/run_new_tests.py --pattern "test_content_sync"

# Run with verbose output
python scripts/run_new_tests.py --verbose

# Run only functional tests (no mutations)
python scripts/run_new_tests.py --markers "functional and not mutating"
```

### Environment-Specific Testing
```bash
# Development (default)
python scripts/run_new_tests.py --environment dev

# Staging
python scripts/run_new_tests.py --environment staging

# Production (extra safety checks)
python scripts/run_new_tests.py --environment prod
```

### Test Markers
- `functional` - Tests API behavior without data changes
- `data_validation` - Tests CRUD operations and data integrity
- `mutating` - Tests that create/modify/delete data
- `integration` - Tests external service integrations
- `slow` - Tests that take longer to run

## Test Data

Test data is configured in `data/test-data-{environment}.yaml` files:
- `test-data-dev.yaml` - Development test data
- `test-data-staging.yaml` - Staging test data  
- `test-data-prod.yaml` - Production test data

## Configuration

Tests use environment variables for configuration:
- `TEST_ENV` - Test environment (dev/staging/prod)
- `API_BASE_URL` - API base URL
- `API_KEY` - API authentication key
- `ALLOW_DATA_MUTATION` - Allow data-changing tests
- `CLEANUP_TEST_DATA` - Clean up test data after tests

## Safety Features

- **Production Protection**: Mutating tests are disabled in production by default
- **Test Data Cleanup**: Automatic cleanup of test resources
- **Resource Tracking**: All created resources are tracked for cleanup
- **Environment Isolation**: Different test data per environment

## Test Client

The `APITestClient` provides convenient methods for all API endpoints:
- Content sync endpoints
- Content management endpoints  
- Access control API endpoints
- Authentication and error handling

## Fixtures

Pytest fixtures provide test data and utilities:
- `test_content_file_data` - Sample content file data
- `test_access_control_*_rule` - Access control rule test data
- `created_resources` - Tracks resources for cleanup
- `skip_if_no_mutation` - Skips mutating tests when disabled

## Troubleshooting

### Common Issues

1. **API Key Missing**: Ensure `API_KEY` environment variable is set
2. **GitHub Token Missing**: Some integration tests require `GITHUB_TOKEN`
3. **Database Connection**: Ensure D1 database is accessible
4. **R2 Access**: Ensure R2 buckets are accessible

### Debug Mode
```bash
# Run with maximum verbosity
python scripts/run_new_tests.py --verbose

# Run single test file
python scripts/run_new_tests.py --pattern "test_content_sync.py::TestContentSyncEndpoints::test_webhook_endpoint_exists"
```

### Test Data Issues
- Check `data/test-data-{env}.yaml` for correct configuration
- Verify test data templates use `{timestamp}` for unique slugs
- Ensure cleanup criteria match test resource patterns