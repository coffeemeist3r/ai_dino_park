import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

type W = Record<string, unknown>;
type Marks = Record<string, string[]>;

const marks = (p: Page) => p.evaluate(() => ((window as W).__marks as () => Marks)());
const glancers = async (p: Page) =>
  Object.entries(await marks(p))
    .filter(([, worn]) => worn.includes('glance'))
    .map(([name]) => name);
const spent = (p: Page) => p.evaluate(() => ((window as W).__spentThisVisit as () => string[])());
/** Wind both clocks back — the visit and the sitting inside it (the 541/542 hook, widened by 545). */
const ageSession = (p: Page, ms = 60_000) =>
  p.evaluate((n) => ((window as W).__ageSession as (m: number) => number)(n), ms);

/** The cycle-155 helper, copied rather than re-invented: give one awake dino something to be closest about. */
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

const blur = async (p: Page) => {
  await p.evaluate(() => window.dispatchEvent(new Event('blur')));
  await p.waitForTimeout(300);
};
const back = async (p: Page) => {
  await p.evaluate(() => window.dispatchEvent(new Event('focus')));
  await p.waitForTimeout(3200); // GLANCE_MS (2500) and a beat — the old look must be gone first
};

/**
 * BACKLOG-545 — once a visit.
 *
 * 542 made the sitting a *focus period*, which is the right unit for "how long did you stay" and the wrong
 * one for "has this greeting happened yet". These specs pin both halves of the correction: the goodbye
 * stops repeating, and the keeper who could never earn it starts earning it.
 */
test('nothing is spent at the start of a visit', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  expect(await spent(page)).toEqual([]);
});

test('the goodbye happens once a visit, however many times you alt-tab', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const favourite = await befriend(page);

  await ageSession(page);
  await blur(page);
  expect(await glancers(page), 'the first leaving earns it').toEqual([favourite]);
  expect(await spent(page)).toEqual(['glance']);

  // Back in, sit another full minute, and go again. Under the old rule this was a second goodbye.
  await back(page);
  await ageSession(page);
  await blur(page);
  expect(await glancers(page), 'a greeting that repeats is a tic').toEqual([]);
});

/**
 * The additive half, and the reachability answer.
 *
 * Under 542 the twenty-second floor restarted from every *return*, so a keeper who dips in and out —
 * never holding focus for twenty unbroken seconds — could not earn this beat at all, no matter how long
 * they had been in the park. The floor now means what its own doc comment in `departure.ts` says: how long
 * a session must have run. The session is the visit.
 */
test('a keeper who never sits still still gets said goodbye to', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const favourite = await befriend(page);

  // A minute in the park, then a real return — which re-stamps the *sitting* to right now and leaves the
  // visit a minute old. That is precisely the keeper the old rule silenced.
  await ageSession(page);
  await back(page);
  await blur(page);

  expect(await glancers(page), 'the visit earned it even though this sitting did not').toEqual([
    favourite,
  ]);
});

test('a blur before the visit is twenty seconds old is still silence', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await befriend(page);

  // No ageSession: this visit is seconds old, which is the alt-tab a player fires on the way in.
  await blur(page);
  expect(await glancers(page)).toEqual([]);
  expect(await spent(page), 'and a beat that did not happen spends nothing').toEqual([]);
});

/**
 * The ordering that the whole gate hangs on: a park with no friendship has nothing to say, and must not
 * burn its one goodbye saying it. Otherwise a keeper who alt-tabs before befriending anybody would never
 * be waved off for the rest of the visit.
 */
test('a silent goodbye does not spend the visit', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  await ageSession(page);
  await blur(page);
  expect(await glancers(page), 'a park you have never spoken to says nothing').toEqual([]);
  expect(await spent(page)).toEqual([]);

  await back(page);
  const favourite = await befriend(page);
  await ageSession(page);
  await blur(page);
  expect(await glancers(page), 'and the goodbye is still there to be earned').toEqual([favourite]);
});

test('a reload is a new visit', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await befriend(page);
  await ageSession(page);
  await blur(page);
  expect(await spent(page)).toEqual(['glance']);

  await page.reload();
  await boot(page);
  expect(await spent(page), 'opening the park again owes you a goodbye again').toEqual([]);
});
