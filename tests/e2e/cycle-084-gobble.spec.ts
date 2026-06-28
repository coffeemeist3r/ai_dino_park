import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Greedy gobble (BACKLOG-387). The inverse of the generous feeder (375): when the rush winner is
 * *keeping* its food, a hungry, prickly dino beside it in the swarm shoulders past and eats first (😤).
 * Food lands at row 6 (floor(ROWS*0.45)); the winner sits on it, the gobbler stands three tiles away
 * (in the swarm, not on the food, so the winner is the unique reacher).
 */

type W = Record<string, any>;
const DROP_COL = 2;
const DROP_ROW = 6;

const names = (p: Page) => p.evaluate(() => (window as W).__dinoPositions().map((d: any) => d.name) as string[]);
const gobbleBeat = (p: Page) =>
  p.evaluate(() => (window as W).__gobbleFood() as { winner: string; gobbler: string } | null);
const need = (p: Page, n: string) => p.evaluate((nn) => (window as W).__needs()[nn]?.hunger ?? 0, n);
const memOf = (p: Page, n: string) => p.evaluate((nn) => ((window as W).__memory()[nn] ?? []) as string[], n);

test('a hungry prickly dino shoulders past the winner to the food', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const [winner, gobbler] = await names(page);
  await page.evaluate(
    ({ winner, gobbler, DROP_COL, DROP_ROW }) => {
      const w = window as W;
      w.__placeDino(winner, DROP_COL, DROP_ROW); // on the food
      w.__placeDino(gobbler, DROP_COL + 3, DROP_ROW); // in the swarm, not on it
      w.__setNeed(winner, 'hunger', 0.45); // hungry enough to keep its food (no 375 yield), but mild
      w.__setNeed(gobbler, 'hunger', 0.95); // much hungrier
      w.__setTrait(winner, 'agreeableness', 0.9); // the winner is warm — it would not gobble
      w.__setTrait(gobbler, 'agreeableness', 0.1); // prickly — won't wait its turn
    },
    { winner, gobbler, DROP_COL, DROP_ROW },
  );

  await page.evaluate(({ DROP_COL }) => (window as W).__dropFood(DROP_COL), { DROP_COL });
  await page.evaluate(() => (window as W).__stepWorld());

  // the gobbler ate (hunger reset toward 0, from 0.95), the winner did not (still ~0.45).
  expect(await need(page, gobbler)).toBeLessThan(0.1);
  expect(await need(page, winner)).toBeGreaterThan(0.3);
  // the shoulder-past beat fired: memory + the 😤 + the recorded beat.
  expect((await memOf(page, gobbler)).some((m) => m.includes(`shouldered past ${winner}`))).toBe(true);
  expect(await gobbleBeat(page)).toEqual({ winner, gobbler });
  expect(await page.evaluate(() => (window as W).__food() === null)).toBe(true);
  expect(errors).toEqual([]);
});

test('a warm nearby dino does not gobble — the winner eats (passthrough)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await boot(page);

  const [winner, other] = await names(page);
  await page.evaluate(
    ({ winner, other, DROP_COL, DROP_ROW }) => {
      const w = window as W;
      w.__placeDino(winner, DROP_COL, DROP_ROW);
      w.__placeDino(other, DROP_COL + 3, DROP_ROW);
      w.__setNeed(winner, 'hunger', 0.45);
      w.__setNeed(other, 'hunger', 0.95); // very hungry, but...
      w.__setTrait(winner, 'agreeableness', 0.9);
      w.__setTrait(other, 'agreeableness', 0.9); // warm — it waits its turn
    },
    { winner, other, DROP_COL, DROP_ROW },
  );

  await page.evaluate(({ DROP_COL }) => (window as W).__dropFood(DROP_COL), { DROP_COL });
  await page.evaluate(() => (window as W).__stepWorld());

  // the winner ate, no gobble beat fired.
  expect(await need(page, winner)).toBeLessThan(0.1);
  expect(await gobbleBeat(page)).toBeNull();
  expect(await page.evaluate(() => (window as W).__food() === null)).toBe(true);
  expect(errors).toEqual([]);
});
