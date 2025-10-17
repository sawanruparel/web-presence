# E2E Tests for Web Presence

This directory contains comprehensive end-to-end tests for the Web Presence application using Playwright.

## Test Structure

### Test Files

- **`api-health.spec.ts`** - Tests API health and connectivity
- **`access-control.spec.ts`** - Tests the access control system (open, password, email-list)
- **`frontend-navigation.spec.ts`** - Tests frontend navigation and UI components
- **`protected-content.spec.ts`** - Tests protected content access flows
- **`content-rendering.spec.ts`** - Tests content rendering and markdown processing
- **`error-handling.spec.ts`** - Tests error handling and edge cases
- **`full-integration.spec.ts`** - Tests complete user journeys and cross-browser compatibility

### Helper Files

- **`helpers/test-helpers.ts`** - Shared helper functions for tests

## Running Tests

### Prerequisites

1. Ensure the API is deployed and accessible at `https://web-presence-api.quoppo.workers.dev`
2. Ensure the frontend is built and served locally or deployed
3. Install dependencies: `npm install`

### Test Commands

```bash
# Run all tests
npm run test:e2e

# Run tests with UI (interactive mode)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# Show test report
npm run test:e2e:report
```

### Environment Variables

- `FRONTEND_URL` - URL of the frontend (default: `http://localhost:5173`)
- `CI` - Set to `true` in CI environments

## Test Coverage

### API Tests
- ✅ Health check endpoint
- ✅ CORS preflight requests
- ✅ Access control checks for all modes
- ✅ Password verification
- ✅ Email verification
- ✅ Protected content retrieval
- ✅ Error handling

### Frontend Tests
- ✅ Homepage loading
- ✅ Navigation between sections
- ✅ Content card display
- ✅ Responsive design
- ✅ Access modal functionality
- ✅ Authentication flows
- ✅ Session management
- ✅ Error handling

### Integration Tests
- ✅ Complete user journeys
- ✅ Cross-browser compatibility
- ✅ Mobile responsiveness
- ✅ Performance testing
- ✅ Error recovery

## Test Data

### Test Passwords
- `local-first-ai`: `ideas-local-first-ai-n1wvs8`
- `sample-protected-idea`: `ideas-sample-protected-idea-xyz123`

### Test Emails
- `admin@example.com`: Authorized
- `unauthorized@example.com`: Not authorized

## Browser Support

Tests run on:
- Chromium (Desktop Chrome)
- Firefox (Desktop Firefox)
- WebKit (Desktop Safari)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

## Configuration

The tests are configured in `playwright.config.ts`:
- Base URL: `http://localhost:5173` (or `FRONTEND_URL` env var)
- Parallel execution enabled
- Retry on failure (2 retries in CI)
- Screenshots on failure
- Video recording on failure
- Trace collection on first retry

## Debugging

### View Test Results
```bash
npm run test:e2e:report
```

### Debug Specific Test
```bash
npx playwright test tests/e2e/protected-content.spec.ts --debug
```

### Run Single Test
```bash
npx playwright test tests/e2e/protected-content.spec.ts -g "should authenticate with correct password"
```

## Continuous Integration

The tests are designed to run in CI environments:
- Headless mode by default
- Retry failed tests
- Generate HTML reports
- Screenshot and video artifacts on failure

## Maintenance

### Adding New Tests
1. Create new test file in `tests/e2e/`
2. Import necessary helpers from `helpers/test-helpers.ts`
3. Follow existing patterns for consistency
4. Add test data to `test-helpers.ts` if needed

### Updating Test Data
- Update passwords in `TEST_PASSWORDS` constant
- Update emails in `TEST_EMAILS` constant
- Ensure API has corresponding test data

### Debugging Failures
1. Check test report for screenshots/videos
2. Use `--debug` mode to step through tests
3. Verify API is accessible and responding
4. Check frontend is built and served correctly
