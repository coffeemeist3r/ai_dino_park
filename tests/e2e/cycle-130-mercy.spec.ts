import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Victor's mercy (BACKLOG-403). 389 read the wary end of the per-opponent history and kept a dino away
 * from the food; this reads the confident end and gives the food away. The staging is deliberately the
 * same shape as the berth spec's — a ring built from the production wording, then one drop — because the
 * pair is meant to be read together.
 *
 * The load-bearing assertion is *whose* hunger reset. `eatFood` sates its argument, and passing the wrong
 * dino would invert the whole feature without a type error anywhere.
 */

type W = Record<string, any>;

const roster = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const remember = (p: Page, name: string, event: string) =>
  p.evaluate(([n, e]) => (window as W).__remember(n, e), [name, event]);
const setTrait = (p: Page, name: string, key: string, v: number) =>
  p.evaluate(({ name, key, v }) => (window as W).__setTrait(name, key, v), { name, key, v });
const setNeed = (p: Page, name: string, which: 'hunger' | 'thirst', v: number) =>
  p.evaluate(({ name, which, v }) => (window as W).__setNeed(name, which, v), { name, which, v });
const hunger = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__needs() as Record<string, { hunger: number }>)[n]?.hunger ?? 0, name);
const ticker = (p: Page) => p.evaluate(() => ((window as W).__ticker() as string[]).join(' | '));
const mercy = (p: Page) => p.evaluate(() => (window as W).__mercy());

/** The 390 memory, in the wording the game itself files. */
const stood = (rival: string) => `you stood your ground and kept your food from ${rival}`;

/**
 * Stage a victor with a real history over a rival, both standing on the drop. `agreeableness` is the whole
 * experiment: it is the only thing that differs between a mercy and a contest.
 */
async function stageContest(page: Page, agreeableness: number) {
  const [victor, rival] = await roster(page);
  await remember(page, victor, stood(rival));
  await remember(page, victor, stood(rival));
  expect(await page.evaluate(([a, b]) => (window as W).__disposition(a, b), [victor, rival])).toBe('confident');

  await setTrait(page, victor, 'agreeableness', agreeableness);
  await setNeed(page, victor, 'hunger', 0); // well fed — it doesn't need this one
  await setNeed(page, rival, 'hunger', 0.9); // ...and the one it denied is still hungry

  const food = await page.evaluate(() => (window as W).__dropFood(5));
  await page.evaluate(
    ([a, b, fx, fy]) => {
      (window as W).__placeDino(a, fx as number, fy as number);
      (window as W).__placeDino(b, fx as number, (fy as number) + 1);
    },
    [victor, rival, food.tileX, food.tileY],
  );
  await page.evaluate(() => (window as W).__stepWorld());
  return { victor, rival };
}

test('a victor lets the rival it faced down have the scrap', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const { victor, rival } = await stageContest(page, 0.9); // magnanimous

  expect(await mercy(page)).toEqual({ victor, rival });
  // The rival ate: its hunger is the one that reset. (Exact equality is wrong here — the world step
  // advances every dino's needs a hair after the meal, so the assertion is "it was fed", not "it is 0".)
  expect(await hunger(page, rival)).toBeLessThan(0.1); // staged at 0.9
  expect(await hunger(page, victor)).toBeLessThan(0.1); // it was well fed and stayed that way
  expect(await page.evaluate(() => (window as W).__food())).toBeNull(); // the drop is gone

  const log = await ticker(page);
  expect(log).toContain(`🤲 ${victor} let ${rival} have the scrap`);
  expect(log).toContain(`it has faced ${rival} down before`); // it says why

  // The gift did not rewrite the history it came from — a second mercy is still reachable.
  expect(await page.evaluate(([a, b]) => (window as W).__disposition(a, b), [victor, rival])).toBe('confident');
  expect(errors).toEqual([]);
});

test('a petty victor with the same history keeps its winnings', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const { rival } = await stageContest(page, 0.1); // petty — below MERCY_AGREE

  expect(await mercy(page)).toBeNull();
  expect(await hunger(page, rival)).toBeGreaterThanOrEqual(0.9); // it did not get fed
  expect(await ticker(page)).not.toContain('have the scrap');
  expect(errors).toEqual([]);
});

test('a fresh park has no mercy to give', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const [a, b] = await roster(page);
  expect(await page.evaluate(([x, y]) => (window as W).__disposition(x, y), [a, b])).toBeNull();

  await setTrait(page, a, 'agreeableness', 0.9);
  await setNeed(page, a, 'hunger', 0);
  await setNeed(page, b, 'hunger', 0.9);
  const food = await page.evaluate(() => (window as W).__dropFood(5));
  await page.evaluate(
    ([x, y, fx, fy]) => {
      (window as W).__placeDino(x, fx as number, fy as number);
      (window as W).__placeDino(y, fx as number, (fy as number) + 1);
    },
    [a, b, food.tileX, food.tileY],
  );
  await page.evaluate(() => (window as W).__stepWorld());

  expect(await mercy(page)).toBeNull();
  expect(errors).toEqual([]);
});
