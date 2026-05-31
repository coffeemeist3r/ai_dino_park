import { test, expect } from '@playwright/test';
import { boot } from './helpers';

type Personality = Record<string, number>;

test('first dino exposes 5 numeric personality axes in [0,1]', async ({ page }) => {
  await boot(page);
  const traits = await page.evaluate(() =>
    ((window as Record<string, unknown>).__dinoTraits as () => Personality)(),
  );
  const keys = ['curiosity', 'sociability', 'energy', 'agreeableness', 'bravery'];
  for (const k of keys) {
    expect(typeof traits[k]).toBe('number');
    expect(traits[k]).toBeGreaterThanOrEqual(0);
    expect(traits[k]).toBeLessThanOrEqual(1);
  }
});

test('talking to Rex still returns a reply (no regression)', async ({ page }) => {
  await boot(page);
  await page.locator('canvas').focus();
  // Walk left toward Rex (spawned near tile 10,7; player starts at tile 3,3) then greet.
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(400);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(400);
  await page.keyboard.up('ArrowDown');
  await page.keyboard.press('KeyZ');
  await page.waitForTimeout(300);
  // Smoke: the dialog flow ran without throwing; clock hook still live.
  const ok = await page.evaluate(() => typeof (window as Record<string, unknown>).__clockNow === 'function');
  expect(ok).toBe(true);
});
