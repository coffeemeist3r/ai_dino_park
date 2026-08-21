import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Hands on the derelict (BACKLOG-488) + the founding ruin (CHARTER v7).
 *
 * 480 made a landmark cost something to keep and gave disrepair a reversible cure — and the cure was
 * arithmetic, performed on a ground with nobody near it, on a day boundary that used to cost 24 real hours.
 * Now a resident walks over and the patch-up resolves where that resident is standing, and a brand-new save
 * ships a ruin in the Grove so a player can watch it happen in their first minute.
 *
 * The subject of this spec **is** the founding state, so it asserts the new distribution and does not call
 * `gatherToBowl`.
 */

type W = Record<string, any>;

const landmarks = (p: Page, z: string) =>
  p.evaluate((zz) => (window as W).__landmarks(zz) as { derelict: boolean; tileX: number; tileY: number }[], z);
const standing = (p: Page, z: string) => p.evaluate((zz) => (window as W).__standing(zz) as number, z);
const runUpkeep = (p: Page, days = 1) => p.evaluate((d) => (window as W).__runUpkeep(d) as string[], days);
const mend = (p: Page) => p.evaluate(() => (window as W).__mend() as { fixer: string } | null);
const stepMend = (p: Page) => p.evaluate(() => (window as W).__stepMend());
const setZone = (p: Page, z: string) => p.evaluate((zz) => (window as W).__setZone(zz), z);
const setPile = (p: Page, z: string, pile: Record<string, number>) =>
  p.evaluate(([zz, pp]) => (window as W).__setZonePile(zz, pp), [z, pile] as [string, Record<string, number>]);
/** The active zone's pile (BACKLOG-328) — `__setZone` first, then read. */
const stockpile = (p: Page) => p.evaluate(() => (window as W).__stockpile() as Record<string, number>);
const total = (pile: Record<string, number>) => Object.values(pile).reduce((a, b) => a + b, 0);
const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);
const memory = (p: Page, n: string) =>
  p.evaluate((nn) => ((window as W).__memory() as Record<string, string[]>)[nn] ?? [], n);

/** Drive the errand to its end (or to its budget), one deterministic resolve step at a time. */
async function walkTheMend(page: Page, limit = 60): Promise<void> {
  for (let i = 0; i < limit; i++) {
    await stepMend(page);
    if ((await landmarks(page, 'grove')).every((l) => !l.derelict)) return;
  }
}

test('a fresh park ships a ruin, and it costs the ground nothing', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // CHARTER v7: the founding park exercises its own systems instead of sitting inert beneath them.
  const grove = await landmarks(page, 'grove');
  expect(grove.length).toBe(1);
  expect(grove[0].derelict).toBe(true);
  expect(await standing(page, 'grove')).toBe(0);

  // 480s rule is unchanged: a derelict landmark owes no upkeep, so the founding park still owes nothing.
  expect(await runUpkeep(page, 1)).toEqual([]);

  expect(errors).toEqual([]);
});

test('somebody walks over and puts it back up', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  await setZone(page, 'grove'); // the beat happens where the player is watching
  const before = total(await stockpile(page));
  await stepMend(page);
  const errand = await mend(page);
  expect(errand).not.toBeNull();
  expect(errand!.fixer).toBeTruthy();
  const fixer = errand!.fixer;

  await walkTheMend(page);

  // It stands back up, where it fell, because a dino was standing there.
  expect((await landmarks(page, 'grove')).every((l) => !l.derelict)).toBe(true);
  expect(await standing(page, 'grove')).toBe(1);
  expect(await mend(page)).toBeNull(); // the errand resolved

  const log = (await events(page)).join(' ');
  expect(log).toContain('patched up'); // 480s own line: the ground patched something up
  expect(log).toContain(fixer); // ...and this is who did it

  const mem = (await memory(page, fixer)).join(' ');
  expect(mem).toContain('back up with your own hands');

  // The ground paid for its own repair, out of its own pile, on arrival.
  expect(total(await stockpile(page))).toBe(before - 1);

  expect(errors).toEqual([]);
});

test('a ground that cannot pay sends nobody', async ({ page }) => {
  await boot(page);
  await setPile(page, 'grove', {});
  await setZone(page, 'grove');

  await stepMend(page);
  expect(await mend(page)).toBeNull();
  expect((await landmarks(page, 'grove'))[0].derelict).toBe(true);
});

test('the live day tick no longer patches by hand — only the errand does', async ({ page }) => {
  await boot(page);
  await setPile(page, 'grove', { stone: 8 });

  // A stocked ground with a ruin, and a live upkeep pass: 480 would have patched it here. It does not.
  expect(await runUpkeep(page, 1)).toEqual([]);
  expect((await landmarks(page, 'grove'))[0].derelict).toBe(true);
});

test('the errand does not fire in a ground the player has left', async ({ page }) => {
  await boot(page);
  // The player is in the bowl; the ruin is in the grove.
  await stepMend(page);
  expect(await mend(page)).toBeNull();
  expect((await landmarks(page, 'grove'))[0].derelict).toBe(true);
});

test('an absence still settles arithmetically — nobody is there to walk', async ({ page }) => {
  await boot(page);
  // The away catch-up keeps 480s full arithmetic: an unattended park has no hands to send.
  const lines = await runUpkeep(page, 7);
  expect(lines.join(' ')).toContain('patched up');
  expect((await landmarks(page, 'grove')).every((l) => !l.derelict)).toBe(true);
});

test('a restored save seeds nothing — the founding ruin is written once, ever', async ({ page }) => {
  await boot(page);
  await setZone(page, 'grove');
  await walkTheMend(page);
  expect((await landmarks(page, 'grove')).every((l) => !l.derelict)).toBe(true);

  await page.evaluate(() => (window as W).__saveNow());
  await page.reload();
  await page.locator('canvas').waitFor({ state: 'visible' });
  await page.waitForFunction(() => (window as W).__ready === true);

  // One landmark, mended — not a second founding cairn stacked on the restore.
  const after = await landmarks(page, 'grove');
  expect(after.length).toBe(1);
  expect(after[0].derelict).toBe(false);
});
