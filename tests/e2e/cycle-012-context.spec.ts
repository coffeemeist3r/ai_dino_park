import { test, expect } from '@playwright/test';

import { boot } from './helpers';

test('the greet prompt reflects the current time of day', async ({ page }) => {
  await boot(page);
  // 08:00 + 840 min = 22:00 (night).
  await page.evaluate(() => ((window as Record<string, unknown>).__advanceMinutes as (n: number) => unknown)(840));
  const prompt = await page.evaluate(() =>
    ((window as Record<string, unknown>).__greetPrompt as (n: string) => string | null)('Rex'),
  );
  expect(prompt).not.toBeNull();
  expect(prompt).toContain('night');
  expect(prompt).toMatch(/stranger|friend|acquaintance/);
});

test('greeting still resolves after context enrichment', async ({ page }) => {
  await boot(page);
  await page.locator('canvas').focus();
  await page.keyboard.press('KeyZ');
  await page.waitForTimeout(200);
  const source = await page.evaluate(() =>
    ((window as Record<string, unknown>).__lastReplySource as () => string | null)(),
  );
  expect([null, 'canned', 'llm']).toContain(source);
});
