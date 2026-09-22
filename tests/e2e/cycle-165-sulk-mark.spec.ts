import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

type W = Record<string, unknown>;
type MarkKind = { kind: string; text?: string; texture?: string } | null;

/**
 * BACKLOG-543's host (cycle 165) — the funk wears its mood for as long as it holds.
 *
 * This is the reachable half of BACKLOG-533's structure track. Before it, a dino that lost a scramble at
 * the hatch got **one frame** of a glyph at the moment the funk began and then, for the whole minute it
 * was actually sore, looked exactly like every contented animal in the bowl. The state has existed since
 * BACKLOG-544; what was missing was somewhere to hang it.
 *
 * Staged through `__forceContest` — the production resolution `checkFeeding` calls — per the cycle-128
 * discipline, and reusing cycle-157's own staging so the two specs cannot disagree about what a funk is.
 */

const marks = (page: Page): Promise<Record<string, string[]>> =>
  page.evaluate(() => ((window as W).__marks as () => Record<string, string[]>)());

const markKind = (page: Page, name: string): Promise<MarkKind> =>
  page.evaluate((n) => ((window as W).__markKind as (x: string, f: string) => MarkKind)(n, 'sulk'), name);

const funks = (page: Page): Promise<Array<{ name: string; kind: string; age: number }>> =>
  page.evaluate(() => ((window as W).__funks as () => Array<{ name: string; kind: string; age: number }>)());

async function driveSteps(page: Page, n: number): Promise<void> {
  await page.evaluate((count) => {
    const step = (window as W).__stepWorld as () => void;
    for (let i = 0; i < count; i += 1) step();
  }, n);
}

/** Drop food, force the production contest, and return the dino that came away with nothing. */
async function stageStandoff(page: Page): Promise<string> {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await page.evaluate(() => ((window as W).__dropFood as (c?: number, f?: string) => unknown)(undefined, 'fish'));
  await page.evaluate(() =>
    ((window as W).__setTrait as (n: string, k: string, v: number) => boolean)('Sunny', 'bravery', 1),
  );
  await page.evaluate(() => ((window as W).__forceContest as (w: string, g: string) => unknown)('Sunny', 'Glade'));
  return 'Glade';
}

test('a sore dino wears the funk for the length of it, and nobody else does (BACKLOG-543 host)', async ({ page }) => {
  const loser = await stageStandoff(page);
  expect((await funks(page)).map((f) => f.name)).toContain(loser);

  const shown = await marks(page);
  expect(shown[loser]).toContain('sulk');
  // The winner is not sore, so it wears nothing. A mark everyone wears is a background, not a signal.
  expect(shown['Sunny'] ?? []).not.toContain('sulk');
});

test('the mark is built through the rig lookup, so a drawn sulk has somewhere to go (BACKLOG-543)', async ({ page }) => {
  const loser = await stageStandoff(page);
  const mark = await markKind(page, loser);
  expect(mark).not.toBeNull();
  // Text until the Artist lands the rig, an Image the moment it exists — `makeHourMark`'s contract, and
  // the exact thing that was *not* true of the `activityMarks` setText this item was blocked on twice.
  // The rig landed in this same cycle's Artist fire, so the wired answer is now the *only* right one:
  // accepting 'text' here would let the rig quietly stop being blitted and call it a pass.
  expect(mark!.kind).toBe('image');
  expect(mark!.texture).toBeTruthy();
});

test('the mark clears when the funk runs out (BACKLOG-543/544)', async ({ page }) => {
  const loser = await stageStandoff(page);
  expect((await marks(page))[loser]).toContain('sulk');

  // The shoulder funk's window is twenty steps; one more so the frame after the expiry is painted.
  await driveSteps(page, 21);
  expect((await funks(page)).map((f) => f.name)).not.toContain(loser);
  expect((await marks(page))[loser] ?? []).not.toContain('sulk');
});

test("the keeper's attention clears it early (BACKLOG-543/544)", async ({ page }) => {
  const loser = await stageStandoff(page);
  expect((await marks(page))[loser]).toContain('sulk');

  await page.evaluate((n) => ((window as W).__greet as (x: string) => number)(n), loser);
  expect((await marks(page))[loser] ?? []).not.toContain('sulk');
});

test('a shivering dino does not also wear the sulk — one glyph per slot (BACKLOG-543/184)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'all-bowl');

  // Cycle-047's `stageColdMorning`, verbatim: day 22 is the winter night it picked, a bonded pair keeps
  // the den honest, and the 08:00 step is the window's closing edge. Nothing here fabricates the funk.
  await page.evaluate(() => {
    const w = window as Record<string, any>;
    w.__bondPair('Rex', 'Mossback', 12);
    w.__setClock(22, 20, 0);
    w.__stepWorld();
    w.__stepWorld();
    w.__setClock(22, 8, 0);
    w.__stepWorld();
  });
  const chilled: string[] = await page.evaluate(() => ((window as W).__coldPending as () => string[])());
  expect(chilled.length).toBeGreaterThan(0);

  // Now make one of the shivering dinos lose a scramble as well, so it is genuinely in both states.
  const both = chilled[0];
  const winner = ['Rex', 'Mossback', 'Sunny', 'Twitch', 'Glade'].find((n) => n !== both)!;
  await page.evaluate(() => ((window as W).__dropFood as (c?: number, f?: string) => unknown)(undefined, 'fish'));
  // The bold one holds, exactly as cycle-157 stages it — without this the contest can resolve the other
  // way and the dino left with nothing is not the one that is also cold.
  await page.evaluate(
    (n) => ((window as W).__setTrait as (x: string, k: string, v: number) => boolean)(n, 'bravery', 1),
    winner,
  );
  await page.evaluate(
    ([w0, l0]) => ((window as W).__forceContest as (w: string, g: string) => unknown)(w0, l0),
    [winner, both] as const,
  );
  expect((await funks(page)).map((f) => f.name)).toContain(both);

  // Both marks live at the same offset. The cold is the louder fact and already has its own glyph, so
  // the sulk stands down rather than stacking two emoji in one place.
  const shown = (await marks(page))[both];
  expect(shown).toContain('cold');
  expect(shown).not.toContain('sulk');
});
