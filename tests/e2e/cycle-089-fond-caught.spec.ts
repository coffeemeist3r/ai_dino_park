import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Fond of being caught (BACKLOG-413). The 408 catch forks on bond: a dino that loves the keeper (hearts ≥
 * FOND_MIN), caught mid-tic, reads *pleased* — a warm opener + a glad memory — while a dino you barely know
 * still goes bashful exactly as in 408. Same event, opposite reading, decided by the individual.
 */

type W = Record<string, any>;

const names = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const setHearts = (p: Page, n: string, h: number) => p.evaluate(([nn, hh]) => (window as W).__setHearts(nn, hh), [n, h] as const);
const inventTic = (p: Page, n: string) => p.evaluate((nn) => (window as W).__inventTic(nn), n);
const greet = (p: Page, n: string) => p.evaluate((nn) => (window as W).__pickTone(nn, 'warm') as Promise<string>, n);
const memory = (p: Page, n: string) =>
  p.evaluate((nn) => ((window as W).__memory() as Record<string, string[]>)[nn] ?? [], n);

test('a fond mid-tic dino is pleased (not bashful); a stranger mid-tic is still bashful', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const roster = await names(page);
  const [fond, stranger] = [roster[0], roster[1]];

  // A beloved dino caught mid-ritual reads pleased — a warm opener, no bashful frame.
  await setHearts(page, fond, 10);
  expect(await inventTic(page, fond)).toBe(true);
  const fondLine = await greet(page, fond);
  expect(fondLine).toContain("don't mind"); // the fond opener shows the ritual off
  expect(fondLine).not.toContain('caught mid-fidget'); // NOT the bashful frame
  const fondMem = await memory(page, fond);
  expect(fondMem.some((m) => m.includes('glad it was them'))).toBe(true);

  // A barely-known dino caught the same way is still bashful (the 408 path, unchanged).
  await setHearts(page, stranger, 0);
  expect(await inventTic(page, stranger)).toBe(true);
  const strangerLine = await greet(page, stranger);
  expect(strangerLine).toContain('caught mid-fidget');
  expect(strangerLine).not.toContain("don't mind");

  expect(errors).toEqual([]);
});
