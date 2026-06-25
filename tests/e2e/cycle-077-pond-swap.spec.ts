import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Pond-swappers (BACKLOG-346). Once two dinos have both set foot in the grove (339), meeting back in the
 * bowl they trade pond notes — a small shared-place bond + a memory each. A dino that never crossed gets
 * nothing.
 */

type W = Record<string, any>;

const migrating = (p: Page) => p.evaluate(() => (window as W).__migrating() as string[]);
const memOf = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__memory() as Record<string, string[]>)[n] ?? [], name);
const bond = (p: Page, a: string, b: string) => p.evaluate(([x, y]) => (window as W).__bond(x, y) as number, [a, b]);
const step = (p: Page) => p.evaluate(() => (window as W).__stepWorld());

async function crossOnce(p: Page, name: string) {
  await p.evaluate((n) => (window as W).__startMigration(n), name);
  for (let i = 0; i < 40; i++) {
    await step(p);
    if (!(await migrating(p)).includes(name)) return;
  }
  throw new Error(`${name} never finished crossing`);
}

test('two grove-visited dinos swap pond notes; an un-traveled dino does not', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // Rex and Mossback both cross into the grove — both are now grove-visited.
  await crossOnce(page, 'Rex');
  await crossOnce(page, 'Mossback');

  const before = await bond(page, 'Rex', 'Mossback');
  const swapped = await page.evaluate(() => (window as W).__pondSwap('Rex', 'Mossback') as boolean);
  expect(swapped).toBe(true);
  expect((await memOf(page, 'Rex')).some((m) => m.includes('traded pond stories with Mossback'))).toBe(true);
  expect((await memOf(page, 'Mossback')).some((m) => m.includes('traded pond stories with Rex'))).toBe(true);
  expect(await bond(page, 'Rex', 'Mossback')).toBeGreaterThan(before);

  // Sunny never crossed — no swap, no memory, no bond change.
  const sunnyBefore = await bond(page, 'Rex', 'Sunny');
  const noSwap = await page.evaluate(() => (window as W).__pondSwap('Rex', 'Sunny') as boolean);
  expect(noSwap).toBe(false);
  expect((await memOf(page, 'Sunny')).some((m) => m.includes('traded pond stories'))).toBe(false);
  expect(await bond(page, 'Rex', 'Sunny')).toBe(sunnyBefore);

  expect(errors).toEqual([]);
});
