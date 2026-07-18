import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Brought to the hatch (BACKLOG-381) — Milestone 5 lore arc 3. The park learned to feed a starving dino
 * out of its own stores (444); this is the same sentence with a face on it. On a food drop, the dino
 * withdrawn at the wall (135) misses the meal precisely because it has nobody — so the closest thing it
 * *does* have to a friend turns around, walks away from the food, and brings it in.
 *
 * The bond window is the whole setup: FETCH_BOND_FLOOR (4) ≤ bond < LONER_FLOOR (8) — close enough to
 * come, not close enough to stop being a loner. `__bondPair` must be given an explicit amount or it
 * defaults to HUDDLE_THRESHOLD and silently lifts the loner out of loner status.
 *
 * Driven via __bondPair / __placeDino / __dropFood / __stepWorld, asserted on __escort + __events + __memory.
 */

type W = Record<string, any>;

const escort = (p: Page) =>
  p.evaluate(() => (window as W).__escort() as { friend: string; loner: string; phase: string } | null);
const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);
const place = (p: Page, name: string, x: number, y: number) =>
  p.evaluate(({ name, x, y }) => (window as W).__placeDino(name, x, y), { name, x, y });
const pos = (p: Page, name: string) =>
  p.evaluate(
    (n) => ((window as W).__dinoPositions() as Array<{ name: string; x: number; y: number }>).find((d) => d.name === n)!,
    name,
  );
const step = (p: Page) => p.evaluate(() => (window as W).__stepWorld());
const bond = (p: Page, a: string, b: string) => p.evaluate(({ a, b }) => (window as W).__bond(a, b), { a, b });
const memory = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__memory() as Record<string, string[]>)[n] ?? [], name);
const isLoner = (p: Page, name: string) => p.evaluate((n) => (window as W).__isLoner(n) as boolean, name);
const fetchLines = (log: string[]) => log.filter((e) => e.includes('🤝') && e.includes('brought it in'));

/** Bond the pair inside the fetch window, park the loner at the far wall, drop food beside the friend. */
async function stageFetch(page: Page, friend = 'Rex', loner = 'Mossback'): Promise<void> {
  await page.evaluate(({ a, b }) => (window as W).__bondPair(a, b, 5), { a: friend, b: loner });
  await place(page, loner, 0, 14); // the far corner — well outside FEED_RANGE of a mid-map drop
  await place(page, friend, 10, 6);
  await page.evaluate(() => (window as W).__dropFood(10));
}

test('a withdrawn loner gets fetched on a food drop (BACKLOG-381)', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  await stageFetch(page);

  // the bond is inside the window: close enough to come, not close enough to stop being a loner
  expect(await bond(page, 'Rex', 'Mossback')).toBeGreaterThanOrEqual(4);
  expect(await isLoner(page, 'Mossback')).toBe(true);

  expect(await escort(page)).toMatchObject({ friend: 'Rex', loner: 'Mossback', phase: 'to-loner' });
  expect(errors).toEqual([]);
});

test('nobody comes for a dino with nobody (BACKLOG-381)', async ({ page }) => {
  await boot(page);

  // no bond at all — the loner stands at the edge while the park eats. The silence is the feature.
  await place(page, 'Mossback', 0, 14);
  await place(page, 'Rex', 10, 6);
  await page.evaluate(() => (window as W).__dropFood(10));

  expect(await escort(page)).toBeNull();
  expect(await isLoner(page, 'Mossback')).toBe(true);
});

test('the friend walks away from the food to get it (BACKLOG-381)', async ({ page }) => {
  await boot(page);
  await stageFetch(page);

  // Rex is standing ON the food's landing column — every ordinary rule says stay. The escort outranks it.
  const before = await pos(page, 'Rex');
  await step(page);
  const after = await pos(page, 'Rex');

  const loner = await pos(page, 'Mossback');
  const closed = Math.hypot(before.x - loner.x, before.y - loner.y) - Math.hypot(after.x - loner.x, after.y - loner.y);
  expect(closed).toBeGreaterThan(0); // it moved toward the loner, not toward the meal
});

