import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Homecoming from the road (BACKLOG-452) — a dino that settled in a zone, walked out, and later crosses
 * back plays a return, not an arrival: it resettles on the spot (341's tenure would otherwise reset to 0),
 * wears a 🏡 + keeps the trace, and the nearest resident still living there welcomes it home.
 * Milestone 6 lore arc 2. Driven through the real `crossDino` path via __startMigrationTo + __stepWorld.
 */

type W = Record<string, any>;

const step = (p: Page) => p.evaluate(() => (window as W).__stepWorld());
const migrating = (p: Page) => p.evaluate(() => (window as W).__migrating() as string[]);
const settleTick = (p: Page) => p.evaluate(() => (window as W).__settleTick());
const settled = (p: Page, n: string) => p.evaluate((nn) => (window as W).__settled(nn) as boolean, n);
const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);
const memoryOf = (p: Page, n: string) =>
  p.evaluate((nn) => ((window as W).__memory() as Record<string, string[]>)[nn] ?? [], n);
const bonds = (p: Page) => p.evaluate(() => (window as W).__bonds() as Record<string, number>);

/** Walk a dino across to `dest` through the visible-crossing path; true once it has arrived. */
async function cross(page: Page, name: string, dest: string) {
  await page.evaluate(([n, d]) => (window as W).__startMigrationTo(n, d), [name, dest]);
  for (let i = 0; i < 40; i++) {
    await step(page);
    if (!(await migrating(page)).includes(name)) return true;
  }
  return false;
}

test('a dino that settled in the bowl comes home to it — resettled, and welcomed', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // Rex puts down roots in the bowl (SETTLE_ROLLS = 4 rolls of the migration cadence).
  for (let i = 0; i < 4; i++) await settleTick(page);
  expect(await settled(page, 'Rex')).toBe(true);
  expect((await page.evaluate(() => (window as W).__roots() as Record<string, string>)).Rex).toBe('bowl');

  const before = await bonds(page);

  // Out to the grove (a normal crossing: no homecoming, tenure resets)...
  expect(await cross(page, 'Rex', 'grove')).toBe(true);
  expect(await settled(page, 'Rex')).toBe(false);
  expect((await events(page)).some((e) => e.includes('came home'))).toBe(false);

  // ...and back again. This one is a homecoming.
  expect(await cross(page, 'Rex', 'bowl')).toBe(true);

  const log = await events(page);
  expect(log.some((e) => e.includes('🏡') && e.includes('Rex came home to Pocket Cretaceous'))).toBe(true);
  expect((await memoryOf(page, 'Rex')).some((m) => m.includes('back where you belong'))).toBe(true);

  // Resettled on arrival — it never stopped belonging here (a plain crossing would leave tenure at 0).
  expect(await settled(page, 'Rex')).toBe(true);

  // A resident still in the bowl looked up and welcomed it, and the pair warmed a notch.
  const welcome = log.find((e) => e.includes('welcomed Rex home'));
  expect(welcome).toBeTruthy();
  const greeter = welcome!.replace('👋 ', '').split(' welcomed')[0];
  expect((await memoryOf(page, greeter)).some((m) => m.includes('welcomed Rex back to Pocket Cretaceous'))).toBe(true);
  const key = [greeter, 'Rex'].sort().join('|');
  expect((await bonds(page))[key] ?? 0).toBeGreaterThan(before[key] ?? 0);

  expect(errors).toEqual([]);
});

test('a dino that never settled anywhere has no home to come back to', async ({ page }) => {
  await boot(page);

  // No settle rolls → no root recorded, so neither crossing is a return.
  expect(await page.evaluate(() => (window as W).__roots())).toEqual({});
  expect(await cross(page, 'Rex', 'grove')).toBe(true);
  expect(await cross(page, 'Rex', 'bowl')).toBe(true);

  const log = await events(page);
  expect(log.some((e) => e.includes('came home'))).toBe(false);
  expect(log.some((e) => e.includes('welcomed'))).toBe(false);
  expect(await settled(page, 'Rex')).toBe(false);
});
