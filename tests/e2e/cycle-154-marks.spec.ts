import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

type W = Record<string, unknown>;
type Marks = Record<string, string[]>;

const marks = (p: Page) => p.evaluate(() => ((window as W).__marks as () => Marks)());

/**
 * BACKLOG-530 — the marks nobody could assert.
 *
 * A dino has been able to wear five glyphs since cycle 149 and no spec in this park had ever read one. Every
 * claim about which mark is showing — including the precedence rules that decide which of two mutually
 * exclusive marks wins a shared slot — was implemented and then reviewed by reading the source, which is how
 * three consecutive cycles came to raise a mark criterion and be unable to pin it.
 *
 * `__marks()` reads `.visible` off the production mark objects. That is the item's own requirement and it
 * matters: a hook that re-derived "is this dino resting" would agree with the scene right up until the day
 * it stopped, and the whole complaint is that nothing could tell.
 */
test('a resting dino wears the sleeper mark, read off the object the scene draws', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  // The founding hour splits the cast (BACKLOG-523): somebody is down at 08:00 and somebody is up.
  const resting = await page.evaluate(() => ((window as W).__resting as () => string[])());
  expect(resting.length, 'the founding hour is supposed to split the cast').toBeGreaterThan(0);

  const all = await marks(page);
  const here = Object.entries(all).filter(([, worn]) => !worn.includes('offscreen'));
  expect(here.length, 'somebody is on the ground the keeper is standing on').toBeGreaterThan(0);

  // Both directions, which is what makes this a claim about the mark rather than about the predicate:
  // everybody on this ground who is resting wears it, and nobody who is not, does.
  for (const [name, worn] of here) {
    expect(worn.includes('sleep'), name).toBe(resting.includes(name));
  }
  expect(here.some(([, worn]) => worn.includes('sleep')), 'a sleeper is visible on the first frame').toBe(true);
});

test('sleep and rouse never co-occur — they share a slot by construction', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  for (const [name, worn] of Object.entries(await marks(page))) {
    expect(worn.includes('sleep') && worn.includes('rouse'), name).toBe(false);
  }
});

test('the vigil takes the slot from the owl that is keeping it', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  const keeper = await page.evaluate(() => {
    const w = window as W;
    // Put the park at an hour the owls are up and dispatch a vigil, the way `cycle-149`'s spec does.
    (w.__setClock as (d: number, h: number, m: number) => void)(1, 2, 0);
    (w.__visitHours as (h: number[]) => void)([2, 2, 2]);
    const v = (w.__stepVigil as () => { keeper: string } | null)();
    return v?.keeper ?? null;
  });
  test.skip(!keeper, 'no vigil dispatched at this hour — the precedence claim needs one');

  const worn = (await marks(page))[keeper as string] ?? [];
  expect(worn).toContain('vigil');
  // `refreshRouseMarks`' own comment: these two are not mutually exclusive, and what a dino is *doing*
  // beats what hours it keeps. This is that comment, as a spec.
  expect(worn).not.toContain('rouse');
});

test('a dino carrying a mend wears the errand, and only that dino', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  const fixer = await page.evaluate(() => {
    const w = window as W;
    // Stand on the ground with the founding ruin — the marks are in-view gated, so the errand has to be
    // watched from the ground it is happening on, which is also how a player would see it.
    (w.__setZone as (z: string) => void)('grove');
    const m = (w.__stepMend as () => { fixer: string } | null)();
    return m?.fixer ?? null;
  });
  test.skip(!fixer, 'no mend in flight — the founding ruin has already been patched this run');

  const all = await marks(page);
  expect(all[fixer as string]).toContain('mend');
  for (const [name, worn] of Object.entries(all)) {
    if (name !== fixer) expect(worn, name).not.toContain('mend');
  }
  // The family's rule: doing beats thinking. A fixer on an errand shows no missed thought.
  expect(all[fixer as string]).not.toContain('missed');
});
