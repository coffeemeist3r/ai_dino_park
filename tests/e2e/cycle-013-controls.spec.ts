import { test, expect } from '@playwright/test';

import { boot as bootBase } from './helpers';

async function boot(page: import('@playwright/test').Page) {
  await bootBase(page);
  await page.locator('canvas').focus();
}

test('WASD moves the player', async ({ page }) => {
  await boot(page);
  const x0 = await page.evaluate(() => ((window as Record<string, unknown>).__playerPos as () => { x: number })().x);
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(250);
  await page.keyboard.up('KeyD');
  const x1 = await page.evaluate(() => ((window as Record<string, unknown>).__playerPos as () => { x: number })().x);
  expect(x1).toBeGreaterThan(x0);
});

test('E interacts and F gives without error', async ({ page }) => {
  await boot(page);
  // Walk toward a dino, then talk with E.
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(300);
  await page.keyboard.up('KeyD');
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(200);
  // F to give — should not throw; brain hook still live.
  await page.keyboard.press('KeyF');
  await page.waitForTimeout(100);
  const ok = await page.evaluate(() => typeof (window as Record<string, unknown>).__brainStatus === 'function');
  expect(ok).toBe(true);
});
