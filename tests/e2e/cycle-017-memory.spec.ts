import { test, expect } from '@playwright/test';

async function boot(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });
}

test('a dino remembers a greeting, and it survives reload + reaches the prompt', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => ((window as Record<string, unknown>).__greet as (n: string) => unknown)('Rex'));

  const mem = await page.evaluate(() => ((window as Record<string, unknown>).__memory as () => Record<string, string[]>)());
  expect((mem.Rex ?? []).length).toBeGreaterThanOrEqual(1);

  // It reaches the prompt.
  const prompt = await page.evaluate(() =>
    ((window as Record<string, unknown>).__greetPrompt as (n: string) => string | null)('Rex'),
  );
  expect(prompt).toContain('Lately');

  // It persists across reload.
  await page.evaluate(() => ((window as Record<string, unknown>).__saveNow as () => Promise<unknown>)());
  await page.reload();
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForFunction(
    () => {
      const f = (window as Record<string, unknown>).__memory as undefined | (() => Record<string, string[]>);
      return !!f && (f().Rex ?? []).length >= 1;
    },
    { timeout: 8_000 },
  );
});
