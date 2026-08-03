import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Come for the plenty (BACKLOG-459) — a scarcity migrant arriving in a richer zone is met by the nearest
 * resident with a wry welcome + a small bond. The far side of 450/457's move, mirroring 452's homecoming
 * welcome but sardonic. Driven through the real `crossDino` path via __maybeMigrate + __stepWorld.
 */

type W = Record<string, any>;

const step = (p: Page) => p.evaluate(() => (window as W).__stepWorld());
const migrating = (p: Page) => p.evaluate(() => (window as W).__migrating() as string[]);
const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);
const bonds = (p: Page) => p.evaluate(() => (window as W).__bonds() as Record<string, number>);
const memoryOf = (p: Page, n: string) =>
  p.evaluate((nn) => ((window as W).__memory() as Record<string, string[]>)[nn] ?? [], n);
const names = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const migrate = (p: Page, name: string, zone: string) =>
  p.evaluate(({ name, zone }) => (window as W).__migrate(name, zone), { name, zone });

/**
 * BACKLOG-474 note: the frontier tier now outranks the appeal pick, and on a fresh save the grove, the
 * Fernreach and the Hollow have all never been settled. These specs are about the *appeal* pick, so walk
 * one dino through the far grounds first to close the frontier — it founds them without changing anyone's
 * final position or any zone's appeal.
 */
async function closeFrontier(page: Page, name: string, home: string) {
  await migrate(page, name, 'fernreach');
  await migrate(page, name, 'hollow');
  await migrate(page, name, home);
}

async function crossUntilArrived(page: Page, name: string) {
  for (let i = 0; i < 40; i++) {
    await step(page);
    if (!(await migrating(page)).includes(name)) return true;
  }
  return false;
}

test('a scarcity migrant into a populated richer zone gets a wry welcome + a small bond', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  const roster = await names(page);

  // Rex alone in the poor grove, everyone else in the richer bowl → the ambient roll sends Rex to the bowl
  // as a scarcity move, and a resident is there to size him up.
  for (const n of roster) if (n !== 'Rex') await migrate(page, n, 'bowl');
  await closeFrontier(page, 'Rex', 'grove');

  const before = await bonds(page);
  expect(await page.evaluate(() => (window as W).__maybeMigrate())).toBe('Rex');
  expect(await crossUntilArrived(page, 'Rex')).toBe(true);

  const log = await events(page);
  const welcome = log.find((e) => e.includes('sized up Rex') && e.includes('come for the plenty'));
  expect(welcome).toBeTruthy();

  // the greeter and migrant both keep the trace, and the pair warmed a notch
  const greeter = welcome!.replace('👋 ', '').split(' sized up')[0];
  expect((await memoryOf(page, greeter)).some((m) => m.includes('gave Rex a wry welcome'))).toBe(true);
  expect((await memoryOf(page, 'Rex')).some((m) => m.includes('sized you up when you came for the food'))).toBe(true);
  const key = [greeter, 'Rex'].sort().join('|');
  expect((await bonds(page))[key] ?? 0).toBeGreaterThan(before[key] ?? 0);

  // it's the wry welcome, not the 452 homecoming welcome
  expect(log.some((e) => e.includes('Rex came home'))).toBe(false);
  expect(errors).toEqual([]);
});

test('a homecoming crossing fires welcome-home, NOT the wry welcome', async ({ page }) => {
  await boot(page);
  const roster = await names(page);

  // Rex's root is the bowl; everyone else crowds the bowl so it's the richest neighbour. Rex sits alone in
  // the poor grove. The scarcity roll sends him back to the bowl — his root — so this is a homecoming.
  await page.evaluate(() => (window as W).__setRoot('Rex', 'bowl'));
  for (const n of roster) if (n !== 'Rex') await migrate(page, n, 'bowl');
  await closeFrontier(page, 'Rex', 'grove');

  expect(await page.evaluate(() => (window as W).__maybeMigrate())).toBe('Rex');
  expect(await crossUntilArrived(page, 'Rex')).toBe(true);

  const log = await events(page);
  expect(log.some((e) => e.includes('Rex came home'))).toBe(true);
  expect(log.some((e) => e.includes('sized up Rex'))).toBe(false); // homecoming wins
});

test('a plain (non-scarcity) crossing earns no wry welcome', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__startMigration('Twitch')); // no scarcity reason set
  expect(await crossUntilArrived(page, 'Twitch')).toBe(true);
  expect((await events(page)).some((e) => e.includes('sized up Twitch'))).toBe(false);
});

test('a scarcity crossing into an empty richer zone does not welcome or throw; greener-ground still fires', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  const roster = await names(page);

  // Everyone in the grove; the bowl is empty but stocked so its appeal outweighs the crowded grove — a
  // migrant heads for plenty it will arrive at alone.
  for (const n of roster) await migrate(page, n, 'grove');
  await closeFrontier(page, roster[0], 'grove');
  await page.evaluate(() => (window as W).__setZoneFoodPile('bowl', { berries: 6, greens: 6, roots: 6, fish: 6, meat: 6 }));

  const picked = await page.evaluate(() => (window as W).__maybeMigrate() as string | null);
  expect(picked).toBeTruthy();
  expect(await crossUntilArrived(page, picked!)).toBe(true);

  const log = await events(page);
  expect(log.some((e) => e.includes('sized up'))).toBe(false); // nobody home to welcome
  expect(log.some((e) => e.includes('greener ground'))).toBe(true); // the 🍃 beat still fired
  expect(errors).toEqual([]);
});
