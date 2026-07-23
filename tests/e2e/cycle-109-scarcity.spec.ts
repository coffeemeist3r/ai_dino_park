import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Scarcity moves the herd (BACKLOG-450) + Left for greener ground (BACKLOG-457). Migration now reads the
 * economy: a mouth heads for the richest neighbour (prosperity + banked food), the poorest zone empties
 * first, and a dino that crossed toward plenty files the reason it left.
 */

type W = Record<string, any>;

const step = (p: import('@playwright/test').Page) => p.evaluate(() => (window as W).__stepWorld());
const migrating = (p: import('@playwright/test').Page) => p.evaluate(() => (window as W).__migrating() as string[]);
const scarcityDest = (p: import('@playwright/test').Page, name: string) =>
  p.evaluate((n) => (window as W).__scarcityDest(n) as string | null, name);
const zoneAppeal = (p: import('@playwright/test').Page, zone: string) =>
  p.evaluate((z) => (window as W).__zoneAppeal(z) as number, zone);
const events = (p: import('@playwright/test').Page) => p.evaluate(() => (window as W).__events() as string[]);
const memoryOf = (p: import('@playwright/test').Page, name: string) =>
  p.evaluate((n) => ((window as W).__memory() as Record<string, string[]>)[n] ?? [], name);
const names = (p: import('@playwright/test').Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const migrate = (p: import('@playwright/test').Page, name: string, zone: string) =>
  p.evaluate(({ name, zone }) => (window as W).__migrate(name, zone), { name, zone });

async function crossUntilArrived(page: import('@playwright/test').Page, name: string) {
  for (let i = 0; i < 40; i++) {
    await step(page);
    if (!(await migrating(page)).includes(name)) return true;
  }
  return false;
}

test('a migrant heads for the richest neighbour — destination tracks appeal, not adjacency order', async ({ page }) => {
  await boot(page);
  const roster = await names(page);

  // Rex alone in the grove; everyone else in the Fernreach → the grove's east neighbour (Fernreach) far
  // outweighs its west/primary neighbour (the empty bowl). The scarcity dest must be the Fernreach, NOT the
  // bowl (the first link in ZONE_LINKS order) — proving the pick reads appeal, not adjacency.
  for (const n of roster) if (n !== 'Rex') await migrate(page, n, 'fernreach');
  await migrate(page, 'Rex', 'grove');
  expect(await scarcityDest(page, 'Rex')).toBe('fernreach');

  // Flip it: pull everyone into the bowl instead → the bowl is now the richest grove neighbour.
  for (const n of roster) if (n !== 'Rex') await migrate(page, n, 'bowl');
  expect(await scarcityDest(page, 'Rex')).toBe('bowl');
});

test('a zone appeal rises with its banked food', async ({ page }) => {
  await boot(page);
  const before = await zoneAppeal(page, 'grove');
  await page.evaluate(() => (window as W).__setZoneFoodPile('grove', { berries: 6 }));
  const after = await zoneAppeal(page, 'grove');
  expect(after).toBeGreaterThan(before);
});

test('the poorest zone empties first — the ambient pick is a resident of the least-appealing zone', async ({ page }) => {
  await boot(page);
  // Rex alone in the grove (1 head), everyone else in the richer bowl → the grove is strictly the poorest
  // occupied zone, so with no grove-news or homesickness pulling anyone, the ambient migrant pick is Rex.
  await migrate(page, 'Rex', 'grove');
  expect(await page.evaluate(() => (window as W).__maybeMigrate())).toBe('Rex');
});

test('a dino that crossed toward plenty files the greener-ground reason it left; a plain crossing does not', async ({ page }) => {
  await boot(page);

  // Rex alone in the grove, everyone else in the richer bowl. The ambient roll sends Rex back to the bowl as
  // a scarcity move (dest richer than home), so the greener-ground beat fires on arrival.
  await migrate(page, 'Rex', 'grove');
  expect(await page.evaluate(() => (window as W).__maybeMigrate())).toBe('Rex');
  expect(await crossUntilArrived(page, 'Rex')).toBe(true);

  expect((await memoryOf(page, 'Rex')).some((m) => m.includes("Grove's pantry ran dry"))).toBe(true);
  expect((await events(page)).some((e) => e.includes('Rex left') && e.includes('greener ground'))).toBe(true);

  // Control: a plain crossing (no scarcity tag) files no greener-ground memory.
  await boot(page);
  await page.evaluate(() => (window as W).__startMigration('Twitch'));
  expect(await crossUntilArrived(page, 'Twitch')).toBe(true);
  expect((await memoryOf(page, 'Twitch')).some((m) => m.includes('pantry ran dry'))).toBe(false);
});
