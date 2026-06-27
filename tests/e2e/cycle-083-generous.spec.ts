import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Generous feeder (BACKLOG-375). A well-fed dino that wins the rush to a drop, standing beside a
 * hungrier high-bond friend, gives up the meal and lets the friend eat first — the need-drive (371)
 * shaping kindness between dinos. Food lands at row 6 (floor(ROWS*0.45)); we place the winner on it
 * and the hungry friend three tiles away (in the swarm, but not on the food, so the winner is the
 * unique reacher).
 */

type W = Record<string, any>;
const DROP_COL = 2;
const DROP_ROW = 6;

const names = (p: Page) => p.evaluate(() => (window as W).__dinoPositions().map((d: any) => d.name) as string[]);
const yieldBeat = (p: Page) => p.evaluate(() => (window as W).__yieldFood() as { giver: string; eater: string } | null);
const need = (p: Page, n: string) => p.evaluate((nn) => (window as W).__needs()[nn]?.hunger ?? 0, n);
const bond = (p: Page, a: string, b: string) => p.evaluate(({ a, b }) => (window as W).__bond(a, b) as number, { a, b });
const points = (p: Page, n: string) => p.evaluate((nn) => (window as W).__friendshipPoints()[nn] ?? 0, n);
const memOf = (p: Page, n: string) => p.evaluate((nn) => ((window as W).__memory()[nn] ?? []) as string[], n);

async function setup(p: Page, winner: string, friend: string) {
  // winner: well-fed, sitting on the food. friend: hungry, high-bond, three tiles away in the swarm.
  await p.evaluate(({ winner, friend, DROP_COL, DROP_ROW }) => {
    const w = window as W;
    w.__placeDino(winner, DROP_COL, DROP_ROW);
    w.__placeDino(friend, DROP_COL + 3, DROP_ROW);
    w.__setNeed(winner, 'hunger', 0.1); // well-fed
    w.__setNeed(friend, 'hunger', 0.9); // hungry
    w.__bondPair(winner, friend, 60); // well over GENEROUS_BOND
  }, { winner, friend, DROP_COL, DROP_ROW });
}

test('a well-fed winner yields the meal to a hungrier high-bond friend', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const [winner, friend] = await names(page);
  await setup(page, winner, friend);
  const bondBefore = await bond(page, winner, friend);
  const friendPointsBefore = await points(page, friend);

  await page.evaluate(({ DROP_COL }) => (window as W).__dropFood(DROP_COL), { DROP_COL });
  await page.evaluate(() => (window as W).__stepWorld());

  // the friend got the meal: its hunger is sated (reset to 0, modulo one step of need-build), its friendship rose,
  // and it filed the eat memory — proof the friend, not the winner, ate.
  expect(await need(page, friend)).toBeLessThan(0.1); // was 0.9 — the friend ate
  expect(await points(page, friend)).toBeGreaterThan(friendPointsBefore);
  expect((await memOf(page, friend)).some((m) => m.includes('the food') || m.includes('hatch'))).toBe(true);
  // the winner did NOT eat: its hunger is untouched (still ~0.1, not reset toward 0).
  expect(await need(page, winner)).toBeGreaterThan(0.05);
  // the generosity deepened the tie + filed a memory + a 🤝 beat.
  expect(await bond(page, winner, friend)).toBeGreaterThan(bondBefore);
  expect((await memOf(page, winner)).some((m) => m.includes(`let ${friend} eat first`))).toBe(true);
  expect(await yieldBeat(page)).toEqual({ giver: winner, eater: friend });

  expect(await page.evaluate(() => (window as W).__food() === null)).toBe(true);
  expect(errors).toEqual([]);
});

test('no qualifying friend → the winner eats as before (passthrough)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await boot(page);

  const [winner, friend] = await names(page);
  // winner well-fed, but the only nearby dino is a LOW-bond stranger → no one to yield to.
  await page.evaluate(({ winner, friend, DROP_COL, DROP_ROW }) => {
    const w = window as W;
    w.__placeDino(winner, DROP_COL, DROP_ROW);
    w.__placeDino(friend, DROP_COL + 3, DROP_ROW);
    w.__setNeed(winner, 'hunger', 0.1);
    w.__setNeed(friend, 'hunger', 0.9); // hungry, but no bond
  }, { winner, friend, DROP_COL, DROP_ROW });

  await page.evaluate(({ DROP_COL }) => (window as W).__dropFood(DROP_COL), { DROP_COL });
  await page.evaluate(() => (window as W).__stepWorld());

  // the winner ate (its own hunger reset toward 0, modulo one step of need-build), and no yield beat fired.
  expect(await need(page, winner)).toBeLessThan(0.1); // was 0.1 hunger pre-eat... reset on eating
  expect(await yieldBeat(page)).toBeNull();
  expect(await page.evaluate(() => (window as W).__food() === null)).toBe(true);
  expect(errors).toEqual([]);
});
