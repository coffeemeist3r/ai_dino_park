import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Pecking-order memory (BACKLOG-401). For four cycles the contested drop was decided by one number —
 * `standsGround(bravery)` — identical against every opponent forever, while every beat it filed carried
 * the other dino's *name*. Now the pair has a history, and the history outranks temperament.
 *
 * Both tests drive `__forceContest`, which runs the same `resolveContest` the live `checkFeeding` calls,
 * so what is asserted here is the production decision and not a re-implementation of it.
 */

type W = Record<string, any>;

const roster = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const remember = (p: Page, name: string, event: string) =>
  p.evaluate(([n, e]) => (window as W).__remember(n, e), [name, event]);
const ticker = (p: Page) => p.evaluate(() => ((window as W).__ticker() as string[]).join(' | '));
const contest = (p: Page, winner: string, gobbler: string) =>
  p.evaluate(([w, g]) => {
    (window as W).__dropFood();
    return (window as W).__forceContest(w, g);
  }, [winner, gobbler]);

test('a dino that has lost to this one before gives way, however brave it is', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const [winner, bully] = await roster(page);

  // Nothing between them yet: no disposition, and the pre-401 bravery rule decides.
  expect(await page.evaluate(([a, b]) => (window as W).__disposition(a, b), [winner, bully])).toBeNull();

  // Two lost contests with this one dino — the memory strings the game itself files.
  await remember(page, winner, `${bully} wouldn't budge — you slunk off`);
  await remember(page, winner, `${bully} wouldn't budge — you slunk off`);
  expect(await page.evaluate(([a, b]) => (window as W).__disposition(a, b), [winner, bully])).toBe('wary');

  const out = await contest(page, winner, bully);
  expect(out.gobble).toEqual({ winner, gobbler: bully });
  expect(out.stand).toBeNull();
  // No silent change: the ticker says *why* it gave way.
  expect(await ticker(page)).toContain(`${bully} has beaten it here before`);

  expect(errors).toEqual([]);
});

test('a fresh pair still contests on bravery alone, with no extra word about it', async ({ page }) => {
  await boot(page);
  const names = await roster(page);
  const [winner, gobbler] = [names[2] ?? names[0], names[3] ?? names[1]];

  const out = await contest(page, winner, gobbler);
  // Either outcome is legitimate — it depends on the winner's bravery, exactly as it did before this
  // cycle. What must hold is that no history was invented to explain it.
  expect(Boolean(out.stand) !== Boolean(out.gobble)).toBe(true);
  const log = await ticker(page);
  expect(log).not.toContain('faced');
  expect(log).not.toContain('beaten it here before');

  // ...and the book carries no pecking-order line for a park with no hatch history.
  expect(await page.evaluate(() => (window as W).__bookText() as string)).not.toContain('pecking order');
});

test('the pecking order reads in the book, per opponent', async ({ page }) => {
  await boot(page);
  const [dino, faced, feared] = await roster(page);

  await remember(page, dino, `you stood your ground and kept your food from ${faced}`);
  await remember(page, dino, `you stood your ground and kept your food from ${faced}`);
  await remember(page, dino, `${feared} wouldn't budge — you slunk off`);
  await remember(page, dino, `${feared} wouldn't budge — you slunk off`);

  const book = await page.evaluate(() => (window as W).__bookText() as string);
  expect(book).toContain(`👊 pecking order: faced down ${faced} · wary of ${feared}`);
});
