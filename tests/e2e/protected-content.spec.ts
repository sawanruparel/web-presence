import { test, expect } from '@playwright/test';

test.describe('Protected Content Access', () => {
  test('should access open content without authentication', async ({ page }) => {
    await page.goto('/notes/physical-interfaces');
    
    // Should load the content page directly
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('article')).toBeVisible();
    
    // Should not show access modal
    await expect(page.locator('[data-testid="access-modal"]')).not.toBeVisible();
  });

  test('should show password modal for password-protected content', async ({ page }) => {
    await page.goto('/ideas/local-first-ai');
    
    // Should show access modal
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
    
    // Should show password input
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Should show submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should authenticate with correct password', async ({ page }) => {
    await page.goto('/ideas/local-first-ai');
    
    // Wait for modal to appear
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
    
    // Enter correct password
    await page.fill('input[type="password"]', 'ideas-local-first-ai-n1wvs8');
    await page.click('button[type="submit"]');
    
    // Wait for authentication to complete
    await page.waitForLoadState('networkidle');
    
    // Modal should disappear and content should be visible
    await expect(page.locator('[data-testid="access-modal"]')).not.toBeVisible();
    await expect(page.locator('article')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should show error for incorrect password', async ({ page }) => {
    await page.goto('/ideas/local-first-ai');
    
    // Wait for modal to appear
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
    
    // Enter incorrect password
    await page.fill('input[type="password"]', 'wrong-password');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid password');
    
    // Modal should still be visible
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
  });

  test('should show email modal for email-list content', async ({ page }) => {
    await page.goto('/publications/decisionrecord-io');
    
    // Should show access modal
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
    
    // Should show email input
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // Should show submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should authenticate with authorized email', async ({ page }) => {
    await page.goto('/publications/decisionrecord-io');
    
    // Wait for modal to appear
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
    
    // Enter authorized email
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.click('button[type="submit"]');
    
    // Wait for authentication to complete
    await page.waitForLoadState('networkidle');
    
    // Modal should disappear and content should be visible
    await expect(page.locator('[data-testid="access-modal"]')).not.toBeVisible();
    await expect(page.locator('article')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should show error for unauthorized email', async ({ page }) => {
    await page.goto('/publications/decisionrecord-io');
    
    // Wait for modal to appear
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
    
    // Enter unauthorized email
    await page.fill('input[type="email"]', 'unauthorized@example.com');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('not authorized');
    
    // Modal should still be visible
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
  });

  test('should close modal when clicking outside', async ({ page }) => {
    await page.goto('/ideas/local-first-ai');
    
    // Wait for modal to appear
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
    
    // Click outside the modal
    await page.click('body', { position: { x: 10, y: 10 } });
    
    // Modal should close
    await expect(page.locator('[data-testid="access-modal"]')).not.toBeVisible();
  });

  test('should close modal when clicking close button', async ({ page }) => {
    await page.goto('/ideas/local-first-ai');
    
    // Wait for modal to appear
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
    
    // Click close button
    await page.click('[data-testid="close-button"]');
    
    // Modal should close
    await expect(page.locator('[data-testid="access-modal"]')).not.toBeVisible();
  });

  test('should remember authentication in session', async ({ page }) => {
    // First, authenticate
    await page.goto('/ideas/local-first-ai');
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
    await page.fill('input[type="password"]', 'ideas-local-first-ai-n1wvs8');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Navigate away and back
    await page.goto('/');
    await page.goto('/ideas/local-first-ai');
    
    // Should not show modal again (session remembered)
    await expect(page.locator('[data-testid="access-modal"]')).not.toBeVisible();
    await expect(page.locator('article')).toBeVisible();
  });
});
