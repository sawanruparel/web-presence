import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:5175';
const OUT = '/tmp/design-review';

const desktopPages = [
  { name: 'about',        path: '/' },
  { name: 'notes',        path: '/notes' },
  { name: 'ideas',        path: '/ideas' },
  { name: 'publications', path: '/publications' },
  { name: 'contact',      path: '/contact' },
];

test('desktop — all pages (1440px)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const { name, path } of desktopPages) {
    await page.goto(`${BASE_URL}${path}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${OUT}/desktop-${name}.png`, fullPage: true });
  }
});

test('desktop — dark mode (1440px)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // Force dark mode via system media query emulation
  await page.emulateMedia({ colorScheme: 'dark' });
  for (const { name, path } of desktopPages) {
    await page.goto(`${BASE_URL}${path}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${OUT}/dark-${name}.png`, fullPage: true });
  }
});

test('mobile — all pages (390px iPhone 14)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const { name, path } of desktopPages) {
    await page.goto(`${BASE_URL}${path}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${OUT}/mobile-${name}.png`, fullPage: true });
  }
});
