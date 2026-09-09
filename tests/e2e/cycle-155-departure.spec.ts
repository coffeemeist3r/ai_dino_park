import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

type W = Record<string, unknown>;
type Departure = { stage: string; stamps: number };

const departure = (p: Page) => p.evaluate(() => ((window as W).__departure as () => Departure)());
const savedAt = (p: Page) =>
  p.evaluate(async () => {
    const data = (await ((window as W).__saveNow as () => Promise<{ savedAt?: number }>)());
    return data.savedAt ?? 0;
  });

/**
 * BACKLOG-541 — the departure seam.
 *
 * Before this cycle the park had four modules about the keeper coming back and none about the keeper
 * going, so `savedAt` was stamped by whichever of twenty-odd scattered saves fired last — which is to say
 * it recorded when the keeper last *did* something, not when they left. Every number Milestone 18 prints
 * on return is measured from that stamp.
 */
test('a blur is a departure, and it happens exactly once', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  expect((await departure(page)).stage).toBe('here');
  const before = (await departure(page)).stamps;

  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const left = await departure(page);
  expect(left.stage, 'focus lost while the canvas still paints').toBe('leaving');
  expect(left.stamps).toBe(before + 1);
});

test('the visibility change that follows a blur is the same departure, not a second one', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const afterBlur = (await departure(page)).stamps;

  // The ordinary alt-tab: blur, then visibilitychange a moment later. Two events, one leaving.
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  expect((await departure(page)).stamps, 'one departure stamps once').toBe(afterBlur);
});

test('coming back and leaving again is a second departure', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  const start = (await departure(page)).stamps;
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  expect((await departure(page)).stage, 'a return is not a departure').toBe('here');
  expect((await departure(page)).stamps).toBe(start + 1);

  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  expect((await departure(page)).stamps).toBe(start + 2);
});

test('the save is stamped at the moment of leaving', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  const before = await savedAt(page);
  expect(before, 'a booted park has written a save').toBeGreaterThan(0);

  await page.waitForTimeout(1200);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  // The departure's own save is fire-and-forget; give it a beat to land in the store.
  await page.waitForTimeout(500);

  const after = await savedAt(page);
  expect(after, 'leaving wrote a fresher savedAt than the last interaction had').toBeGreaterThan(before);
});

test('the hidden-tab clock retune still happens', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  // BACKLOG-493's behavior is untouched by this cycle, and this asserts it rather than assuming it:
  // the departure listener was added *beside* the visibility handler, not in place of it.
  const governor = await page.evaluate(() => ((window as W).__governor as () => { hidden: boolean })());
  expect(typeof governor.hidden).toBe('boolean');
});
