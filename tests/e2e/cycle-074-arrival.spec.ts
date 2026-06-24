import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * First steps in the grove (BACKLOG-339). The first time a dino ever crosses *into* the grove, arrival
 * is a beat: a 🌿 look-around bubble, a "first time across" memory, and a one-step pause (the arriving
 * Set), before it wanders on. Fires once per dino, ever; crossing back to the bowl never fires.
 */

type W = Record<string, any>;

const migrating = (p: import('@playwright/test').Page) => p.evaluate(() => (window as W).__migrating() as string[]);
const groveVisited = (p: import('@playwright/test').Page) => p.evaluate(() => (window as W).__groveVisited() as string[]);
const arriving = (p: import('@playwright/test').Page) => p.evaluate(() => (window as W).__arriving() as string[]);
const memOf = (p: import('@playwright/test').Page, name: string) =>
  p.evaluate((n) => ((window as W).__memory() as Record<string, string[]>)[n] ?? [], name);
const step = (p: import('@playwright/test').Page) => p.evaluate(() => (window as W).__stepWorld());

/** Drive a started migration to completion (the dino walks to its edge and crosses). */
async function crossOnce(p: import('@playwright/test').Page, name: string) {
  await p.evaluate((n) => (window as W).__startMigration(n), name);
  for (let i = 0; i < 40; i++) {
    await step(p);
    if (!(await migrating(p)).includes(name)) return;
  }
  throw new Error(`${name} never finished crossing`);
}

test('a dino crossing into the grove for the first time reacts — once, ever', async ({ page }) => {
  await boot(page);

  expect(await groveVisited(page)).not.toContain('Rex');

  // First crossing into the grove fires the arrival beat.
  await crossOnce(page, 'Rex');
  expect(await groveVisited(page)).toContain('Rex');
  expect((await memOf(page, 'Rex')).some((m) => m.includes('first time across'))).toBe(true);
  // Right after crossing it's pausing to look around (the arriving hold); one more step releases it.
  expect(await arriving(page)).toContain('Rex');
  await step(page);
  expect(await arriving(page)).not.toContain('Rex');

  // Cross back to the bowl — the grove-only beat does not fire (Rex stays visited exactly once).
  await crossOnce(page, 'Rex');
  expect((await groveVisited(page)).filter((n) => n === 'Rex').length).toBe(1);

  // Cross into the grove a SECOND time — already visited, so no new beat and no duplicate.
  await crossOnce(page, 'Rex');
  expect((await groveVisited(page)).filter((n) => n === 'Rex').length).toBe(1);
});
