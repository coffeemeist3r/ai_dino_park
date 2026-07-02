import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Caught mid-tic (BACKLOG-408). Greet a dino deep in its solitary ritual (405) and it startles (😳), its
 * reply coming out bashful, and files a one-time "the keeper caught you mid-ritual" memory. A dino that
 * isn't mid-tic greets exactly as before — no bashful frame.
 */

type W = Record<string, any>;

const names = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const inventTic = (p: Page, n: string) => p.evaluate((nn) => (window as W).__inventTic(nn), n);
const greet = (p: Page, n: string) => p.evaluate((nn) => (window as W).__pickTone(nn, 'warm') as Promise<string>, n);
const memory = (p: Page, n: string) =>
  p.evaluate((nn) => ((window as W).__memory() as Record<string, string[]>)[nn] ?? [], n);
const tic = (p: Page, n: string) => p.evaluate((nn) => (window as W).__tic(nn), n);

test('greeting a mid-tic dino comes out bashful + files a caught memory; a normal dino greets plainly', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const roster = await names(page);
  const [caught, plain] = [roster[0], roster[1]];

  // Force the target mid-ritual, then greet it.
  expect(await inventTic(page, caught)).toBe(true);
  expect((await tic(page, caught)).invented).toBe(true);
  const caughtLine = await greet(page, caught);

  // The reply is prefixed with the deterministic bashful frame.
  expect(caughtLine).toContain('caught mid-fidget');
  expect(caughtLine).toContain(caught);

  // It filed the one-time caught memory (names the ritual + reads bashful).
  const mem = await memory(page, caught);
  expect(mem.some((m) => m.includes('the keeper caught you mid-ritual'))).toBe(true);

  // A dino that isn't mid-tic greets plainly — no bashful frame.
  const plainLine = await greet(page, plain);
  expect(plainLine).not.toContain('caught mid-fidget');

  expect(errors).toEqual([]);
});
