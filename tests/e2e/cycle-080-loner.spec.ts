import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The loner (BACKLOG-135). A dino whose every dino↔dino bond sits below the floor is a loner — it
 * withdraws to the bowl edge and mopes (🥀), and a keeper greet lands extra-hard on it. Loner status is
 * derived live from the bond graph: `__bondPair` lifts a dino out of it, `__greet` measures the bump.
 */

type W = Record<string, any>;

const loners = (p: Page) => p.evaluate(() => (window as W).__loners() as string[]);
const isLoner = (p: Page, n: string) => p.evaluate((name) => (window as W).__isLoner(name) as boolean, n);
const points = (p: Page, n: string) =>
  p.evaluate((name) => ((window as W).__friendship() as Record<string, number>)[name] ?? 0, n);

test('a bond at/above the floor lifts a pair out of loner status; the rest stay loners', async ({ page }) => {
  await boot(page);

  // A fresh bowl is unbonded — everyone is a loner until ties form.
  expect((await loners(page)).length).toBeGreaterThan(0);

  // Bond Rex↔Sunny well above the floor → neither is a loner; an unbonded peer still is.
  await page.evaluate(() => (window as W).__bondPair('Rex', 'Sunny', 30));
  expect(await isLoner(page, 'Rex')).toBe(false);
  expect(await isLoner(page, 'Sunny')).toBe(false);
  expect(await isLoner(page, 'Mossback')).toBe(true);
  const ls = await loners(page);
  expect(ls).not.toContain('Rex');
  expect(ls).not.toContain('Sunny');
  expect(ls).toContain('Mossback');
});

test('a greet lands extra-hard on a loner — the bonus is exactly LONER_BONUS over a non-loner greet', async ({ page }) => {
  await boot(page);

  // Mossback is a loner (unbonded). Greet it once and measure the bump.
  expect(await isLoner(page, 'Mossback')).toBe(true);
  const before = await points(page, 'Mossback');
  await page.evaluate(() => (window as W).__greet('Mossback'));
  const lonerDelta = (await points(page, 'Mossback')) - before;

  // Lift Mossback out of loner status (a real bond), then greet again — same traits, same keeper bonus,
  // so the only difference is the missing loner bonus.
  await page.evaluate(() => (window as W).__bondPair('Mossback', 'Rex', 30));
  expect(await isLoner(page, 'Mossback')).toBe(false);
  const mid = await points(page, 'Mossback');
  await page.evaluate(() => (window as W).__greet('Mossback'));
  const plainDelta = (await points(page, 'Mossback')) - mid;

  expect(lonerDelta).toBeGreaterThan(plainDelta); // the loner greet earned more
  expect(lonerDelta - plainDelta).toBe(4); // LONER_BONUS
});
