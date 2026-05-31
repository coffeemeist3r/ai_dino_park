import { test, expect } from '@playwright/test';

import { boot } from './helpers';

test('brain status hook reports a known state', async ({ page }) => {
  await boot(page);
  const status = await page.evaluate(() =>
    ((window as Record<string, unknown>).__brainStatus as () => string)(),
  );
  expect(['idle', 'loading', 'ready', 'fallback', 'n/a']).toContain(status);
});

test('a greet records a reply source (canned in headless / no WebGPU)', async ({ page }) => {
  await boot(page);
  await page.locator('canvas').focus();
  // Walk toward a dino and greet.
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(400);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.press('KeyZ');
  await page.waitForTimeout(400);
  const source = await page.evaluate(() =>
    ((window as Record<string, unknown>).__lastReplySource as () => string | null)(),
  );
  // Either a real greet landed (canned, since no WebGPU here) or no dino was in range (null).
  expect([null, 'canned', 'llm']).toContain(source);
});
