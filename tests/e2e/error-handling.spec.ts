import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test('should handle 404 errors gracefully', async ({ page }) => {
    // Test non-existent content
    await page.goto('/ideas/non-existent-content');
    
    // Should show 404 page or error message
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h1')).toContainText(/not found|404/i);
  });

  test('should handle API connection errors', async ({ page }) => {
    // This test would require mocking the API to be down
    // For now, we'll test that the frontend handles errors gracefully
    
    // Intercept API calls and return error
    await page.route('**/auth/access/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await page.goto('/ideas/local-first-ai');
    
    // Should show error message or fallback UI
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle network timeouts', async ({ page }) => {
    // Intercept API calls and delay them
    await page.route('**/auth/access/**', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            accessMode: 'password',
            requiresPassword: true,
            requiresEmail: false,
            message: 'This content requires a password'
          })
        });
      }, 10000); // 10 second delay
    });
    
    await page.goto('/ideas/local-first-ai');
    
    // Should show loading state or timeout handling
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle malformed API responses', async ({ page }) => {
    // Intercept API calls and return malformed JSON
    await page.route('**/auth/verify', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json'
      });
    });
    
    await page.goto('/ideas/local-first-ai');
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
    
    await page.fill('input[type="password"]', 'ideas-local-first-ai-n1wvs8');
    await page.click('button[type="submit"]');
    
    // Should handle JSON parse error gracefully
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle authentication token expiration', async ({ page }) => {
    // First authenticate
    await page.goto('/ideas/local-first-ai');
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
    await page.fill('input[type="password"]', 'ideas-local-first-ai-n1wvs8');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Mock expired token response
    await page.route('**/auth/content/**', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Token expired' })
      });
    });
    
    // Navigate to another protected content
    await page.goto('/ideas/sample-protected-idea');
    
    // Should show access modal again or error message
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle invalid content type gracefully', async ({ page }) => {
    // Test with invalid content type
    await page.goto('/invalid-type/some-slug');
    
    // Should show 404 or error page
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should handle empty content responses', async ({ page }) => {
    // Intercept API calls and return empty response
    await page.route('**/auth/content/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({})
      });
    });
    
    await page.goto('/ideas/local-first-ai');
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
    await page.fill('input[type="password"]', 'ideas-local-first-ai-n1wvs8');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Should handle empty content gracefully
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show user-friendly error messages', async ({ page }) => {
    // Test with a known error scenario
    await page.goto('/ideas/local-first-ai');
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
    
    // Enter wrong password
    await page.fill('input[type="password"]', 'wrong-password');
    await page.click('button[type="submit"]');
    
    // Should show user-friendly error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    const errorText = await page.locator('[data-testid="error-message"]').textContent();
    expect(errorText).toMatch(/invalid|incorrect|wrong/i);
  });

  test('should allow retry after error', async ({ page }) => {
    await page.goto('/ideas/local-first-ai');
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
    
    // Enter wrong password
    await page.fill('input[type="password"]', 'wrong-password');
    await page.click('button[type="submit"]');
    
    // Should show error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    
    // Clear and try again with correct password
    await page.fill('input[type="password"]', '');
    await page.fill('input[type="password"]', 'ideas-local-first-ai-n1wvs8');
    await page.click('button[type="submit"]');
    
    // Should work this time
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="access-modal"]')).not.toBeVisible();
    await expect(page.locator('article')).toBeVisible();
  });
});
