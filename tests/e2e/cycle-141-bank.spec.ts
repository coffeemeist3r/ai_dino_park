import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * The pile gets a place (BACKLOG-504). A ground's banked gathering has paid the upkeep bill, funded a mend,
 * staked a ballot and filled the granary since cycle 285, and the only way to see any of it was to open the
 * zone-map lens and read a line of text. Now there is a heap on the ground, and it steps.
 *
 * CHARTER v7: this spec is about what a brand-new player can see, so it asserts the founding state and
 * watches the founding mend knock a step off it.
 */

type W = Record<string, any>;

const bank = (p: Page, z?: string) =>
  p.evaluate((zz) => (window as W).__bank(zz) as { step: number; total: number; visible: boolean; tile: { tileX: number; tileY: number } }, z);
const setZone = (p: Page, z: string) => p.evaluate((zz) => (window as W).__setZone(zz), z);
const setPile = (p: Page, z: string, pile: Record<string, number>) =>
  p.evaluate(([zz, pp]) => (window as W).__setZonePile(zz, pp), [z, pile] as [string, Record<string, number>]);
const landmarks = (p: Page, z: string) =>
  p.evaluate((zz) => (window as W).__landmarks(zz) as { derelict: boolean }[], z);
const runUpkeep = (p: Page, days = 1) => p.evaluate((d) => (window as W).__runUpkeep(d) as string[], days);
const stepMend = (p: Page) => p.evaluate(() => (window as W).__stepMend());

/**
 * **Amended cycle 151 (BACKLOG-495).** This asserted a bare bowl, and the reason it gave was that the
 * first gathered stone should be the event. That was true and it cost two of the three heap rigs: with one
 * stocked ground a fresh park exercised step 2 and nothing else, and `pile_3` had never existed on a first
 * frame in the park's history. The founding piles now reach each drawn step once, so the claim this spec
 * makes gets bigger rather than smaller — a fresh park ships a heap on three grounds, all three sizes.
 */
test('a fresh park ships a heap on three grounds, one at each size the studio drew', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const grove = await bank(page, 'grove');
  expect(grove.total).toBe(2);
  expect(grove.step).toBe(2); // a heap standing on the Grove one edge east of the spawn

  expect((await bank(page, 'bowl')).step).toBe(1); // the smallest, where you wake up
  expect((await bank(page, 'ridge')).step).toBe(3); // the largest, at the far end of the chain

  // ...and the frontier stays bare, because the unsettled badge has to mean nobody has been there.
  expect((await bank(page, 'saltpan')).step).toBe(0);

  expect(errors).toEqual([]);
});

test('the heap appears when something banks and goes when it is spent', async ({ page }) => {
  await boot(page);
  // BACKLOG-495: the subject here is the step machinery, not the founding state — it wants a bowl that
  // starts at nothing so "appears" and "goes" mean what they say. Name the fixture rather than assume it.
  await foundingState(page, 'empty-grounds');
  expect((await bank(page, 'bowl')).step).toBe(0);
  expect((await bank(page, 'bowl')).visible).toBe(false);

  await setPile(page, 'bowl', { stone: 1 });
  const one = await bank(page, 'bowl');
  expect(one.step).toBe(1);
  expect(one.visible).toBe(true); // the keeper is standing in the bowl

  await setPile(page, 'bowl', { stone: 4 });
  expect((await bank(page, 'bowl')).step).toBe(3);

  await setPile(page, 'bowl', {});
  const gone = await bank(page, 'bowl');
  expect(gone.step).toBe(0);
  expect(gone.visible).toBe(false);
});

test('a heap shows only on its own ground', async ({ page }) => {
  await boot(page);
  // Standing in the bowl, the Grove's founding heap is real but not on this floor.
  expect((await bank(page, 'grove')).step).toBe(2);
  expect((await bank(page, 'grove')).visible).toBe(false);

  await setZone(page, 'grove');
  expect((await bank(page, 'grove')).visible).toBe(true);
});

test('watching the founding ruin get mended knocks a step off the heap', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  await setZone(page, 'grove');
  expect((await bank(page, 'grove')).step).toBe(2);
  expect((await landmarks(page, 'grove'))[0].derelict).toBe(true);

  await runUpkeep(page, 1);
  for (let i = 0; i < 60; i++) {
    await stepMend(page);
    if ((await landmarks(page, 'grove')).every((l) => !l.derelict)) break;
  }
  expect((await landmarks(page, 'grove')).every((l) => !l.derelict)).toBe(true);

  // The mend was paid for out of the pile, and the pile is a thing on the ground.
  expect((await bank(page, 'grove')).step).toBe(1);

  expect(errors).toEqual([]);
});
