import { test, expect } from '@playwright/test';

type W = Record<string, unknown>;

async function boot(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });
}

test('the lens key cycles through every view and wraps back to off', async ({ page }) => {
  await boot(page);

  const start = await page.evaluate(() => ((window as W).__lens as () => string)());
  expect(start).toBe('off');

  const seq = await page.evaluate(() => {
    const cycle = (window as W).__cycleLens as () => string;
    return [cycle(), cycle(), cycle(), cycle(), cycle()];
  });
  expect(seq).toEqual(['book', 'bonds', 'roles', 'ticker', 'off']);
});

test('a role emerges from behavior (a rumor-carrier becomes the gossip)', async ({ page }) => {
  await boot(page);

  const role = await page.evaluate(() => {
    ((window as W).__greet as (n: string) => unknown)('Rex'); // give Rex a first-hand memory
    const spread = (window as W).__spreadGossip as (a: string, b: string) => unknown;
    spread('Rex', 'Sunny');
    spread('Rex', 'Sunny');
    spread('Rex', 'Sunny');
    return ((window as W).__roles as () => Record<string, string>)().Sunny;
  });
  expect(role).toBe('gossip');
});

test('the news ticker and collection book reflect a birth', async ({ page }) => {
  await boot(page);

  const out = await page.evaluate(() => {
    ((window as W).__layEgg as (a: string, b: string) => unknown)('Rex', 'Mossback');
    ((window as W).__forceHatch as () => number)();
    return {
      events: ((window as W).__events as () => string[])(),
      rows: ((window as W).__bookRows as () => Array<{ name: string; parents?: [string, string] }>)(),
    };
  });

  expect(out.events.some((e) => e.includes('🥚'))).toBe(true);
  expect(out.events.some((e) => e.includes('🐣'))).toBe(true);
  // the hatchling shows its lineage in the book
  expect(out.rows.some((r) => r.parents && r.parents[0] === 'Rex' && r.parents[1] === 'Mossback')).toBe(true);
});
