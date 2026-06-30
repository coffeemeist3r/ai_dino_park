import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Backed-down gobbler slinks off (BACKLOG-394). When a bold winner stands its ground (390), the denied
 * gobbler now also reacts: it slinks off (😖) and files a "<bold> wouldn't budge" memory, so the failed
 * grab carries a visible cost. Same setup as the cycle-085 stand-up spec; we assert the gobbler's side.
 */

type W = Record<string, any>;
const DROP_COL = 2;
const DROP_ROW = 6;

const names = (p: Page) => p.evaluate(() => (window as W).__dinoPositions().map((d: any) => d.name) as string[]);
const standBeat = (p: Page) =>
  p.evaluate(() => (window as W).__standFood() as { winner: string; gobbler: string } | null);
const memOf = (p: Page, n: string) => p.evaluate((nn) => ((window as W).__memory()[nn] ?? []) as string[], n);

async function setUp(page: Page, winnerBravery: number) {
  const [winner, gobbler] = await names(page);
  await page.evaluate(
    ({ winner, gobbler, DROP_COL, DROP_ROW, winnerBravery }) => {
      const w = window as W;
      w.__placeDino(winner, DROP_COL, DROP_ROW); // on the food (unique reacher)
      w.__placeDino(gobbler, DROP_COL + 3, DROP_ROW); // in the swarm, not on it
      w.__setNeed(winner, 'hunger', 0.45); // keeps its food (no 375 yield)
      w.__setNeed(gobbler, 'hunger', 0.95); // much hungrier — wants to shoulder past
      w.__setTrait(winner, 'agreeableness', 0.9); // warm — would not gobble itself
      w.__setTrait(winner, 'bravery', winnerBravery); // the variable under test
      w.__setTrait(gobbler, 'agreeableness', 0.1); // prickly — won't wait its turn
    },
    { winner, gobbler, DROP_COL, DROP_ROW, winnerBravery },
  );
  await page.evaluate(({ DROP_COL }) => (window as W).__dropFood(DROP_COL), { DROP_COL });
  await page.evaluate(() => (window as W).__stepWorld());
  return { winner, gobbler };
}

test('a stood-up-to gobbler slinks off and remembers who wouldn’t budge', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const { winner, gobbler } = await setUp(page, 0.9); // bold winner → stand → gobbler slinks

  // the stand-up fired...
  expect(await standBeat(page)).toEqual({ winner, gobbler });
  // ...and the *gobbler* now carries the slink memory naming the bold winner.
  expect((await memOf(page, gobbler)).some((m) => m.includes('budge') && m.includes(winner))).toBe(true);
  // the winner's own 390 memory is untouched.
  expect((await memOf(page, winner)).some((m) => m.includes('stood your ground'))).toBe(true);
  expect(errors).toEqual([]);
});

test('a timid winner is gobbled — no slink (387 path unchanged)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await boot(page);

  const { winner, gobbler } = await setUp(page, 0.1); // timid winner → gobble path

  expect(await standBeat(page)).toBeNull();
  // the gobbler grabbed; it has no "wouldn't budge" slink memory.
  expect((await memOf(page, gobbler)).some((m) => m.includes('budge'))).toBe(false);
  expect(errors).toEqual([]);
});
