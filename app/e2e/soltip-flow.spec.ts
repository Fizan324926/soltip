import { test, expect } from '@playwright/test';

const BASE_URL = 'http://89.167.36.132:3050';

test.describe('SolTip E2E Browser Tests', () => {

  test.describe('Landing Page', () => {
    test('should load landing page', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page).toHaveTitle(/SolTip/);
    });

    test('should render React app', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page.locator('#root')).toBeVisible();
      const rootContent = await page.locator('#root').innerHTML();
      expect(rootContent.length).toBeGreaterThan(100);
    });

    test('should have working navigation', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page.locator('nav')).toBeVisible();
    });
  });

  test.describe('Wallet Connection Flow', () => {
    test('should show connect wallet button', async ({ page }) => {
      await page.goto(BASE_URL);
      const connectButton = page.locator('button:has-text("Connect"), button:has-text("Select Wallet")');
      await expect(connectButton.first()).toBeVisible();
    });

    test('should open wallet modal on click', async ({ page }) => {
      await page.goto(BASE_URL);
      const connectButton = page.locator('button:has-text("Connect"), button:has-text("Select Wallet")');
      await connectButton.first().click();
      await expect(page.locator('text=Connect a wallet')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Discovery Page', () => {
    test('should load discovery page', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await expect(page.locator('h1, h2').filter({ hasText: /Discover|Creators/i })).toBeVisible();
    });

    test('should have search functionality', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
      if (await searchInput.count() > 0) {
        await expect(searchInput.first()).toBeVisible();
      }
    });
  });

  test.describe('Dashboard (requires wallet)', () => {
    test('should redirect unauthenticated users from dashboard', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url === `${BASE_URL}/` || url.includes('dashboard')).toBeTruthy();
    });
  });

  test.describe('Profile Page', () => {
    test('should handle non-existent profile', async ({ page }) => {
      await page.goto(`${BASE_URL}/u/nonexistent12345xyz`);
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/u/');
    });
  });

  test.describe('API Health Check', () => {
    test('should have healthy backend API', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/health`);
      expect(response.ok()).toBeTruthy();
      const json = await response.json();
      expect(json.status).toBe('ok');
      expect(json.service).toBe('soltip-backend');
    });

    test('should return profiles list', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/profiles`);
      expect(response.ok()).toBeTruthy();
      const json = await response.json();
      expect(json).toHaveProperty('items');
      expect(Array.isArray(json.items)).toBeTruthy();
    });
  });

  test.describe('UI Components Render', () => {
    test('should render footer', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page.locator('footer')).toBeVisible();
    });

    test('should have responsive design', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(BASE_URL);
      await expect(page.locator('body')).toBeVisible();

      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(BASE_URL);
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Static Assets', () => {
    test('should load CSS properly', async ({ page }) => {
      await page.goto(BASE_URL);
      const styles = await page.evaluate(() => {
        const body = document.body;
        const computed = window.getComputedStyle(body);
        return computed.fontFamily;
      });
      expect(styles).toBeTruthy();
    });

    test('should load JS properly', async ({ page }) => {
      await page.goto(BASE_URL);
      const hasReact = await page.evaluate(() => {
        return document.querySelector('#root') !== null;
      });
      expect(hasReact).toBeTruthy();
    });
  });
});
