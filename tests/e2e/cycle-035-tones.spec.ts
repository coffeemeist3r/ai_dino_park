import { test, expect } from '@playwright/test';
import { boot } from './helpers';

// Headless Playwright has no WebGPU, so replies come from the canned fallback — but the tone
// machinery (delta + memory + remembered trace) is pure and runs regardless of the model.

type W = Record<string, unknown>;
const VALID_DELTAS = [-2, 1, 3, 5]; // toneReaction's four outcomes (clashed/neutral/liked/loved)

const openMenu = (page: import('@playwright/test').Page, name: string) =>
  page.evaluate((n) => ((window as W).__openToneMenu as (x: string) => string)(n), name);
const pickTone = (page: import('@playwright/test').Page, name: string, id: string) =>
  page.evaluate(({ name, id }) => ((window as W).__pickTone as (n: string, i: string) => Promise<void>)(name, id), {
    name,
    id,
  });
const menuOpen = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__toneMenuOpen as () => boolean)());
const friendship = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__friendship as () => Record<string, number>)());
const memory = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__memory as () => Record<string, string[]>)());
const lastTone = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__lastTone as () => Record<string, string>)());
const greet = (page: import('@playwright/test').Page, name: string) =>
  page.evaluate((n) => ((window as W).__greet as (x: string) => number)(n), name);

test('greeting opens a Warm/Tease/Honest menu, not an immediate reply (boot is clean)', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const text = await openMenu(page, 'Rex');
  expect(text).toContain('[1] Warm');
  expect(text).toContain('[2] Tease');
  expect(text).toContain('[3] Honest');
  expect(await menuOpen(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('a digit key selects a tone, closes the menu, and files the tone memory', async ({ page }) => {
  await boot(page);
  await page.locator('canvas').focus();

  await openMenu(page, 'Rex');
  expect(await menuOpen(page)).toBe(true);

  await page.keyboard.press('Digit1'); // → Warm
  await page.waitForTimeout(150);

  expect(await menuOpen(page)).toBe(false);
  expect((await lastTone(page)).Rex).toBe('warm');
  const mem = (await memory(page)).Rex ?? [];
  expect(mem[mem.length - 1]).toBe('the keeper greeted me warmly');
});

test('choosing a tone shifts affinity by a valid tone delta and records the trace', async ({ page }) => {
  await boot(page);

  // Seed a base above the clamp floor so a clashing (negative) delta is still observable.
  await greet(page, 'Sunny');
  const before = (await friendship(page)).Sunny ?? 0;

  await pickTone(page, 'Sunny', 'tease');
  const after = (await friendship(page)).Sunny ?? 0;

  expect(VALID_DELTAS).toContain(after - before);
  expect((await lastTone(page)).Sunny).toBe('tease');
  const mem = (await memory(page)).Sunny ?? [];
  expect(mem[mem.length - 1]).toBe('the keeper teased me');
});

test('the remembered tone persists in the save and surfaces in the next menu header', async ({ page }) => {
  await boot(page);

  await pickTone(page, 'Glade', 'honest');

  // Persisted into the exported save…
  const exported = await page.evaluate(() => ((window as W).__exportSave as () => string)());
  expect(JSON.parse(exported).lastTone.Glade).toBe('honest');

  // …and shown back as a remembered trace the next time you greet them.
  const header = await openMenu(page, 'Glade');
  expect(header).toContain('Last time you were honest with them.');
});
