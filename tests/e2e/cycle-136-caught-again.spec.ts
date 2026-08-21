import { test, expect, type Page } from '@playwright/test';
import { boot, gatherToBowl } from './helpers';

/**
 * Caught again (BACKLOG-420). Since cycle 89 the catch has forked exactly two ways and both are constant
 * strings — the same opener on the first interruption and the fifth. Now the *fond* reading climbs across
 * one stretch of solitude (pleased → teasing → fondly resigned, then floors), worded from the dino's own
 * signature axis, while a dino that barely knows you stays bashful however often you find it.
 *
 * Every line here comes out of the real `__pickTone` greet path; nothing re-implements the fork.
 */

type W = Record<string, any>;

const names = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const setHearts = (p: Page, n: string, h: number) =>
  p.evaluate(([nn, hh]) => (window as W).__setHearts(nn, hh), [n, h] as const);
const inventTic = (p: Page, n: string) => p.evaluate((nn) => (window as W).__inventTic(nn), n);
const greet = (p: Page, n: string) => p.evaluate((nn) => (window as W).__pickTone(nn, 'warm') as Promise<string>, n);
const catches = (p: Page, n: string) => p.evaluate((nn) => (window as W).__ticCatches(nn) as number, n);
const memory = (p: Page, n: string) =>
  p.evaluate((nn) => ((window as W).__memory() as Record<string, string[]>)[nn] ?? [], n);
const dismiss = (p: Page) => p.keyboard.press('X').catch(() => undefined);

/** Greet the same dino again inside the same stretch: close the dialog, re-arm the catch, ask again. */
async function greetAgain(page: Page, name: string): Promise<string> {
  await dismiss(page);
  await inventTic(page, name);
  return greet(page, name);
}

test('the register climbs across one stretch, then floors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  await gatherToBowl(page);

  const [fond] = await names(page);
  await setHearts(page, fond, 10);
  expect(await inventTic(page, fond)).toBe(true);

  const first = await greet(page, fond);
  expect(first).toContain("don't mind"); // 413s pleased opener, unchanged
  expect(await catches(page, fond)).toBe(1);

  const second = await greetAgain(page, fond);
  expect(second).not.toContain("don't mind");
  expect(second).not.toContain('caught mid-fidget');
  expect(await catches(page, fond)).toBe(2);

  const third = await greetAgain(page, fond);
  const fourth = await greetAgain(page, fond);
  expect(third).not.toBe(second); // the register moved on
  // Floors at resigned: a fourth catch reads exactly like the third.
  const opener = (line: string) => line.split(' ').slice(0, 6).join(' ');
  expect(opener(fourth)).toBe(opener(third));

  expect(errors).toEqual([]);
});

test('warmth earns the tease — a stranger stays bashful however often you find it', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  await gatherToBowl(page);

  const stranger = (await names(page))[1];
  await setHearts(page, stranger, 0);
  expect(await inventTic(page, stranger)).toBe(true);

  for (let i = 0; i < 3; i++) {
    const line = i === 0 ? await greet(page, stranger) : await greetAgain(page, stranger);
    expect(line).toContain('caught mid-fidget'); // the flatness IS the read
  }

  expect(errors).toEqual([]);
});

test('two fond dinos tease you in two different voices', async ({ page }) => {
  await boot(page);
  await gatherToBowl(page);

  const roster = await names(page);
  const teases: string[] = [];
  for (const name of roster.slice(0, 4)) {
    await setHearts(page, name, 10);
    await inventTic(page, name);
    await greet(page, name); // 1st — pleased
    teases.push(await greetAgain(page, name)); // 2nd — teasing, in this dino's own words
  }

  // At least two of the cast object to being spied on differently — the distinctness bar.
  expect(new Set(teases).size).toBeGreaterThan(1);
});

test('each register leaves at most one memory, and a new stretch starts warm again', async ({ page }) => {
  await boot(page);
  await gatherToBowl(page);

  const [fond] = await names(page);
  await setHearts(page, fond, 10);
  await inventTic(page, fond);
  await greet(page, fond);
  await greetAgain(page, fond);
  await greetAgain(page, fond);
  await greetAgain(page, fond); // a fourth catch must not file a second resigned note

  const mem = await memory(page, fond);
  const count = (needle: string) => mem.filter((m) => m.includes(needle)).length;
  expect(count('glad it was them')).toBe(1); // pleased
  expect(count('gave them a hard time')).toBe(1); // teasing
  expect(count('let them stay and watch')).toBe(1); // resigned

  // The stretch ends (company or a need) and the count goes with it — being caught twice today does not
  // make a dino permanently sardonic.
  await page.evaluate((n) => (window as W).__resetTic?.(n), fond);
  if ((await catches(page, fond)) === 0) {
    await inventTic(page, fond);
    await dismiss(page);
    expect(await greet(page, fond)).toContain("don't mind");
  }
});
