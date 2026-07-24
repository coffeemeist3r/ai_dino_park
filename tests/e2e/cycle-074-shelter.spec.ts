import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Dino-built shelter (BACKLOG-315), as reshaped by zone-distinct craft (BACKLOG-377). The lean-to is no
 * longer a per-zone escalation after the cairn — it is the **grove's** bias-chosen landmark. Each zone
 * builds the structure its resource bias (348) favors: the stone-rich bowl stacks 🗿 cairns, the
 * branch-rich grove raises 🛖 lean-tos ({branch:6, stone:4}). One shelter per build, zone-scoped + persisted.
 */

type W = Record<string, any>;
const TILE = 32;

const dinos = (p: Page) => p.evaluate(() => (window as W).__dinoPositions() as { name: string; x: number; y: number }[]);
const cairns = (p: Page) => p.evaluate(() => (window as W).__cairns() as { tileX: number; tileY: number; zone: string }[]);
const shelters = (p: Page) => p.evaluate(() => (window as W).__shelters() as { tileX: number; tileY: number; zone: string }[]);
const granaries = (p: Page) => p.evaluate(() => (window as W).__granaries() as { tileX: number; tileY: number; zone: string }[]);
const zonePile = (p: Page, z: string) => p.evaluate((zz) => (window as W).__zoneStockpile(zz) as Record<string, number>, z);
const exportSave = (p: Page) => p.evaluate(() => (window as W).__exportSave() as string);

/** Drop a resource on a named dino's tile in the *active* zone and step so it banks immediately. */
async function bankOn(p: Page, name: string, kind: string) {
  const d = (await dinos(p)).find((x) => x.name === name)!;
  const tx = Math.floor(d.x / TILE);
  const ty = Math.floor(d.y / TILE);
  await p.evaluate(({ kind, tx, ty }) => (window as W).__spawnResource(kind, tx, ty), { kind, tx, ty });
  await p.evaluate(() => (window as W).__stepWorld());
}

test('the bowl stacks cairns and never a lean-to (its bias is stone)', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // The bowl builds cairns (BACKLOG-377: zoneStructure('bowl') === 'cairn').
  expect(await page.evaluate(() => (window as W).__zoneStructure('bowl'))).toBe('cairn');

  const bowlDino = (await dinos(page))[0].name;
  // Bank three cairns' worth — the bowl stacks cairns, never escalating to a lean-to.
  for (let i = 0; i < 3; i++) {
    for (const k of ['branch', 'branch', 'branch', 'stone', 'stone']) await bankOn(page, bowlDino, k);
  }
  expect((await cairns(page)).length).toBe(3); // a cairn per recipe's worth
  expect((await shelters(page)).length).toBe(0); // the bowl never raises a lean-to
  expect((await cairns(page)).every((c) => c.zone === 'bowl')).toBe(true);

  // BACKLOG-454: with three landmarks up, the bowl now saves toward a granary — banking the granary recipe
  // ({branch:3, stone:3}) puts one up, still never a lean-to. Building finally feeds the food economy.
  for (const k of ['branch', 'branch', 'branch', 'stone', 'stone', 'stone']) await bankOn(page, bowlDino, k);
  expect((await granaries(page)).length).toBe(1);
  expect((await granaries(page)).every((g) => g.zone === 'bowl')).toBe(true);
  expect((await cairns(page)).length).toBe(3); // no fourth cairn — the gather went to the granary
  expect((await shelters(page)).length).toBe(0);
  expect(errors).toEqual([]);
});

test('the grove raises a lean-to and never a cairn (its bias is branch)', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // The grove builds lean-tos (BACKLOG-377: zoneStructure('grove') === 'shelter').
  expect(await page.evaluate(() => (window as W).__zoneStructure('grove'))).toBe('shelter');

  // Put a dino in the grove and cross to it, then gather there.
  await page.evaluate(() => (window as W).__migrate('Rex', 'grove'));
  await page.evaluate(() => (window as W).__setZone('grove'));

  // Bank the lean-to recipe ({branch:6, stone:4}); the shelter fires on the bank that completes it.
  for (const k of ['branch', 'branch', 'branch', 'branch', 'branch', 'branch']) await bankOn(page, 'Rex', k);
  expect((await shelters(page)).length).toBe(0); // {branch:6, stone:0} — short of stone
  await bankOn(page, 'Rex', 'stone');
  await bankOn(page, 'Rex', 'stone');
  await bankOn(page, 'Rex', 'stone');
  expect((await shelters(page)).length).toBe(0); // {6,3} — a stone short
  await bankOn(page, 'Rex', 'stone'); // stone → 4 → build

  const built = await shelters(page);
  expect(built.length).toBe(1);
  expect(built[0].zone).toBe('grove'); // the grove's own landmark
  expect((await cairns(page)).length).toBe(0); // the grove never stacks a cairn

  const pile = await zonePile(page, 'grove');
  expect(pile.branch).toBe(0); // recipe spent exactly (6 - 6)
  expect(pile.stone).toBe(0); // (4 - 4)

  // BACKLOG-344: the shelter renders as the baked lean-to prop, not the 🛖 glyph.
  expect(await page.evaluate(() => (window as W).__shelterArt())).toBe('prop_shelter');
  const save = JSON.parse(await exportSave(page));
  expect(save.shelters.length).toBe(1);
  expect(save.version).toBe(2); // additive — no version bump
  expect(errors).toEqual([]);
});
