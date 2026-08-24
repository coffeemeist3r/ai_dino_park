import { test, expect, type Page } from '@playwright/test';
import { boot, gatherToBowl } from './helpers';

/**
 * Glad of the company (BACKLOG-411).
 *
 * Every previous cycle of the tic made its *start* legible. Its far commoner ending — another dino
 * wandering into range — went through `resetTic` and left nothing at all behind: no float, no memory, no
 * ticker line, and a dino that greeted you as though the last minute had not happened. These specs drive
 * production's own `breakTic` through the dev hook and prove the ending is a beat now, that a need ending
 * a stretch is still not one, and that the keeper's catch still outranks the trace.
 */

type W = Record<string, any>;

const names = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const place = (p: Page, n: string, x: number, y: number) =>
  p.evaluate(([nn, xx, yy]) => (window as W).__placeDino(nn, xx, yy), [n, x, y] as const);
const inventTic = (p: Page, n: string) => p.evaluate((nn) => (window as W).__inventTic(nn), n);
const breakTic = (p: Page, n: string, agedBy = 0) =>
  p.evaluate(
    ([nn, aa]) => (window as W).__breakTic(nn, aa) as { friend: string; at: number } | null,
    [n, agedBy] as const,
  );
const trace = (p: Page, n: string) =>
  p.evaluate((nn) => (window as W).__companyTrace(nn) as { friend: string; at: number } | null, n);
const ticker = (p: Page) => p.evaluate(() => (window as W).__ticker() as string[]);
const memory = (p: Page, n: string) =>
  p.evaluate((nn) => ((window as W).__memory() as Record<string, string[]>)[nn] ?? [], n);
const greet = (p: Page, n: string) => p.evaluate((nn) => (window as W).__pickTone(nn, 'warm') as Promise<string>, n);
const setNeed = (p: Page, n: string, which: 'hunger' | 'thirst', v: number) =>
  p.evaluate(([nn, ww, vv]) => (window as W).__setNeed(nn, ww, vv), [n, which, v] as const);
const dismiss = (p: Page) => p.keyboard.press('X').catch(() => undefined);

/**
 * One dino mid-ritual with exactly one other body inside `TIC_COMPANY_RANGE`. `gatherToBowl` puts the whole
 * cast on one ground, so the rest are parked in the far corner deliberately: `nearestCompany` picks the
 * nearest and tie-breaks by name, and a spec that let eight dinos stand in a heap would be asserting the
 * tie-break rather than the beat.
 */
async function loneAndFinder(page: Page): Promise<[string, string]> {
  await gatherToBowl(page);
  const roster = await names(page);
  const [lone, finder] = roster;
  for (const n of roster.slice(2)) await place(page, n, 19, 14);
  await place(page, lone, 9, 6);
  await place(page, finder, 10, 6); // inside TIC_COMPANY_RANGE
  await inventTic(page, lone);
  return [lone, finder];
}

test('a ritual ended by a body is a moment, and the park says so', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const [lone, finder] = await loneAndFinder(page);
  const left = await breakTic(page, lone);

  expect(left?.friend).toBe(finder);
  expect(await trace(page, lone)).not.toBeNull();

  const filed = (await memory(page, lone)).filter((m) => m.includes('glad of the company'));
  expect(filed.length).toBe(1);
  expect(filed[0]).toContain(finder);

  const lines = (await ticker(page)).filter((l) => l.includes('came over while'));
  expect(lines.length).toBe(1);
  expect(lines[0]).toContain(lone);
  expect(lines[0]).toContain(finder);

  expect(errors).toEqual([]);
});

test('a need is not company — a dino that walked off to the hatch was not found', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const [lone] = await loneAndFinder(page);
  await setNeed(page, lone, 'hunger', 1);

  expect(await breakTic(page, lone)).toBeNull();
  expect(await trace(page, lone)).toBeNull();
  expect((await memory(page, lone)).filter((m) => m.includes('glad of the company'))).toEqual([]);
  expect((await ticker(page)).filter((l) => l.includes('came over while'))).toEqual([]);

  expect(errors).toEqual([]);
});

test('the next greeting leads with it, exactly once', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const [lone, finder] = await loneAndFinder(page);
  await breakTic(page, lone);

  const first = await greet(page, lone);
  expect(first).toContain('Glad you came by');
  expect(first).toContain(finder);

  await dismiss(page);
  const second = await greet(page, lone);
  expect(second).not.toContain('Glad you came by');

  expect(errors).toEqual([]);
});

test('a trace older than the window is not worth leading with', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const [lone] = await loneAndFinder(page);
  await breakTic(page, lone, 999); // backdated well past COMPANY_TRACE_FADES_AFTER_STEPS

  expect(await greet(page, lone)).not.toContain('Glad you came by');

  expect(errors).toEqual([]);
});

test("the keeper's catch outranks the trace — a dino mid-ritual is bashful, not glad", async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const [lone] = await loneAndFinder(page);
  await breakTic(page, lone); // stretch one leaves a fresh trace
  await inventTic(page, lone); // ...and stretch two starts before the keeper walks up

  const line = await greet(page, lone);
  expect(line).not.toContain('Glad you came by');
  // ...and the trace is still there, unspent: the catch took the line, not the trace.
  expect(await trace(page, lone)).not.toBeNull();

  expect(errors).toEqual([]);
});
