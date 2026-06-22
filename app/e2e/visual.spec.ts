/**
 * Visual Regression Tests
 *
 * Screenshots of key pages at different viewports.
 * Run: npx playwright test visual.spec.ts
 */

import { test, expect, type Page } from '@playwright/test';

// Viewports to test
const VIEWPORTS = {
  mobile: { width: 375, height: 812 },   // iPhone X
  tablet: { width: 768, height: 1024 },  // iPad
  desktop: { width: 1440, height: 900 }, // MacBook
} as const;

// Pages to screenshot
const PAGES = [
  { name: 'landing', path: '/' },
  { name: 'discover', path: '/discover' },
  { name: 'dashboard', path: '/dashboard' },
] as const;

async function waitForPage(page: Page): Promise<void> {
  // Wait for hydration
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500); // Allow animations to complete
}

test.describe('Visual Regression', () => {
  for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
    test.describe(`${viewportName} (${viewport.width}x${viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize(viewport);
      });

      for (const { name, path } of PAGES) {
        test(`${name} page`, async ({ page }) => {
          await page.goto(path);
          await waitForPage(page);

          // Take screenshot
          const screenshot = await page.screenshot({ fullPage: true });
          expect(screenshot).toMatchSnapshot(`${name}-${viewportName}.png`);
        });
      }
    });
  }
});

test.describe('Component Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
  });

  test('navbar', async ({ page }) => {
    await page.goto('/');
    await waitForPage(page);

    const navbar = page.locator('nav').first();
    const screenshot = await navbar.screenshot();
    expect(screenshot).toMatchSnapshot('navbar.png');
  });

  test('footer', async ({ page }) => {
    await page.goto('/');
    await waitForPage(page);

    const footer = page.locator('footer').first();
    const screenshot = await footer.screenshot();
    expect(screenshot).toMatchSnapshot('footer.png');
  });

  test('hero section', async ({ page }) => {
    await page.goto('/');
    await waitForPage(page);

    const hero = page.locator('section').first();
    const screenshot = await hero.screenshot();
    expect(screenshot).toMatchSnapshot('hero.png');
  });
});

test.describe('Interaction States', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
  });

  test('button hover states', async ({ page }) => {
    await page.goto('/');
    await waitForPage(page);

    // Find primary button and hover
    const button = page.locator('a[href="/onboarding"]').first();
    await button.hover();
    await page.waitForTimeout(200);

    const screenshot = await button.screenshot();
    expect(screenshot).toMatchSnapshot('button-hover.png');
  });

  test('mobile menu open', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/');
    await waitForPage(page);

    // Open hamburger menu
    const menuButton = page.locator('button[aria-label*="menu"]').first();
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(300);

      const screenshot = await page.screenshot();
      expect(screenshot).toMatchSnapshot('mobile-menu-open.png');
    }
  });
});

test.describe('Error States', () => {
  test('404 page', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/nonexistent-page-12345');
    await waitForPage(page);

    const screenshot = await page.screenshot();
    expect(screenshot).toMatchSnapshot('404.png');
  });

  test('profile not found', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/nonexistent_user_xyz123');
    await waitForPage(page);

    // Wait for profile fetch to complete
    await page.waitForTimeout(1000);

    const screenshot = await page.screenshot();
    expect(screenshot).toMatchSnapshot('profile-not-found.png');
  });
});

test.describe('Loading States', () => {
  test('skeleton loading', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);

    // Slow down network to catch loading state
    await page.route('**/api/**', async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.continue();
    });

    await page.goto('/discover');

    // Catch the loading state
    const skeleton = page.locator('.skeleton').first();
    if (await skeleton.isVisible({ timeout: 1000 })) {
      const screenshot = await page.screenshot();
      expect(screenshot).toMatchSnapshot('discover-loading.png');
    }
  });
});

test.describe('Responsive Layout', () => {
  test('stats grid responsive', async ({ page }) => {
    for (const [name, viewport] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await waitForPage(page);

      // Find stats section
      const statsSection = page.locator('section').nth(1);
      if (await statsSection.isVisible()) {
        const screenshot = await statsSection.screenshot();
        expect(screenshot).toMatchSnapshot(`stats-${name}.png`);
      }
    }
  });

  test('features grid responsive', async ({ page }) => {
    for (const [name, viewport] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await waitForPage(page);

      // Scroll to features
      await page.evaluate(() => window.scrollTo(0, 800));
      await page.waitForTimeout(300);

      const screenshot = await page.screenshot({ fullPage: false });
      expect(screenshot).toMatchSnapshot(`features-${name}.png`);
    }
  });
});
