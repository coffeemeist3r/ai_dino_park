import { test, expect } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * Milestone 26 (tentpole), cycle 179. BACKLOG-585: the day in its own voice. BACKLOG-586: places in the plan.
 * Both on the as-shipped founding state.
 */

type W = Record<string, any>;

test('the founding yesterday has a voice, and the book quotes it', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const said = await page.evaluate(() => (window as W).__reflections().Sunny.said as string);
  expect(said.length).toBeGreaterThan(0);
  const book = await page.evaluate(() => (window as W).__bookText() as string);
  expect(book).toContain(`yesterday: spent it with Rex — "${said}"`);
});

test('at dusk every dino says how its day went', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await page.evaluate(() => (window as W).__setClock(1, 16, 58));
  await page.evaluate(() => (window as W).__advanceMinutes(3));
  const r = (await page.evaluate(() => (window as W).__reflections())) as Record<string, { said?: string }>;
  for (const v of Object.values(r)) expect(v.said?.length ?? 0).toBeGreaterThan(0);
  const bubbles = (await page.evaluate(() => (window as W).__bubbleTexts())) as string[];
  const spoken = Object.values(r).map((v) => v.said);
  expect(bubbles.some((b) => spoken.includes(b))).toBe(true);
});

test('a fresh park: a forage or restless dino sets off for another ground on purpose', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const out = await page.evaluate(() => {
    const w = window as W;
    const name = w.__errand() as string | null;
    return { name, dest: name ? w.__place(name) : null, migrating: w.__migrating(), ticker: (w.__ticker() as string[]).join(' | '), book: w.__bookText() as string };
  });
  expect(out.name).not.toBeNull();
  expect(out.migrating).toContain(out.name);
  expect(out.dest).not.toBeNull();
  expect(out.ticker).toContain(`🧭 ${out.name} sets off for`);
  expect(out.book).toContain('heading: ');
});

test('one errand per dino per phase, and a ground keeps its last resident', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const out = await page.evaluate(() => {
    const w = window as W;
    const went: string[] = [];
    for (let i = 0; i < 20; i++) {
      const n = w.__errand();
      if (n) went.push(n);
    }
    return { went };
  });
  expect(new Set(out.went).size).toBe(out.went.length);
  expect(out.went).not.toContain('Ember'); // the Ridge's only resident
  expect(out.went.length).toBeGreaterThanOrEqual(2);
});
