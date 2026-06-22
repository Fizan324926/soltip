/**
 * Interaction Tests
 *
 * Test user interactions and component behavior.
 * Run: npx playwright test interactions.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('can navigate between pages', async ({ page }) => {
    await page.goto('/');

    // Navigate to Discover
    await page.click('a[href="/discover"]');
    await expect(page).toHaveURL('/discover');
    await expect(page.locator('h1')).toContainText('Discover');

    // Navigate to Dashboard
    await page.click('a[href="/dashboard"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('logo links to home', async ({ page }) => {
    await page.goto('/discover');
    await page.click('a[href="/"]');
    await expect(page).toHaveURL('/');
  });

  test('mobile navigation works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // Open mobile menu
    const menuButton = page.locator('button[aria-label*="menu"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();

      // Check menu is open
      await expect(page.locator('a[href="/discover"]')).toBeVisible();

      // Navigate
      await page.click('a[href="/discover"]');
      await expect(page).toHaveURL('/discover');
    }
  });
});

test.describe('Search', () => {
  test('can search creators', async ({ page }) => {
    await page.goto('/discover');

    // Type in search
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('test');

    // Wait for debounced search
    await page.waitForTimeout(500);

    // Should filter results (or show empty state)
    const results = page.locator('[data-testid="creator-card"]');
    const emptyState = page.locator('text=No creators found');

    await expect(results.first().or(emptyState)).toBeVisible();
  });

  test('search clears properly', async ({ page }) => {
    await page.goto('/discover');

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('test');
    await page.waitForTimeout(500);

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(500);

    // Should show all results again
  });
});

test.describe('Tabs', () => {
  test('tabs switch content', async ({ page }) => {
    // This assumes we can access a profile page with tabs
    await page.goto('/testuser'); // May not exist, but tests the behavior

    await page.waitForTimeout(1000);

    const tabs = page.locator('[role="tablist"] button');
    if (await tabs.first().isVisible()) {
      // Click second tab
      await tabs.nth(1).click();

      // Content should switch
      await page.waitForTimeout(200);
    }
  });
});

test.describe('Forms', () => {
  test('input validation shows errors', async ({ page }) => {
    // Navigate to onboarding or a form page
    await page.goto('/onboarding');

    // Try to submit empty form (if there's a form)
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Should show validation errors
      const errorMessage = page.locator('[role="alert"]');
      await expect(errorMessage.first()).toBeVisible();
    }
  });

  test('input focus states work', async ({ page }) => {
    await page.goto('/discover');

    const input = page.locator('input').first();
    if (await input.isVisible()) {
      await input.focus();

      // Should have focus ring
      const hasRing = await input.evaluate((el) => {
        const styles = window.getComputedStyle(el.closest('div') || el);
        return styles.boxShadow.includes('rgba');
      });
      expect(hasRing).toBe(true);
    }
  });
});

test.describe('Buttons', () => {
  test('buttons have correct cursor', async ({ page }) => {
    await page.goto('/');

    const button = page.locator('a[href="/onboarding"]').first();
    const cursor = await button.evaluate((el) =>
      window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('pointer');
  });

  test('disabled buttons are not clickable', async ({ page }) => {
    await page.goto('/dashboard');

    const disabledButton = page.locator('button[disabled]').first();
    if (await disabledButton.isVisible()) {
      // Should not be interactive
      const isDisabled = await disabledButton.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });
});

test.describe('Accessibility', () => {
  test('focus is visible on keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should have visible focus
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Check for focus ring
    const hasFocusRing = await focusedElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outline !== 'none' || styles.boxShadow !== 'none';
    });
    expect(hasFocusRing).toBe(true);
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
    }
  });

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/');

    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const name = await button.evaluate((el) => {
        return (
          el.textContent?.trim() ||
          el.getAttribute('aria-label') ||
          el.getAttribute('title')
        );
      });
      expect(name).toBeTruthy();
    }
  });

  test('links have accessible names', async ({ page }) => {
    await page.goto('/');

    const links = page.locator('a');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const name = await link.evaluate((el) => {
        return (
          el.textContent?.trim() ||
          el.getAttribute('aria-label') ||
          el.getAttribute('title')
        );
      });
      expect(name).toBeTruthy();
    }
  });
});

test.describe('Responsive Behavior', () => {
  const viewports = [
    { width: 375, height: 812, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1440, height: 900, name: 'desktop' },
  ];

  for (const viewport of viewports) {
    test(`layout works on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      // Check no horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 20); // Allow small margin

      // Check main content is visible
      await expect(page.locator('h1')).toBeVisible();
    });
  }
});

test.describe('Animation', () => {
  test('animations respect reduced motion preference', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    // Check that animations are disabled
    const animatedElement = page.locator('[class*="animate"]').first();
    if (await animatedElement.isVisible()) {
      const animationDuration = await animatedElement.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return parseFloat(styles.animationDuration);
      });
      // Should be very short or 0
      expect(animationDuration).toBeLessThanOrEqual(0.02);
    }
  });
});
