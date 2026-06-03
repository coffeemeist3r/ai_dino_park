import { test, expect } from '@playwright/test';
import { boot } from './helpers';

type W = Record<string, unknown>;
type Homecoming = { name: string; hearts: number; line: string; memory: string } | null;
type CatchUp = { days: number; minutes: number; capped: boolean; digest: string[]; homecoming: Homecoming };

const DAY_MS = 24 * 60 * 60_000; // one in-game day of real time at 1×

test('a long absence stages a welcome-back beat from the closest dino (BACKLOG-112)', async ({ page }) => {
  await boot(page);

  // Make Sunny the clear favorite: greet several times.
  await page.evaluate(() => {
    const greet = (window as W).__greet as (n: string) => number;
    for (let i = 0; i < 4; i++) greet('Sunny');
  });

  // Two in-game days away → past the 6h homecoming threshold.
  const result = await page.evaluate(
    (ms) => ((window as W).__catchUp as (m: number) => CatchUp)(ms),
    2 * DAY_MS,
  );
  expect(result.homecoming?.name).toBe('Sunny');
  expect(result.homecoming?.line).toContain('👋');

  const hc = await page.evaluate(() => ((window as W).__homecoming as () => Homecoming)());
  expect(hc?.name).toBe('Sunny');
});

test('a short absence stages no homecoming', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => ((window as W).__greet as (n: string) => number)('Sunny'));

  // One in-game minute away — well below the threshold.
  const result = await page.evaluate(
    () => ((window as W).__catchUp as (m: number) => CatchUp)(60_000),
  );
  expect(result.homecoming).toBeNull();

  const hc = await page.evaluate(() => ((window as W).__homecoming as () => Homecoming)());
  expect(hc).toBeNull();
});
