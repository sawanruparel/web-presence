import { test, expect } from '@playwright/test';
import { authenticateWithPassword, authenticateWithEmail, TEST_PASSWORDS, TEST_EMAILS } from './helpers/test-helpers';

test.describe('Full Integration Tests', () => {
  test('complete user journey: browse open content', async ({ page }) => {
    // Start at homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/Web Presence/);
    
    // Navigate to notes section
    await page.click('text=Notes');
    await expect(page).toHaveURL(/\/notes/);
    
    // Click on a note
    await page.click('text=Physical Interfaces');
    await expect(page).toHaveURL(/\/notes\/physical-interfaces/);
    
    // Verify content loads
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('article')).toBeVisible();
    
    // Navigate back to homepage
    await page.click('text=Home');
    await expect(page).toHaveURL('/');
  });

  test('complete user journey: access password-protected content', async ({ page }) => {
    // Start at homepage
    await page.goto('/');
    
    // Navigate to ideas section
    await page.click('text=Ideas');
    await expect(page).toHaveURL(/\/ideas/);
    
    // Click on protected idea
    await page.click('text=Local-First AI');
    await expect(page).toHaveURL(/\/ideas\/local-first-ai/);
    
    // Should show password modal
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
    
    // Authenticate
    await authenticateWithPassword(page, TEST_PASSWORDS['local-first-ai']);
    
    // Verify content loads
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('article')).toBeVisible();
    
    // Navigate to another protected idea
    await page.goto('/ideas/sample-protected-idea');
    
    // Should not show modal again (session remembered)
    await expect(page.locator('[data-testid="access-modal"]')).not.toBeVisible();
    await expect(page.locator('article')).toBeVisible();
  });

  test('complete user journey: access email-list content', async ({ page }) => {
    // Start at homepage
    await page.goto('/');
    
    // Navigate to publications section
    await page.click('text=Publications');
    await expect(page).toHaveURL(/\/publications/);
    
    // Click on protected publication
    await page.click('text=DecisionRecord.io');
    await expect(page).toHaveURL(/\/publications\/decisionrecord-io/);
    
    // Should show email modal
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
    
    // Authenticate with authorized email
    await authenticateWithEmail(page, 'admin@example.com');
    
    // Verify content loads
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('article')).toBeVisible();
  });

  test('cross-browser compatibility: all access modes', async ({ page, browserName }) => {
    console.log(`Testing with ${browserName}`);
    
    // Test open content
    await page.goto('/notes/physical-interfaces');
    await expect(page.locator('article')).toBeVisible();
    
    // Test password-protected content
    await page.goto('/ideas/local-first-ai');
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
    await authenticateWithPassword(page, TEST_PASSWORDS['local-first-ai']);
    await expect(page.locator('article')).toBeVisible();
    
    // Test email-list content
    await page.goto('/publications/decisionrecord-io');
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
    await authenticateWithEmail(page, 'admin@example.com');
    await expect(page.locator('article')).toBeVisible();
  });

  test('mobile responsiveness: all content types', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test homepage
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();
    
    // Test open content
    await page.goto('/notes/physical-interfaces');
    await expect(page.locator('article')).toBeVisible();
    
    // Test password-protected content
    await page.goto('/ideas/local-first-ai');
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
    await authenticateWithPassword(page, TEST_PASSWORDS['local-first-ai']);
    await expect(page.locator('article')).toBeVisible();
    
    // Test email-list content
    await page.goto('/publications/decisionrecord-io');
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
    await authenticateWithEmail(page, 'admin@example.com');
    await expect(page.locator('article')).toBeVisible();
  });

  test('session management: mixed content access', async ({ page }) => {
    // Access password-protected content
    await page.goto('/ideas/local-first-ai');
    await authenticateWithPassword(page, TEST_PASSWORDS['local-first-ai']);
    
    // Access email-list content
    await page.goto('/publications/decisionrecord-io');
    await authenticateWithEmail(page, 'admin@example.com');
    
    // Navigate between different content types
    await page.goto('/ideas/local-first-ai');
    await expect(page.locator('[data-testid="access-modal"]')).not.toBeVisible();
    
    await page.goto('/publications/decisionrecord-io');
    await expect(page.locator('[data-testid="access-modal"]')).not.toBeVisible();
    
    await page.goto('/notes/physical-interfaces');
    await expect(page.locator('article')).toBeVisible();
  });

  test('error recovery: wrong credentials then correct', async ({ page }) => {
    await page.goto('/ideas/local-first-ai');
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
    
    // Try wrong password
    await page.fill('input[type="password"]', 'wrong-password');
    await page.click('button[type="submit"]');
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    
    // Try correct password
    await page.fill('input[type="password"]', '');
    await page.fill('input[type="password"]', TEST_PASSWORDS['local-first-ai']);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Should work
    await expect(page.locator('[data-testid="access-modal"]')).not.toBeVisible();
    await expect(page.locator('article')).toBeVisible();
  });

  test('performance: content loading times', async ({ page }) => {
    const startTime = Date.now();
    
    // Test open content loading
    await page.goto('/notes/physical-interfaces');
    await expect(page.locator('article')).toBeVisible();
    const openContentTime = Date.now() - startTime;
    console.log(`Open content loaded in ${openContentTime}ms`);
    
    // Test protected content loading
    const protectedStartTime = Date.now();
    await page.goto('/ideas/local-first-ai');
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
    await authenticateWithPassword(page, TEST_PASSWORDS['local-first-ai']);
    await expect(page.locator('article')).toBeVisible();
    const protectedContentTime = Date.now() - protectedStartTime;
    console.log(`Protected content loaded in ${protectedContentTime}ms`);
    
    // Both should load reasonably quickly (under 5 seconds)
    expect(openContentTime).toBeLessThan(5000);
    expect(protectedContentTime).toBeLessThan(5000);
  });
});
