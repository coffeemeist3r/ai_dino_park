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

test('a fresh park owes nothing — but it is no longer inert beneath the system', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // The *bill* is still nothing: no ground has two standing landmarks, and 480s rule that a derelict
  // landmark owes no upkeep is unchanged.
  expect(await runUpkeep(page)).toEqual([]);

  // What changed is the founding state, not the arithmetic (CHARTER v7 / BACKLOG-488): the park now ships
  // a ruin in the Grove, so a week away has something to settle rather than nothing to notice. The old
  // assertion here was `[]`, and it was the clearest statement in the suite of the dormancy v7 forbids.
  expect((await runUpkeep(page, 7)).join(' ')).toContain('patched up');

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

  // Restock and it comes back — but a *live* day no longer patches by hand (BACKLOG-488): the cure is an
  // errand a resident walks, and `cycle-136-mending.spec.ts` is where a body does it. What is asserted here
  // is that the away form still converges, through the same pure function it always did.
  await setPile(page, zone, { stone: 8 });
  expect(await runUpkeep(page)).toEqual([]); // the live pass bills only
  expect(await standing(page, zone)).toBe(1);
  const patched = await runUpkeep(page, 2);
  expect(patched.join(' ')).toContain('patched up');
  expect(await standing(page, zone)).toBe(3); // two days away, one ruin raised each
});

test('an absence is charged the days it owed, through the same pass', async ({ page }) => {
  await boot(page);
  const zone = await buildUp(page);
  await setPile(page, zone, {});

  // Seven days away with an empty pile bleeds to the same affordable skyline a week of live days would.
  // The pass sweeps every ground, and the founding Grove ruin (CHARTER v7) settles in the same sweep, so
  // this filters to the ground under test rather than counting the whole park's lines.
  const lines = (await runUpkeep(page, 7)).filter((l) => l.includes('disrepair'));
  expect(lines.length).toBe(3);
  expect(await standing(page, zone)).toBe(1);
});
