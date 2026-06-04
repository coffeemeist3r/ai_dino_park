import { test, expect } from '@playwright/test';
import { boot } from './helpers';

type W = Record<string, unknown>;
type Jealousy = { name: string; line: string; memory: string } | null;
type Homecoming = { name: string; hearts: number; line: string; memory: string; jealous: Jealousy } | null;
type CatchUp = { days: number; minutes: number; capped: boolean; digest: string[]; homecoming: Homecoming };

const DAY_MS = 24 * 60 * 60_000; // one in-game day of real time at 1×

test('a near-tied runner-up sulks when the closest dino is welcomed back (BACKLOG-120)', async ({ page }) => {
  await boot(page);

  // Greet two dinos once each. greetGain clamps to <=10 pts, so the two land
  // within one heart's worth of each other => a guaranteed near-tie.
  await page.evaluate(() => {
    const greet = (window as W).__greet as (n: string) => number;
    greet('Sunny');
    greet('Glade');
  });

  const result = await page.evaluate(
    (ms) => ((window as W).__catchUp as (m: number) => CatchUp)(ms),
    2 * DAY_MS,
  );

  expect(result.homecoming).not.toBeNull();
  const jealous = result.homecoming!.jealous;
  expect(jealous).not.toBeNull();
  // the sulker is the other near-tied dino, not the homecomer
  expect([result.homecoming!.name, jealous!.name].sort()).toEqual(['Glade', 'Sunny']);
  expect(jealous!.name).not.toBe(result.homecoming!.name);

  // the sulk bubble actually rendered
  const bubbles = await page.evaluate(() => ((window as W).__bubbleTexts as () => string[])());
  expect(bubbles.some((t) => t.includes('😒'))).toBe(true);
});

test('a lone favorite stages a homecoming with no jealousy', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => ((window as W).__greet as (n: string) => number)('Sunny'));

  const result = await page.evaluate(
    (ms) => ((window as W).__catchUp as (m: number) => CatchUp)(ms),
    2 * DAY_MS,
  );
  expect(result.homecoming).not.toBeNull();
  expect(result.homecoming!.jealous).toBeNull();
});