test('the nudge fires exactly once, then the pair heads in (BACKLOG-381)', async ({ page }) => {
  await boot(page);
  await stageFetch(page);

  const bondBefore = await bond(page, 'Rex', 'Mossback');

  // walk it out until the two meet (the escort's own budget bounds this)
  for (let i = 0; i < 40 && (await escort(page))?.phase === 'to-loner'; i++) await step(page);
  expect((await escort(page))?.phase).toBe('to-food');

  const lines = fetchLines(await events(page)); // the ticker keeps 12 entries; the nudge just landed
  expect(lines).toHaveLength(1);
  expect(lines[0]).toContain('Rex');
  expect(lines[0]).toContain('Mossback');

  // the durable traces: each side keeps its own half, and the gesture deepens the tie
  expect(await memory(page, 'Mossback')).toContain('Rex came and got me for the food');
  expect(await memory(page, 'Rex')).toContain('you went and got Mossback for the food');
  expect(await bond(page, 'Rex', 'Mossback')).toBeGreaterThan(bondBefore);

  // walking on does not fire a second nudge — the memory stays single
  await step(page);
  const again = (await memory(page, 'Mossback')).filter((m) => m.includes('came and got me'));
  expect(again).toHaveLength(1);
});

test('the fetched loner walks toward the food instead of withdrawing (BACKLOG-381)', async ({ page }) => {
  await boot(page);
  await stageFetch(page);

  for (let i = 0; i < 40 && (await escort(page))?.phase === 'to-loner'; i++) await step(page);
  expect((await escort(page))?.phase).toBe('to-food');

  // the swarm has almost certainly cleared the drop by now; the pair heads for the hatch it landed at
  const before = await pos(page, 'Mossback');
  await step(page);
  const after = await pos(page, 'Mossback');

  const fx = 10 * 32 + 16; // floor(COLS/2)
  const fy = 6 * 32 + 16; // floor(ROWS * 0.45) — the foodLanding row
  const closed = Math.hypot(before.x - fx, before.y - fy) - Math.hypot(after.x - fx, after.y - fy);
  expect(closed).toBeGreaterThan(0); // moping would have pushed it back into the wall
});

test('the errand outlives the meal — it still brings the loner in (BACKLOG-381)', async ({ page }) => {
  await boot(page);
  await stageFetch(page);

  expect(await escort(page)).not.toBeNull();
  await page.evaluate(() => (window as W).__eat('Rex')); // the swarm clears the drop mid-errand
  await step(page);

  // a fetch takes ~20 steps and a drop is gone in ~3; cancelling here would mean the beat never fires
  expect(await escort(page)).not.toBeNull();

  for (let i = 0; i < 40 && (await escort(page))?.phase === 'to-loner'; i++) await step(page);
  expect(fetchLines(await events(page))).toHaveLength(1); // the nudge still happened, with no food left
});

test('the errand ends when the loner makes it in (BACKLOG-381)', async ({ page }) => {
  await boot(page);
  await stageFetch(page);

  for (let i = 0; i < 40 && (await escort(page))?.phase === 'to-loner'; i++) await step(page);
  expect((await escort(page))?.phase).toBe('to-food');

  for (let i = 0; i < 40 && (await escort(page)) !== null; i++) await step(page);
  expect(await escort(page)).toBeNull(); // it arrived (or the budget drained) — never runs forever
});

test('one escort at a time (BACKLOG-381)', async ({ page }) => {
  await boot(page);
  await stageFetch(page);

  const first = await escort(page);
  await page.evaluate(() => (window as W).__dropFood(2)); // a second drop mid-errand

  expect(await escort(page)).toMatchObject({ friend: first!.friend, loner: first!.loner });
});
