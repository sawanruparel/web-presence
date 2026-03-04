import { test, expect } from '@playwright/test';

test.describe('Frontend Navigation', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    // Title is the about page title
    await expect(page).toHaveTitle(/Sawan Ruparel/);

    // Check for main navigation
    await expect(page.locator('nav')).toBeVisible();

    // Check for main content area
    await expect(page.locator('main')).toBeVisible();
  });

  test('should navigate to different content sections', async ({ page }) => {
    await page.goto('/');

    // Navigate to start here section
    await page.click('a[href="/start-here"]');
    await expect(page).toHaveURL(/\/start-here/);

    // Navigate to ideas section
    await page.click('a[href="/ideas"]');
    await expect(page).toHaveURL(/\/ideas/);

    // Navigate to notes section
    await page.click('a[href="/notes"]');
    await expect(page).toHaveURL(/\/notes/);

    // Navigate to publications section
    await page.click('a[href="/publications"]');
    await expect(page).toHaveURL(/\/publications/);

    // Navigate back to about page (href="/about")
    await page.click('a[href="/about"]');
    await expect(page).toHaveURL(/\/about/);
  });

  test('should display content list items with proper information', async ({ page }) => {
    await page.goto('/ideas');

    // Wait for content items to appear
    await page.waitForSelector('[data-testid="content-card"]', { timeout: 10000 });

    const contentCards = page.locator('[data-testid="content-card"]');
    expect(await contentCards.count()).toBeGreaterThan(0);

    // Each card should have a title (h2) and metadata paragraph
    const firstCard = contentCards.first();
    await expect(firstCard.locator('h2')).toBeVisible();
    await expect(firstCard.locator('p').first()).toBeVisible();
  });

  test('should keep systems playbook route compatibility', async ({ page }) => {
    await page.goto('/notes');

    await expect(page).toHaveURL(/\/notes/);
    await expect(page.locator('h1')).toContainText('Systems Playbook');
  });

  test('should handle responsive design', async ({ page }) => {
    // Desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();

    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();
  });
});
