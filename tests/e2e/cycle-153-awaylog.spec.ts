import { test, expect } from '@playwright/test';
import { boot, foundingState } from './helpers';
import { AWAY_BEAT_MIN_MINUTES } from '../../game/src/world/away';
import { AWAY_LOG_HEADING, type AwayEntry } from '../../game/src/world/awaylog';

type W = Record<string, unknown>;
type CatchUp = { minutes: number; digest: string[] };

const catchUp = (page: import('@playwright/test').Page, ms: number) =>
  page.evaluate((m) => ((window as W).__catchUp as (n: number) => CatchUp)(m), ms);

const bookText = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__bookText as () => string)());

const awayLog = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__awayLog as () => AwayEntry[])());

/**
 * BACKLOG-114 — the book keeps what the bowl got up to.
 *
 * The item's own words are *re-read what the bowl got up to without having caught the digest live*, and the
 * word doing the work is **re-read**. So the first spec asserts the block is in the book at all, and the
 * second reloads the page — because a log that only survives until the tab closes is the modal with extra
 * steps.
 */
test('the digest you dismissed is still in the book', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  const result = await catchUp(page, AWAY_BEAT_MIN_MINUTES * 60_000);
  expect(result.minutes).toBeGreaterThan(0);
  expect(result.digest.length).toBeGreaterThan(0);

  const book = await bookText(page);
  expect(book).toContain(AWAY_LOG_HEADING);
  // Not "a heading exists" — the actual sentence the park wrote about the absence.
  for (const line of result.digest) expect(book).toContain(line);
  // ...and it sits above the cast, where the thing that is about *you* belongs.
  expect(book.indexOf(AWAY_LOG_HEADING)).toBeLessThan(book.indexOf('Rex'));
});

test('and it is still there after a reload — re-readable means tomorrow', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  const result = await catchUp(page, AWAY_BEAT_MIN_MINUTES * 60_000);
  const kept = result.digest[0];
  expect(kept).toBeTruthy();
  await page.evaluate(() => ((window as W).__saveNow as () => Promise<unknown>)());

  await boot(page);
  const book = await bookText(page);
  expect(book).toContain(AWAY_LOG_HEADING);
  expect(book).toContain(kept);
});

test('two returns leave two entries, newest first', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  await catchUp(page, AWAY_BEAT_MIN_MINUTES * 60_000);
  await catchUp(page, AWAY_BEAT_MIN_MINUTES * 4 * 60_000);

  const log = await awayLog(page);
  expect(log).toHaveLength(2);
  // The longer gap happened second, so it is on top — and the two returns say different things, which is
  // the whole reason the book keeps more than one.
  expect(log[0].minutes).toBeGreaterThan(log[1].minutes);
  expect(log[0].at).toBeGreaterThanOrEqual(log[1].at);
});
