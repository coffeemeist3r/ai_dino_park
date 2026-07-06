import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The Fernreach's frond thatch (BACKLOG-417) — the third distinct built landmark. The frond-rich
 * Fernreach (400) weaves a 🥻 thatch from its own gathered fronds ({frond:4}), so the three-zone chain
 * now raises three different structures: bowl cairn, grove lean-to, Fernreach thatch. Mirrors the
 * cycle-074 shelter spec's gather-to-build path; the thatch renders from the stashed rig (427).
 */

type W = Record<string, any>;
const TILE = 32;

const dinos = (p: Page) => p.evaluate(() => (window as W).__dinoPositions() as { name: string; x: number; y: number }[]);
const thatches = (p: Page) => p.evaluate(() => (window as W).__thatches() as { tileX: number; tileY: number; zone: string }[]);
const cairns = (p: Page) => p.evaluate(() => (window as W).__cairns() as { tileX: number; tileY: number; zone: string }[]);
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

test('the chain raises three distinct landmarks: cairn / lean-to / thatch', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => (window as W).__zoneStructure('bowl'))).toBe('cairn');
  expect(await page.evaluate(() => (window as W).__zoneStructure('grove'))).toBe('shelter');
  expect(await page.evaluate(() => (window as W).__zoneStructure('fernreach'))).toBe('thatch');
});

test('the Fernreach weaves a frond thatch and never a cairn (its bias is frond)', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // Put a dino in the Fernreach and make it the active zone, then gather fronds there.
  await page.evaluate(() => (window as W).__migrate('Rex', 'fernreach'));
  await page.evaluate(() => (window as W).__setZone('fernreach'));

  // Bank the thatch recipe ({frond:4}); the thatch fires on the bank that completes it.
  await bankOn(page, 'Rex', 'frond');
  await bankOn(page, 'Rex', 'frond');
  await bankOn(page, 'Rex', 'frond');
  expect((await thatches(page)).length).toBe(0); // {frond:3} — a frond short
  await bankOn(page, 'Rex', 'frond'); // frond → 4 → weave

  const built = await thatches(page);
  expect(built.length).toBe(1);
  expect(built[0].zone).toBe('fernreach'); // the Fernreach's own landmark
  expect((await cairns(page)).length).toBe(0); // the Fernreach never stacks a cairn now

  expect((await zonePile(page, 'fernreach')).frond).toBe(0); // recipe spent exactly (4 - 4)

  // BACKLOG-417/427: the thatch renders from the stashed pixel rig, not the 🥻 glyph.
  expect(await page.evaluate(() => (window as W).__thatchIsArt())).toBe(true);

  const save = JSON.parse(await exportSave(page));
  expect(save.thatches.length).toBe(1);
  expect(save.version).toBe(2); // additive — no version bump
  expect(errors).toEqual([]);
});
