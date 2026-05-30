import { test, expect } from '@playwright/test';

type W = Record<string, unknown>;

test('the plaque reports population and grows a generation when an egg hatches', async ({ page }) => {
  await page.goto('/');
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });

  const before = await page.evaluate(() =>
    ((window as W).__plaque as () => { population: number; day: number; generations: number })(),
  );
  expect(before.population).toBeGreaterThanOrEqual(5);
  expect(before.day).toBeGreaterThanOrEqual(1);
  expect(before.generations).toBeGreaterThanOrEqual(1);

  const after = await page.evaluate(() => {
    ((window as W).__layEgg as (a: string, b: string) => unknown)('Rex', 'Mossback');
    ((window as W).__forceHatch as () => number)();
    return ((window as W).__plaque as () => { population: number; generations: number })();
  });

  expect(after.population).toBe(before.population + 1); // a new specimen
  expect(after.generations).toBeGreaterThanOrEqual(2); // the family tree deepened
});
