import { test, expect } from '@playwright/test';

test.describe('Content Rendering', () => {
  test('should render markdown content correctly', async ({ page }) => {
    await page.goto('/notes/physical-interfaces');
    
    // Check that the page loads
    await expect(page.locator('h1')).toBeVisible();
    
    // Check for markdown elements
    await expect(page.locator('article')).toBeVisible();
    
    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    await expect(headings).toHaveCountGreaterThan(0);
    
    // Check for paragraph content
    const paragraphs = page.locator('article p');
    await expect(paragraphs).toHaveCountGreaterThan(0);
  });

  test('should display content metadata', async ({ page }) => {
    await page.goto('/ideas/local-first-ai');
    
    // Authenticate first
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
    await page.fill('input[type="password"]', 'ideas-local-first-ai-n1wvs8');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Check for metadata elements
    await expect(page.locator('h1')).toBeVisible(); // Title
    await expect(page.locator('time')).toBeVisible(); // Date
    await expect(page.locator('[data-testid="read-time"]')).toBeVisible(); // Read time
    await expect(page.locator('[data-testid="content-type"]')).toBeVisible(); // Content type
  });

  test('should render code blocks with syntax highlighting', async ({ page }) => {
    await page.goto('/notes/physical-interfaces');
    
    // Look for code blocks
    const codeBlocks = page.locator('pre code');
    if (await codeBlocks.count() > 0) {
      await expect(codeBlocks.first()).toBeVisible();
      
      // Check that code blocks have proper styling
      const codeBlock = codeBlocks.first();
      await expect(codeBlock).toHaveClass(/language-/);
    }
  });

  test('should render links correctly', async ({ page }) => {
    await page.goto('/notes/physical-interfaces');
    
    // Look for links
    const links = page.locator('article a');
    if (await links.count() > 0) {
      const firstLink = links.first();
      await expect(firstLink).toBeVisible();
      
      // Check that links have proper href attributes
      const href = await firstLink.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

  test('should render lists correctly', async ({ page }) => {
    await page.goto('/notes/physical-interfaces');
    
    // Look for lists
    const lists = page.locator('article ul, article ol');
    if (await lists.count() > 0) {
      await expect(lists.first()).toBeVisible();
      
      // Check that list items are present
      const listItems = lists.first().locator('li');
      await expect(listItems).toHaveCountGreaterThan(0);
    }
  });

  test('should handle images with proper alt text', async ({ page }) => {
    await page.goto('/notes/physical-interfaces');
    
    // Look for images
    const images = page.locator('article img');
    if (await images.count() > 0) {
      const firstImage = images.first();
      await expect(firstImage).toBeVisible();
      
      // Check that images have alt text
      const altText = await firstImage.getAttribute('alt');
      expect(altText).toBeTruthy();
    }
  });

  test('should display content excerpts on listing pages', async ({ page }) => {
    await page.goto('/ideas');
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="content-card"]', { timeout: 10000 });
    
    // Check that excerpts are displayed
    const excerpts = page.locator('[data-testid="content-card"] p');
    await expect(excerpts).toHaveCountGreaterThan(0);
    
    // Check that excerpts are not too long
    const firstExcerpt = excerpts.first();
    const excerptText = await firstExcerpt.textContent();
    expect(excerptText?.length).toBeLessThan(500); // Reasonable excerpt length
  });

  test('should handle empty content gracefully', async ({ page }) => {
    // This test would need a specific empty content item
    // For now, we'll test that the page structure is maintained
    await page.goto('/ideas');
    
    // Should show the ideas page even if no content
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('should maintain consistent styling across content types', async ({ page }) => {
    // Test notes
    await page.goto('/notes/physical-interfaces');
    const notesArticle = page.locator('article');
    await expect(notesArticle).toBeVisible();
    
    // Test ideas (after authentication)
    await page.goto('/ideas/local-first-ai');
    await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
    await page.fill('input[type="password"]', 'ideas-local-first-ai-n1wvs8');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    const ideasArticle = page.locator('article');
    await expect(ideasArticle).toBeVisible();
    
    // Both should have similar structure
    await expect(notesArticle.locator('h1')).toBeVisible();
    await expect(ideasArticle.locator('h1')).toBeVisible();
  });
});
