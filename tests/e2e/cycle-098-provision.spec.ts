import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Provision remembered (BACKLOG-385 + 386). The generous feeder (375) becomes reciprocal and
 * acknowledged: a fed dino throws a 💛 at its benefactor (386) and files the debt, and later repays
 * that benefactor at a relaxed bond bar it wouldn't cross for a mere acquaintance (385). Food lands at
 * row 6 (floor(ROWS*0.45)); the winner sits on it, the hungry friend three tiles away in the swarm.
 */

type W = Record<string, any>;
const DROP_COL = 2;
const DROP_ROW = 6;

const names = (p: Page) => p.evaluate(() => (window as W).__dinoPositions().map((d: any) => d.name) as string[]);
const yieldBeat = (p: Page) => p.evaluate(() => (window as W).__yieldFood() as { giver: string; eater: string } | null);
const nuzzle = (p: Page) => p.evaluate(() => (window as W).__nuzzle() as { from: string; to: string } | null);
const owes = (p: Page) => p.evaluate(() => (window as W).__owesFood() as Record<string, string[]>);
const memOf = (p: Page, n: string) => p.evaluate((nn) => ((window as W).__memory()[nn] ?? []) as string[], n);

/** Stand `winner` on the drop, `friend` three tiles away in the swarm, with chosen hungers + bond. */
async function stage(p: Page, winner: string, friend: string, bond: number) {
  await p.evaluate(({ winner, friend, bond, DROP_COL, DROP_ROW }) => {
    const w = window as W;
    w.__placeDino(winner, DROP_COL, DROP_ROW);
    w.__placeDino(friend, DROP_COL + 3, DROP_ROW);
    w.__setNeed(winner, 'hunger', 0.1); // well-fed
    w.__setNeed(friend, 'hunger', 0.9); // hungry
    w.__bondPair(winner, friend, bond);
  }, { winner, friend, bond, DROP_COL, DROP_ROW });
}

async function feed(p: Page) {
  await p.evaluate(({ DROP_COL }) => (window as W).__dropFood(DROP_COL), { DROP_COL });
  await p.evaluate(() => (window as W).__stepWorld());
}

test('a fed dino thanks its benefactor and later repays it at a relaxed bar', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const [a, b] = await names(page); // a feeds b first

  // Meal 1: A (well-fed) yields to B (hungry, high bond). B thanks A (386) and files the debt (385).
  await stage(page, a, b, 60);
  await feed(page);
  expect(await yieldBeat(page)).toEqual({ giver: a, eater: b });
  expect(await nuzzle(page)).toEqual({ from: b, to: a }); // 💛 B → A
  expect((await owes(page))[b] ?? []).toContain(a); // B now owes A a meal back

  // Meal 2: roles swap. B is well-fed on the drop, A is hungry — but their bond is only 25, BELOW the
  // stranger-friend GENEROUS_BOND (40). Without the remembered debt B would keep its food; because A is
  // a benefactor B owes, B repays it (relaxed RECIPROCAL_BOND=20).
  await stage(page, b, a, 25);
  await feed(page);
  expect(await yieldBeat(page)).toEqual({ giver: b, eater: a }); // B repaid A
  expect((await owes(page))[b] ?? []).not.toContain(a); // one-shot: debt cleared
  expect((await memOf(page, b)).some((m) => m.includes(`repaid ${a}'s kindness`))).toBe(true);

  expect(errors).toEqual([]);
});

test('an un-owed friend at the same low bond gets no yield (reciprocity is what unlocks it)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await boot(page);

  const [a, b] = await names(page);
  // No prior meal → empty ledger. Bond 25 is under GENEROUS_BOND, so a mere friend is not yielded to.
  await stage(page, a, b, 25);
  await page.evaluate((bb) => (window as W).__setTrait(bb, 'agreeableness', 0.9), b); // warm → no greedy gobble either
  await feed(page);

  expect(await yieldBeat(page)).toBeNull();
  expect(await nuzzle(page)).toBeNull(); // no yield → no 💛
  expect(errors).toEqual([]);
});
