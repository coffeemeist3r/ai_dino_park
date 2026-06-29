import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Standing up to the gobbler (BACKLOG-390). The third pole of the contested-drop trio (yield 375 /
 * gobble 387 / stand 390): when a hungry, prickly dino would shoulder past (387), a *bold* winner holds
 * its tile instead and the gobbler backs down (😠) — so who gets pushed around at the hatch is a bravery
 * read. Same setup as the cycle-084 gobble spec; the only difference is the winner's bravery.
 */

type W = Record<string, any>;
const DROP_COL = 2;
const DROP_ROW = 6;

const names = (p: Page) => p.evaluate(() => (window as W).__dinoPositions().map((d: any) => d.name) as string[]);
const standBeat = (p: Page) =>
  p.evaluate(() => (window as W).__standFood() as { winner: string; gobbler: string } | null);
const gobbleBeat = (p: Page) =>
  p.evaluate(() => (window as W).__gobbleFood() as { winner: string; gobbler: string } | null);
const need = (p: Page, n: string) => p.evaluate((nn) => (window as W).__needs()[nn]?.hunger ?? 0, n);
const memOf = (p: Page, n: string) => p.evaluate((nn) => ((window as W).__memory()[nn] ?? []) as string[], n);

async function setUp(page: Page, winnerBravery: number) {
  const [winner, gobbler] = await names(page);
  await page.evaluate(
    ({ winner, gobbler, DROP_COL, DROP_ROW, winnerBravery }) => {
      const w = window as W;
      w.__placeDino(winner, DROP_COL, DROP_ROW); // on the food (unique reacher)
      w.__placeDino(gobbler, DROP_COL + 3, DROP_ROW); // in the swarm, not on it
      w.__setNeed(winner, 'hunger', 0.45); // keeps its food (no 375 yield), but mild
      w.__setNeed(gobbler, 'hunger', 0.95); // much hungrier — wants to shoulder past
      w.__setTrait(winner, 'agreeableness', 0.9); // warm — it would not gobble itself
      w.__setTrait(winner, 'bravery', winnerBravery); // the variable under test
      w.__setTrait(gobbler, 'agreeableness', 0.1); // prickly — won't wait its turn
    },
    { winner, gobbler, DROP_COL, DROP_ROW, winnerBravery },
  );
  await page.evaluate(({ DROP_COL }) => (window as W).__dropFood(DROP_COL), { DROP_COL });
  await page.evaluate(() => (window as W).__stepWorld());
  return { winner, gobbler };
}

test('a bold winner holds its ground — the gobbler backs down', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const { winner, gobbler } = await setUp(page, 0.9); // bold

  // the winner ate (hunger reset toward 0, from 0.45); the gobbler was denied (still very hungry).
  expect(await need(page, winner)).toBeLessThan(0.1);
  expect(await need(page, gobbler)).toBeGreaterThan(0.8);
  // the stand-up beat fired, not the gobble: memory + 😠 + the recorded beat; gobble beat is null.
  expect((await memOf(page, winner)).some((m) => m.includes(`stood your ground`) && m.includes(gobbler))).toBe(true);
  expect(await standBeat(page)).toEqual({ winner, gobbler });
  expect(await gobbleBeat(page)).toBeNull();
  expect(await page.evaluate(() => (window as W).__food() === null)).toBe(true);
  expect(errors).toEqual([]);
});

test('a timid winner cedes — the gobbler still shoulders past (387 unchanged)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await boot(page);

  const { winner, gobbler } = await setUp(page, 0.1); // timid

  // the gobbler ate; the winner did not — exactly the cycle-084 gobble outcome.
  expect(await need(page, gobbler)).toBeLessThan(0.1);
  expect(await need(page, winner)).toBeGreaterThan(0.3);
  expect(await gobbleBeat(page)).toEqual({ winner, gobbler });
  expect(await standBeat(page)).toBeNull();
  expect(await page.evaluate(() => (window as W).__food() === null)).toBe(true);
  expect(errors).toEqual([]);
});
