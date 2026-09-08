import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

type W = Record<string, unknown>;
type Streak = { last: string | null; run: number; best: number };

const plaque = (p: Page) => p.evaluate(() => (window as W).__plaque() as { streak: string });
const streak = (p: Page) => p.evaluate(() => ((window as W).__streak as () => Streak)());

/**
 * BACKLOG-122 — the park counts something that happens in the player's life.
 *
 * This is the reachability half of the item, and it is an e2e rather than a unit file for the reason the
 * bar asks about: the streak is a number in a save until it is engraved on the brass, and every read in
 * `streak.test.ts` would stay green on a park that never showed it to anybody.
 */
test('a fresh save says first day on the brass', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  expect((await plaque(page)).streak).toBe('first day');
  expect(await streak(page)).toMatchObject({ run: 1, best: 1 });
});

test('coming back the next real day reads two days running, through production code', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const day1 = await streak(page);
  expect(day1.run).toBe(1);

  // Move the keeper's clock — not the streak — a day forward and re-run the boot-time read. `recordVisit`
  // is what notes the day on a real reload, so driving it this way keeps the increment inside production:
  // nothing here tells the park what the streak *is*, only what time it is where the keeper lives.
  const after = await page.evaluate(() => {
    const w = window as W;
    const now = (w.__keeperNow as () => { ms: number })();
    (w.__keeperNow as (ms: number) => unknown)(now.ms + 24 * 60 * 60 * 1000);
    (w.__recordVisit as () => void)();
    return (w.__streak as () => Streak)();
  });

  expect(after.run).toBe(2);
  expect(after.best).toBe(2);
  expect((await plaque(page)).streak).toBe('2 days running');
});

test('a gap resets the run and leaves the best standing', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  await page.evaluate(() => {
    const w = window as W;
    (w.__streak as (s: Streak) => unknown)({ last: '2026-01-01', run: 4, best: 4 });
  });
  await page.evaluate(() => {
    const w = window as W;
    (w.__recordVisit as () => void)(); // today is not 2026-01-02
  });

  const s = await streak(page);
  expect(s.run).toBe(1);
  expect(s.best).toBe(4);
  expect((await plaque(page)).streak).toBe('first day · best 4');
});
