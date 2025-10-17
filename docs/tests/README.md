# Test Documentation

Testing documentation for the Web Presence project.

## Overview

The project includes comprehensive testing across multiple layers:
- **API Testing** - Backend API functionality and integration
- **E2E Testing** - End-to-end user workflows with Playwright
- **Manual Testing** - Manual testing procedures and test cases

## Documentation

- **[API Testing](./api-testing.md)** - Backend API test suite and procedures
- **[E2E Testing](./e2e-testing.md)** - End-to-end testing with Playwright
- **[Manual Testing](./manual-testing.md)** - Manual testing guide and test cases

## Quick Start

### API Testing

```bash
cd tests/api
npm install
npm test
```

### E2E Testing

```bash
npm run test:e2e
```

### Manual Testing

Follow the [Manual Testing Guide](./manual-testing.md) for step-by-step procedures.

## Test Types

### API Tests
- **Functional Tests** - API behavior and availability
- **Data Validation Tests** - CRUD operations and data integrity
- **Integration Tests** - End-to-end API workflows
- **Security Tests** - Authentication and authorization

### E2E Tests
- **User Journey Tests** - Complete user workflows
- **Cross-browser Tests** - Compatibility across browsers
- **Mobile Tests** - Responsive design and mobile functionality
- **Performance Tests** - Load time and responsiveness

### Manual Tests
- **Content Access Tests** - Access control system testing
- **UI/UX Tests** - User interface and experience
- **Integration Tests** - Frontend-backend integration
- **Edge Case Tests** - Error handling and edge cases

## Test Environment

### Prerequisites
- Node.js 18+
- Python 3.8+ (for API tests)
- Chrome, Firefox, Safari (for E2E tests)
- Backend API running (for integration tests)

### Environment Setup
- **Development** - Local testing with mock data
- **Staging** - Pre-production testing with real data
- **Production** - Live environment testing (read-only)

## Getting Help

- Check [API Testing](./api-testing.md) for backend test procedures
- See [E2E Testing](./e2e-testing.md) for frontend test automation
- Review [Manual Testing](./manual-testing.md) for manual test procedures
- Check test logs and reports for debugging
