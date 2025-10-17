import { defineConfig, devices } from '@playwright/test';

/**
 * API-only Playwright configuration
 * This configuration is optimized for testing only the API endpoints
 * without any frontend dependencies or web server requirements.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Limit workers to prevent system overload */
  workers: 1, // Single worker for API tests to prevent rate limiting
  /* Global timeout for each test */
  timeout: 15000, // 15 seconds per test
  /* Global timeout for the entire test run */
  globalTimeout: 300000, // 5 minutes total
  /* Output directory for test results */
  outputDir: 'test-results/runs',
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['line'], ['html', { outputFolder: 'test-results/reports' }]],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* No baseURL needed for API tests */
    baseURL: undefined,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    /* Record video on failure */
    video: 'retain-on-failure',
    /* Timeout for navigation */
    navigationTimeout: 10000,
    /* Timeout for actions */
    actionTimeout: 5000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  /* No web server needed for API tests */
  // webServer: undefined,
});
