import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Zone carry pressure (BACKLOG-429). A zone over its stockpile soft cap (6) sheds its glut toward a lighter
 * neighbour — up to PRESSURE_CARRY (2) units — instead of the single directed kind. Below the cap it carries
 * one, byte-identical to 356/377. Bowl → grove is the default crossing.
 */

type W = Record<string, any>;

const zonePile = (p: Page, z: string) => p.evaluate((zz) => (window as W).__zoneStockpile(zz) as Record<string, number>, z);
const setZonePile = (p: Page, z: string, pile: Record<string, number>) =>
  p.evaluate(({ z, pile }) => (window as W).__setZonePile(z, pile), { z, pile });
const migrating = (p: Page) => p.evaluate(() => (window as W).__migrating() as string[]);
const step = (p: Page) => p.evaluate(() => (window as W).__stepWorld());
const totalOf = (pile: Record<string, number>) => Object.values(pile).reduce((s, n) => s + n, 0);

async function crossOnce(p: Page, name: string) {
  await p.evaluate((n) => (window as W).__startMigration(n), name);
  for (let i = 0; i < 40; i++) {
    await step(p);
    if (!(await migrating(p)).includes(name)) return;
  }
  throw new Error(`${name} never finished crossing`);
}

test('a glutted zone sheds two toward a lighter neighbour', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // The glut is fronds: a kind the bowl's own structure recipe (cairn = branch 3 + stone 2) can never spend.
  // With a stone/branch glut a bowl dino gathering mid-crossing could auto-craft a cairn, drop the source
  // under the soft cap, and flip the carry back to one unit — a genuine flake this spec hit ~1 run in 6 on
  // clean HEAD (cycle-107 QA). A frond pile can only grow, so the pressure decision is stable.
  await setZonePile(page, 'bowl', { frond: 8 }); // total 8 > soft cap 6
  await setZonePile(page, 'grove', {}); // empty destination, strictly lighter
  await crossOnce(page, 'Rex');

  // Assert on the grove (destination): it starts empty and no dino gathers there at boot, so the only thing
  // that adds to it is Rex's carry.
  expect(totalOf(await zonePile(page, 'grove'))).toBe(2); // pressured: two units shed toward the lighter zone
  expect(errors).toEqual([]);
});

test('a zone under the soft cap carries just one (no regression)', async ({ page }) => {
  await boot(page);

  await setZonePile(page, 'bowl', { stone: 2, branch: 1 }); // total 3 ≤ soft cap
  await setZonePile(page, 'grove', {}); // empty destination
  await crossOnce(page, 'Rex');

  expect(totalOf(await zonePile(page, 'grove'))).toBe(1); // single directed kind, no pressure boost
});
