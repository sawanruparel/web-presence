# API Tests

Backend API test suite for the Web Presence project.

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run specific test suite
npm test -- --testPathPattern=functional
```

## Documentation

For detailed documentation, see:
- **[Test Documentation](../docs/tests/README.md)** - Complete testing reference
- **[API Testing](../docs/tests/api-testing.md)** - Backend API test suite and procedures
- **[E2E Testing](../docs/tests/e2e-testing.md)** - End-to-end testing with Playwright
- **[Manual Testing](../docs/tests/manual-testing.md)** - Manual testing guide

## Test Types

- **Functional Tests** - API behavior and availability
- **Data Validation Tests** - CRUD operations and data integrity
- **Integration Tests** - End-to-end API workflows
- **Security Tests** - Authentication and authorization

## Prerequisites

- Python 3.8+
- Backend API running (for integration tests)
- Test data configured