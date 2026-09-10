import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

type W = Record<string, unknown>;
type SessionRecord = { startedAt: number; endedAt?: number };

const plaque = (p: Page) => p.evaluate(() => ((window as W).__plaque as () => Record<string, unknown>)());
const sessions = (p: Page) => p.evaluate(() => ((window as W).__sessions as () => SessionRecord[])());
/** Wind this sitting's start back, so a spec need not sleep out `SESSION_MIN_MS` (the 541 hook). */
const ageSession = (p: Page, ms: number) =>
  p.evaluate((n) => ((window as W).__ageSession as (m: number) => number)(n), ms);

/**
 * BACKLOG-542 — the sitting as a measured unit.
 *
 * Every keeper-facing number this park owns is a fact about *absence*. This is the first one about the
 * time the player is actually here, and the reachability answer is deliberately the plainest one there is:
 * open a fresh save, look at the brass, and it says how long you have been in the park.
 */
test('the brass says how long this sitting has run, on a fresh save', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  const stats = await plaque(page);
  expect(typeof stats.sitting).toBe('string');
  expect(stats.sitting as string).toMatch(/^\d+[hms]/);
});

test('the sitting grows while you stand there', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  await ageSession(page, 40_000);
  expect((await plaque(page)).sitting).toBe('40s');

  await ageSession(page, 100_000);
  expect((await plaque(page)).sitting).toBe('1m 40s');
});

test('leaving files the sitting, and coming back starts a new one', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  expect(await sessions(page), 'a fresh save has closed no sittings yet').toEqual([]);

  await ageSession(page, 5 * 60_000);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));

  const filed = await sessions(page);
  expect(filed).toHaveLength(1);
  expect(filed[0].endedAt).toBeDefined();
  expect(filed[0].endedAt! - filed[0].startedAt).toBeGreaterThanOrEqual(5 * 60_000);

  // The visibilitychange that follows the blur is the same leaving — it must not file a second record.
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(await sessions(page)).toHaveLength(1);

  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  const after = (await plaque(page)).sitting as string;
  expect(after, 'the returning keeper is at the start of a new sitting').toMatch(/^\d+s$/);
});

test('a sitting too short to count is not written down', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  // Under SESSION_MIN_MS (20s) — the same floor that decides whether leaving is a goodbye decides
  // whether staying was a visit.
  await ageSession(page, 3_000);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  expect(await sessions(page)).toEqual([]);
});

test('the filed sittings reach the save', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  await ageSession(page, 60_000);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));

  const saved = await page.evaluate(async () =>
    ((window as W).__saveNow as () => Promise<{ sessions?: SessionRecord[] }>)(),
  );
  expect(saved.sessions).toHaveLength(1);
  expect(saved.sessions![0].endedAt).toBeDefined();
});
