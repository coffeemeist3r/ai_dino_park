import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Caught in the act (BACKLOG-300). The 295 activity read has driven exactly one thing since it shipped —
 * a glyph over the dino's head. Now the greeting names what the keeper interrupted, with **no model
 * loaded**, which is the half that makes it reachable on every device (CHARTER v7).
 *
 * The clauses are pinned here on purpose: they are what a player actually reads.
 */

type W = Record<string, any>;

/** Both phrasings of the activities this spec drives — the dino picks one by name. */
const CLAUSES: Record<string, string[]> = {
  feeding: ['swallows first, then talks', 'has a cheek still full and no shame about it'],
  huddling: ['peels itself out of the warm pile', 'stays curled and answers from where it is'],
  gathering: ['sets down what it was carrying, carefully', 'shifts a load to its other side to look at you'],
};
const ALL = Object.values(CLAUSES).flat();

const names = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const activity = (p: Page, n: string) => p.evaluate((nn) => (window as W).__activity(nn) as string | null, n);
const greet = (p: Page, n: string) =>
  p.evaluate((nn) => (window as W).__pickTone(nn, 'warm') as Promise<string>, n);
const dropFood = (p: Page) => p.evaluate(() => (window as W).__dropFood());
const step = (p: Page) => p.evaluate(() => (window as W).__stepWorld());
const inventTic = (p: Page, n: string) => p.evaluate((nn) => (window as W).__inventTic(nn), n);

/** Walk the world until somebody is doing one of the things this spec has words for. */
async function findBusyDino(page: Page, limit = 120): Promise<{ name: string; act: string }> {
  const roster = await names(page);
  for (let i = 0; i < limit; i++) {
    for (const n of roster) {
      const act = await activity(page, n);
      if (act && CLAUSES[act]) return { name: n, act };
    }
    if (i % 8 === 0) await dropFood(page); // the hatch is the fastest way to make somebody busy
    await step(page);
  }
  throw new Error('no dino ever got busy');
}

test('a dino says what the keeper pulled it off', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const { name, act } = await findBusyDino(page);
  const line = await greet(page, name);

  // Its own activity's clause is there...
  expect(CLAUSES[act].some((c) => line.includes(c))).toBe(true);
  // ...and no other activity's is.
  for (const [other, clauses] of Object.entries(CLAUSES)) {
    if (other === act) continue;
    for (const c of clauses) expect(line).not.toContain(c);
  }

  expect(errors).toEqual([]);
});

test('a dino caught mid-ritual talks about the ritual, and only the ritual', async ({ page }) => {
  await boot(page);
  const roster = await names(page);
  const name = roster[0];

  expect(await inventTic(page, name)).toBe(true);
  const line = await greet(page, name);

  // 423's aside is the one that fires — exactly one aside, and the more specific one wins.
  expect(line).toMatch(/feet still going|finishes the turn|sets the thing down/);
  for (const c of ALL) expect(line).not.toContain(c);
});

test('a wanderer greets exactly as it always did', async ({ page }) => {
  await boot(page);
  const roster = await names(page);

  // Find somebody doing nothing in particular — the common case, and the one that must be untouched.
  let wanderer: string | null = null;
  for (const n of roster) if ((await activity(page, n)) === 'wandering' || (await activity(page, n)) === null) wanderer = n;
  test.skip(!wanderer, 'nobody was idle this boot');

  const line = await greet(page, wanderer!);
  for (const c of ALL) expect(line).not.toContain(c);
});
