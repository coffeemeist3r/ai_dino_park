import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * A landmark that has to be kept up (BACKLOG-480). Since the gathering spine shipped, a raised structure
 * has been permanent and free — the one number in this park that could never fall. Now a ground pays for
 * its skyline out of its own pile, and a ground that can't pay lets one fall into reversible disrepair.
 *
 * Every pass here goes through `__runUpkeep`, which calls the same `runUpkeepPass` the in-game day hook
 * calls; nothing in this spec re-implements the decision.
 */

type W = Record<string, any>;

const homeZone = (p: Page, n: string) => p.evaluate((nn) => (window as W).__homeZone(nn) as string, n);
const standing = (p: Page, z: string) => p.evaluate((zz) => (window as W).__standing(zz) as number, z);
const landmarks = (p: Page, z: string) =>
  p.evaluate((zz) => (window as W).__landmarks(zz) as { derelict: boolean }[], z);
const runUpkeep = (p: Page, days = 1) => p.evaluate((d) => (window as W).__runUpkeep(d) as string[], days);
const setPile = (p: Page, z: string, pile: Record<string, number>) =>
  p.evaluate(([zz, pp]) => (window as W).__setZonePile(zz, pp), [z, pile] as [string, Record<string, number>]);

/** A ground with four landmarks (three cairns + a raised granary) and whatever pile the test wants. */
async function buildUp(page: Page): Promise<string> {
  const [dino] = await page.evaluate(() =>
    ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name),
  );
  const zone = await homeZone(page, dino);
  await page.evaluate((z) => (window as W).__seedGranaryReady(z), zone);
  await page.evaluate((n) => (window as W).__runBuild(n), dino);
  expect(await page.evaluate((z) => (window as W).__granaryRaised(z) as boolean, zone)).toBe(true);
  expect(await standing(page, zone)).toBe(4);
  return zone;
}

test('a fresh park owes nothing — a day of upkeep costs it no landmark', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // The inertness bar: a new save has at most one landmark per ground and must not notice this feature.
  expect(await runUpkeep(page)).toEqual([]);
  expect(await runUpkeep(page, 7)).toEqual([]);

  expect(errors).toEqual([]);
});

test('a ground that cannot pay lets its skyline lapse — and patches it back up when it can', async ({
  page,
}) => {
  await boot(page);
  const zone = await buildUp(page);
  const capWithGranary = await page.evaluate((z) => (window as W).__foodCap(z) as number, zone);

  // Strip the pile: four standing landmarks owe two, and nothing can be paid.
  await setPile(page, zone, {});
  const lines = await runUpkeep(page);
  expect(lines.length).toBe(2);
  expect(lines[0]).toContain('fell into disrepair');
  expect(await standing(page, zone)).toBe(2);
  expect((await landmarks(page, zone)).filter((l) => l.derelict).length).toBe(2);

  // The granary is the newest thing raised, so it rots first — the ground loses its cap lift...
  expect(await page.evaluate((z) => (window as W).__hasGranary(z) as boolean, zone)).toBe(false);
  expect(await page.evaluate((z) => (window as W).__foodCap(z) as number, zone)).toBeLessThan(capWithGranary);
  // ...but the slot stays filled, so it cannot raise a second granary beside the ruin.
  expect(await page.evaluate((z) => (window as W).__granaryRaised(z) as boolean, zone)).toBe(true);

  // A lapsed ground owes less, so it converges instead of cascading: two standing owe one, still unpaid.
  await runUpkeep(page);
  expect(await standing(page, zone)).toBe(1);
  await runUpkeep(page);
  expect(await standing(page, zone)).toBe(1); // one landmark is free — the floor

  // Restock and it comes back, one landmark a day, without anyone raising anything new.
  await setPile(page, zone, { stone: 8 });
  const patched = await runUpkeep(page);
  expect(patched.join(' ')).toContain('patched up');
  expect(await standing(page, zone)).toBe(2);
});

test('an absence is charged the days it owed, through the same pass', async ({ page }) => {
  await boot(page);
  const zone = await buildUp(page);
  await setPile(page, zone, {});

  // Seven days away with an empty pile bleeds to the same affordable skyline a week of live days would.
  const lines = await runUpkeep(page, 7);
  expect(lines.length).toBe(3);
  expect(await standing(page, zone)).toBe(1);
});
