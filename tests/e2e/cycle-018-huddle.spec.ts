import { test, expect } from '@playwright/test';

async function boot(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });
}

test('bonded dinos huddle at the den at night', async ({ page }) => {
  await boot(page);

  // Force a strong bond between Rex and Mossback.
  await page.evaluate(() =>
    ((window as Record<string, unknown>).__bondPair as (a: string, b: string) => number)('Rex', 'Mossback'),
  );

  // Advance into night (08:00 + 840 min = 22:00).
  await page.evaluate(() => ((window as Record<string, unknown>).__advanceMinutes as (n: number) => unknown)(840));

  // Run enough deterministic night steps for them to reach the den (max map distance < 40).
  const huddlers = await page.evaluate(() => {
    const step = (window as Record<string, unknown>).__stepWorld as () => unknown;
    const who = (window as Record<string, unknown>).__huddlers as () => string[];
    for (let i = 0; i < 45; i++) step();
    return who();
  });

  expect(huddlers).toContain('Rex');
  expect(huddlers).toContain('Mossback');
});

test('bonds strengthen on meeting and persist across reload', async ({ page }) => {
  await boot(page);
  await page.evaluate(() =>
    ((window as Record<string, unknown>).__bondPair as (a: string, b: string) => number)('Rex', 'Sunny'),
  );
  await page.evaluate(() => ((window as Record<string, unknown>).__saveNow as () => Promise<unknown>)());
  await page.reload();
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForFunction(
    () => {
      const f = (window as Record<string, unknown>).__bonds as undefined | (() => Record<string, number>);
      return !!f && Object.values(f()).some((v) => v > 0);
    },
    { timeout: 8_000 },
  );
});
