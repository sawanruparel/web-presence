import { test, expect } from '@playwright/test';

test.describe('Frontend Navigation', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page loads without errors
    await expect(page).toHaveTitle(/Web Presence/);
    
    // Check for main navigation elements
    await expect(page.locator('nav')).toBeVisible();
    
    // Check for content sections
    await expect(page.locator('main')).toBeVisible();
  });

  test('should navigate to different content sections', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation to ideas section
    await page.click('text=Ideas');
    await expect(page).toHaveURL(/\/ideas/);
    
    // Test navigation to notes section
    await page.click('text=Notes');
    await expect(page).toHaveURL(/\/notes/);
    
    // Test navigation to publications section
    await page.click('text=Publications');
    await expect(page).toHaveURL(/\/publications/);
    
    // Test navigation to about page
    await page.click('text=About');
    await expect(page).toHaveURL(/\/about/);
  });

  test('should display content cards with proper information', async ({ page }) => {
    await page.goto('/ideas');
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="content-card"]', { timeout: 10000 });
    
    // Check that content cards are visible
    const contentCards = page.locator('[data-testid="content-card"]');
    await expect(contentCards).toHaveCountGreaterThan(0);
    
    // Check that each card has required elements
    const firstCard = contentCards.first();
    await expect(firstCard.locator('h3')).toBeVisible(); // Title
    await expect(firstCard.locator('p')).toBeVisible(); // Excerpt
    await expect(firstCard.locator('time')).toBeVisible(); // Date
  });

  test('should handle responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();
    
    // Check if mobile menu works (if implemented)
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    }
  });
});
