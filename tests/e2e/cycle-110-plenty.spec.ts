import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Word of plenty (BACKLOG-458) — plenty travels by talk before a body follows. A resident of a thriving zone
 * gets first-hand word of it; it lets that slip on the gossip spine; the listener is then primed to migrate
 * toward the ground it only heard was good — and hearsay chooses the destination over the richest-neighbour pick.
 */

type W = Record<string, any>;

const step = (p: import('@playwright/test').Page) => p.evaluate(() => (window as W).__stepWorld());
const migrating = (p: import('@playwright/test').Page) => p.evaluate(() => (window as W).__migrating() as string[]);
const migrate = (p: import('@playwright/test').Page, name: string, zone: string) =>
  p.evaluate(({ name, zone }) => (window as W).__migrate(name, zone), { name, zone });
const setPile = (p: import('@playwright/test').Page, zone: string, pile: Record<string, number>) =>
  p.evaluate(({ zone, pile }) => (window as W).__setZonePile(zone, pile), { zone, pile });
const seedPlenty = (p: import('@playwright/test').Page) => p.evaluate(() => (window as W).__seedPlentyWord());
const spreadPlenty = (p: import('@playwright/test').Page, a: string, b: string) =>
  p.evaluate(({ a, b }) => (window as W).__spreadPlentyWord(a, b) as string | null, { a, b });
const plentyTarget = (p: import('@playwright/test').Page, name: string) =>
  p.evaluate((n) => (window as W).__plentyTarget(n) as string | null, name);
const memoryOf = (p: import('@playwright/test').Page, name: string) =>
  p.evaluate((n) => ((window as W).__memory() as Record<string, string[]>)[n] ?? [], name);
const events = (p: import('@playwright/test').Page) => p.evaluate(() => (window as W).__events() as string[]);
const maybeMigrate = (p: import('@playwright/test').Page) => p.evaluate(() => (window as W).__maybeMigrate() as string | null);

async function crossUntilArrived(page: import('@playwright/test').Page, name: string) {
  for (let i = 0; i < 40; i++) {
    await step(page);
    if (!(await migrating(page)).includes(name)) return true;
  }
  return false;
}

test('a thriving zone seeds its residents with plenty word, which spreads and primes a target', async ({ page }) => {
  await boot(page);
  // Sunny alone in the Fernreach, which we make thriving (a fat resource pile). Rex stays in the bowl.
  await migrate(page, 'Sunny', 'fernreach');
  await setPile(page, 'fernreach', { stone: 12 });
  await seedPlenty(page);

  // The Fernreach resident (Sunny) now carries first-hand word of plenty; the bowl dino (Rex) does not.
  expect((await memoryOf(page, 'Sunny')).some((m) => m.includes('The Fernreach is thriving'))).toBe(true);
  expect((await memoryOf(page, 'Rex')).some((m) => m.includes('is thriving'))).toBe(false);

  // Rex moves to the grove (the Fernreach's neighbour). Sunny lets the word slip to Rex → Rex is primed toward the Fernreach.
  await migrate(page, 'Rex', 'grove');
  expect(await spreadPlenty(page, 'Sunny', 'Rex')).toContain('The Fernreach is thriving');
  expect(await plentyTarget(page, 'Rex')).toBe('fernreach');
});

test('hearsay of plenty chooses the migration destination over the richer neighbour', async ({ page }) => {
  await boot(page);
  // Rex in the grove; its two neighbours are the bowl (west) and the Fernreach (east). Make the BOWL the
  // richest neighbour, but prime Rex toward the Fernreach by word of plenty — hearsay must win the destination.
  await migrate(page, 'Rex', 'grove');
  await migrate(page, 'Sunny', 'fernreach');
  await setPile(page, 'fernreach', { stone: 12 }); // thriving, so Sunny gets seeded
  await setPile(page, 'bowl', { stone: 20 }); // strictly richer than the Fernreach
  await seedPlenty(page);
  await spreadPlenty(page, 'Sunny', 'Rex');
  expect(await plentyTarget(page, 'Rex')).toBe('fernreach');

  // The ambient pick is Rex (the only plenty-primed dino), and it heads for the Fernreach it heard about —
  // not the richer bowl.
  expect(await maybeMigrate(page)).toBe('Rex');
  expect(await crossUntilArrived(page, 'Rex')).toBe(true);
  const log = await events(page);
  expect(log.some((e) => e.includes('Rex') && e.includes('The Fernreach is thriving'))).toBe(true);
  expect(log.some((e) => e.includes('Rex') && e.includes('crossed into The Fernreach'))).toBe(true);
});
