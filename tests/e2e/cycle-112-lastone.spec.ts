import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Last one standing (BACKLOG-464) — a zone hollowed to its final resident lets that dino sound a wistful
 * "gone quiet" beat + keep a memory of the emptiness. Deduped so it reads once per hollowing. Driven
 * through the exposed decline/last-one dev hooks (reuses 460's peak read).
 */

type W = Record<string, any>;

const names = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const migrate = (p: Page, name: string, zone: string) =>
  p.evaluate(({ name, zone }) => (window as W).__migrate(name, zone), { name, zone });
const bumpPeaks = (p: Page) => p.evaluate(() => (window as W).__bumpPeaks());
const checkLastOne = (p: Page) => p.evaluate(() => (window as W).__checkLastOne() as string[]);
const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);
const memoryOf = (p: Page, n: string) =>
  p.evaluate((nn) => ((window as W).__memory() as Record<string, string[]>)[nn] ?? [], n);

test('the last dino in a hollowed zone sounds the wistful beat, once', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  const roster = await names(page);

  // Two dinos peak the grove; everyone else in the bowl.
  const pair = roster.slice(0, 2);
  for (const n of roster) await migrate(page, n, pair.includes(n) ? 'grove' : 'bowl');
  await bumpPeaks(page); // grove peak = 2

  // At two residents (its peak), no beat — the zone isn't hollowing.
  expect(await checkLastOne(page)).toEqual([]);

  // Drain one → the grove is down to its last resident and declining.
  await migrate(page, pair[0], 'bowl');
  const lone = pair[1];
  expect(await checkLastOne(page)).toEqual([lone]);

  // It keeps the memory and the ticker names it as the last one left.
  const mem = await memoryOf(page, lone);
  expect(mem.some((m) => m.includes('last one left'))).toBe(true);
  expect((await events(page)).some((e) => e.includes('🍂') && e.includes('is the last one left'))).toBe(true);

  // Dedup: a second scan on the still-hollow zone re-fires nothing and doesn't double the memory.
  expect(await checkLastOne(page)).toEqual([]);
  const memAfter = await memoryOf(page, lone);
  expect(memAfter.filter((m) => m.includes('last one left')).length).toBe(1);
  expect(errors).toEqual([]);
});
