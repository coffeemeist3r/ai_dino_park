import { test, expect } from '@playwright/test';
import { boot } from './helpers';

test('the device probe resolves a known model tier', async ({ page }) => {
  await boot(page);
  const info = await page.evaluate(() =>
    ((window as Record<string, unknown>).__modelInfo as () => Promise<{ tier: string; id: string }>)(),
  );
  expect(['tiny', 'small', 'medium']).toContain(info.tier);
  expect(typeof info.id).toBe('string');
});
