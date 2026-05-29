import { test, expect } from '@playwright/test';

type Tint = { color: number; alpha: number };

test('day/night overlay exposes a live tint', async ({ page }) => {
  await page.goto('/');
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });
  const t = await page.evaluate(() => {
    const fn = (window as Record<string, unknown>).__readTint;
    return typeof fn === 'function' ? (fn as () => Tint)() : null;
  });
  expect(t).not.toBeNull();
  expect(typeof (t as Tint).color).toBe('number');
  expect(typeof (t as Tint).alpha).toBe('number');
});

test('forcing midnight darkens and noon clears the overlay', async ({ page }) => {
  await page.goto('/');
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });

  const midnight = await page.evaluate(() =>
    ((window as Record<string, unknown>).__forceHour as (h: number) => Tint)(0),
  );
  expect(midnight.alpha).toBeGreaterThanOrEqual(0.45);

  const noon = await page.evaluate(() =>
    ((window as Record<string, unknown>).__forceHour as (h: number) => Tint)(12),
  );
  expect(noon.alpha).toBeLessThanOrEqual(0.05);
});
