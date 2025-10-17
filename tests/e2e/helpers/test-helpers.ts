import { Page, expect } from '@playwright/test';

/**
 * Helper functions for E2E tests
 */

export async function authenticateWithPassword(page: Page, password: string) {
  await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[data-testid="access-modal"]')).not.toBeVisible();
}

export async function authenticateWithEmail(page: Page, email: string) {
  await expect(page.locator('[data-testid="access-modal"]')).toBeVisible();
  await page.fill('input[type="email"]', email);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[data-testid="access-modal"]')).not.toBeVisible();
}

export async function expectErrorMessage(page: Page, expectedText?: string) {
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  if (expectedText) {
    await expect(page.locator('[data-testid="error-message"]')).toContainText(expectedText);
  }
}

export async function waitForContentToLoad(page: Page) {
  await page.waitForSelector('[data-testid="content-card"]', { timeout: 10000 });
}

export async function navigateToContentSection(page: Page, section: string) {
  await page.click(`text=${section}`);
  await expect(page).toHaveURL(new RegExp(`/${section.toLowerCase()}`));
}

export const TEST_PASSWORDS = {
  'local-first-ai': 'bright-eagle-4821',
  'sample-protected-idea': 'calm-ocean-1567'
} as const;

export const TEST_EMAILS = {
  'admin@example.com': true,
  'unauthorized@example.com': false
} as const;
