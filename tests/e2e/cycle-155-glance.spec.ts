import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

type W = Record<string, unknown>;
type Marks = Record<string, string[]>;

const marks = (p: Page) => p.evaluate(() => ((window as W).__marks as () => Marks)());
const glancers = async (p: Page) =>
  Object.entries(await marks(p))
    .filter(([, worn]) => worn.includes('glance'))
    .map(([name]) => name);

/** Wind this sitting back past `SESSION_MIN_MS` so the spec need not sleep twenty real seconds. */
const ageSession = (p: Page, ms = 60_000) =>
  p.evaluate((n) => ((window as W).__ageSession as (m: number) => number)(n), ms);

/**
 * Give one awake, on-screen dino something to be closest *about*. A fresh park has no friendship at
 * all, and `partingGlance` correctly answers "nobody" to that — so a spec about *who* looks up has to
 * make somebody the answer first. Returns the name it picked.
 */
const befriend = async (p: Page) => {
  const name = await p.evaluate(() => {
    const w = window as W;
    const resting = new Set((w.__resting as () => string[])());
    const who = (w.__dinoNames as () => string[])().find((n) => !resting.has(n));
    if (who) (w.__setFriendship as (n: string, pts: number) => void)(who, 90);
    return who ?? null;
  });
  expect(name, 'the founding hour leaves somebody awake').not.toBeNull();
  return name as string;
};

/**
 * BACKLOG-119 — the goodbye glance.
 *
 * The item's own text has named the hidden-tab event as its trigger since cycle 30, which is precisely the
 * one moment at which nothing drawn can be seen. It fires on `leaving` instead — focus lost, canvas still
 * painting — and that correction is what these specs are really asserting.
 */
test('leaving the window makes exactly one dino look up', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await ageSession(page);

  expect(await glancers(page), 'nobody is mid-goodbye before you go').toEqual([]);
  const favourite = await befriend(page);

  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.waitForTimeout(300);

  expect(await glancers(page), 'one look, one dino, and it is the one that likes you best').toEqual([
    favourite,
  ]);
});

test('a park you have never spoken to does not wave you off', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await ageSession(page);

  // The documented silence, asserted rather than assumed: with no friendship anywhere, `partingGlance`
  // returns null and nobody looks up. A fresh park's goodbye has to be earned.
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.waitForTimeout(300);
  expect(await glancers(page)).toEqual([]);
});

test('a blur before the session floor is not a goodbye', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  // Deliberately no `__ageSession`: this sitting is seconds old, which is the alt-tab a player fires
  // while switching *into* the park. Asserted as the silence, because the silence is the feature.
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.waitForTimeout(300);
  expect(await glancers(page)).toEqual([]);
});

test('the look does not outlive its welcome', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await ageSession(page);

  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.waitForTimeout(3200); // GLANCE_MS (2500) plus a beat
  expect(await glancers(page), 'the bowl goes quiet').toEqual([]);
});

test('a hidden tab is not drawn to', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await ageSession(page);

  // No blur first: the tab goes straight to hidden, which is the stage the item originally named and
  // the stage at which nothing may be drawn. It must not throw, and it must not show anything.
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForTimeout(300);
  expect(await glancers(page)).toEqual([]);
});

test('a sleeping dino never throws the glance', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await ageSession(page);
  // Make the *sleepers* the best-liked dinos in the park. If the candidate list did not exclude them,
  // this is the arrangement that would catch it — the top of the friendship table is face-down.
  await page.evaluate(() => {
    const w = window as W;
    for (const n of (w.__resting as () => string[])()) {
      (w.__setFriendship as (name: string, pts: number) => void)(n, 100);
    }
  });
  await befriend(page);

  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.waitForTimeout(300);

  const all = await marks(page);
  for (const [name, worn] of Object.entries(all)) {
    if (worn.includes('glance')) expect(worn.includes('sleep'), name).toBe(false);
  }
});
