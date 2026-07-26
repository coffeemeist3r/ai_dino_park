import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The draining zone (BACKLOG-460) — a zone whose population falls below its own high-water peak reads
 * declining (⬇ on the map lens). Driven through the exposed peak/decline dev hooks.
 */

type W = Record<string, any>;

const names = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const migrate = (p: Page, name: string, zone: string) =>
  p.evaluate(({ name, zone }) => (window as W).__migrate(name, zone), { name, zone });
const bumpPeaks = (p: Page) => p.evaluate(() => (window as W).__bumpPeaks() as Record<string, number>);
const declining = (p: Page) => p.evaluate(() => (window as W).__zoneDeclining() as Record<string, boolean>);
const zoneMap = (p: Page) => p.evaluate(() => (window as W).__zoneMap() as any[]);

test('a zone drained below its peak reads declining; a zone at peak does not', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  const roster = await names(page);

  // Seed a peak: three dinos in the grove, everyone else in the bowl.
  const grovers = roster.slice(0, 3);
  for (const n of roster) await migrate(page, n, grovers.includes(n) ? 'grove' : 'bowl');
  await bumpPeaks(page); // grove peak = 3

  // At peak, the grove is not declining.
  expect((await declining(page)).grove).toBe(false);

  // Drain two grovers back to the bowl → grove down to 1, below its peak of 3.
  await migrate(page, grovers[0], 'bowl');
  await migrate(page, grovers[1], 'bowl');

  const decl = await declining(page);
  expect(decl.grove).toBe(true); // hollowed below peak
  expect(decl.bowl).toBe(false); // the bowl only grew — not declining

  // The map lens renders the ⬇ marker on the grove box and not the bowl.
  const map = await zoneMap(page);
  expect(map.find((e) => e.id === 'grove')?.declining).toBe(true);
  expect(map.find((e) => e.id === 'bowl')?.declining).toBe(false);
  expect(errors).toEqual([]);
});
