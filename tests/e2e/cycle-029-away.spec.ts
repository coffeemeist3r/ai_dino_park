import { test, expect } from '@playwright/test';
import { boot } from './helpers';

type W = Record<string, unknown>;
type CatchUp = { days: number; minutes: number; capped: boolean; digest: string[] };

const DAY_MS = 24 * 60 * 60_000; // one in-game day of real time at 1×

test('offline catch-up drifts bonded pairs closer and narrates the homecoming', async ({ page }) => {
  await boot(page);

  // Seed a companion bond (one __bondPair = HUDDLE_THRESHOLD = 8, at the company threshold).
  const before = await page.evaluate(() => {
    const w = window as W;
    (w.__bondPair as (a: string, b: string) => number)('Rex', 'Glade');
    return (w.__bonds as () => Record<string, number>)()['Glade|Rex'];
  });
  expect(before).toBe(8);

  // Three in-game days away at the default 1× rate.
  const result = await page.evaluate(
    (ms) => ((window as W).__catchUp as (m: number) => CatchUp)(ms),
    3 * DAY_MS,
  );
  expect(result.days).toBe(3);
  expect(result.capped).toBe(false);
  expect(result.digest.some((l) => l.includes('grew closer'))).toBe(true);

  const after = await page.evaluate(
    () => ((window as W).__bonds as () => Record<string, number>)()['Glade|Rex'],
  );
  expect(after).toBe(before + 6); // +DRIFT_PER_DAY(2) * 3 days

  const digest = await page.evaluate(() => ((window as W).__awayDigest as () => string[])());
  expect(digest.length).toBeGreaterThan(1);
});

test('a fresh boot with no save shows no homecoming digest', async ({ page }) => {
  await boot(page);
  const digest = await page.evaluate(() => ((window as W).__awayDigest as () => string[])());
  expect(digest).toEqual([]);
});
