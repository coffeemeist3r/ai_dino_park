import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The bill reaches the call (BACKLOG-485) — a ground carrying a derelict landmark leans its own work call
 * (473/481) toward gathering until the disrepair is cured, the first feedback loop in this park from a
 * *building* back into a *decision*.
 *
 * The disrepair is produced the way cycle-128's spec produces it — four landmarks and an empty pile, run
 * through `__runUpkeep`, which is the same `runUpkeepPass` the in-game day hook calls. The call is read
 * through `__workPriority`, the production read every work hook goes through.
 */

type W = Record<string, any>;

const homeZone = (p: Page, n: string) => p.evaluate((nn) => (window as W).__homeZone(nn) as string, n);
const workPriority = (p: Page, z: string) =>
  p.evaluate((zz) => (window as W).__workPriority(zz) as string | null, z);
const standing = (p: Page, z: string) => p.evaluate((zz) => (window as W).__standing(zz) as number, z);
const runUpkeep = (p: Page, days = 1) => p.evaluate((d) => (window as W).__runUpkeep(d) as string[], days);
const setPile = (p: Page, z: string, pile: Record<string, number>) =>
  p.evaluate(([zz, pp]) => (window as W).__setZonePile(zz, pp), [z, pile] as [string, Record<string, number>]);
const ticker = (p: Page) => p.evaluate(() => ((window as W).__ticker() as string[]).join(' | '));
const step = (p: Page) => p.evaluate(() => (window as W).__stepWorld());

/** A ground with four landmarks (three cairns + a raised granary) — cycle-128's helper. */
async function buildUp(page: Page): Promise<string> {
  const [dino] = await page.evaluate(() =>
    ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name),
  );
  const zone = await homeZone(page, dino);
  await page.evaluate((z) => (window as W).__seedGranaryReady(z), zone);
  await page.evaluate((n) => (window as W).__runBuild(n), dino);
  expect(await standing(page, zone)).toBe(4);
  return zone;
}

test('a park with nothing derelict is untouched — the ground still makes its own call', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const zone = await buildUp(page);
  await setPile(page, zone, { branch: 9, stone: 9 }); // it can pay; nothing lapses
  expect(await runUpkeep(page)).toEqual([]);
  const own = await workPriority(page, zone);

  await step(page);
  expect(await workPriority(page, zone)).toBe(own);
  expect(await ticker(page)).not.toContain('walls are coming down');

  expect(errors).toEqual([]);
});

test('a ground whose walls come down turns to gathering — and says so as upkeep, not as a vote', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const zone = await buildUp(page);
  await step(page); // seed the ground's own call before anything lapses
  await setPile(page, zone, {});
  const lines = await runUpkeep(page);
  expect(lines.some((l) => l.includes('fell into disrepair'))).toBe(true);
  expect(await standing(page, zone)).toBeLessThan(4);

  expect(await workPriority(page, zone)).toBe('gather');

  await step(page);
  const log = await ticker(page);
  expect(log).toContain('turns to gathering');
  expect(log).toContain('walls are coming down');

  expect(errors).toEqual([]);
});

test('the lean is not a decision — a ground that patches its skyline up goes back to its own call', async ({
  page,
}) => {
  await boot(page);

  const zone = await buildUp(page);
  await step(page);
  const own = await workPriority(page, zone); // what this ground actually decided, with nothing derelict

  await setPile(page, zone, {});
  await runUpkeep(page);
  expect(await workPriority(page, zone)).toBe('gather');

  // Stock it back up and let the upkeep pass patch the derelicts back in (480's reversible cure).
  await setPile(page, zone, { branch: 20, stone: 20 });
  for (let i = 0; i < 6; i++) await runUpkeep(page);
  expect(await standing(page, zone)).toBe(4);

  expect(await workPriority(page, zone)).toBe(own);
});
