import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Directed carry (BACKLOG-356). A crossing dino ferries the kind the destination zone is short of for its
 * next craft, not a random spare. Bowl holds {stone:2, branch:1}; the grove (empty) needs branch:3 / stone:2
 * for its next cairn — branch is the bigger shortfall, so the crosser carries the *branch* (where the old
 * cycle-077 carry would have moved the most-stocked stone). Conserved on the same transfer path.
 */

type W = Record<string, any>;
const TILE = 32;

const dinos = (p: Page) => p.evaluate(() => (window as W).__dinoPositions() as { name: string; x: number; y: number }[]);
const zonePile = (p: Page, z: string) => p.evaluate((zz) => (window as W).__zoneStockpile(zz) as Record<string, number>, z);
const migrating = (p: Page) => p.evaluate(() => (window as W).__migrating() as string[]);
const step = (p: Page) => p.evaluate(() => (window as W).__stepWorld());

async function bankOn(p: Page, name: string, kind: string) {
  const d = (await dinos(p)).find((x) => x.name === name)!;
  const tx = Math.floor(d.x / TILE);
  const ty = Math.floor(d.y / TILE);
  await p.evaluate(({ kind, tx, ty }) => (window as W).__spawnResource(kind, tx, ty), { kind, tx, ty });
  await step(p);
}

async function crossOnce(p: Page, name: string) {
  await p.evaluate((n) => (window as W).__startMigration(n), name);
  for (let i = 0; i < 40; i++) {
    await step(p);
    if (!(await migrating(p)).includes(name)) return;
  }
  throw new Error(`${name} never finished crossing`);
}

test('a crosser ferries the kind the destination is short of, not the most-stocked spare', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // Bowl pile: stone:2, branch:1 (stone is most-stocked — what the old carry would have moved).
  await bankOn(page, 'Rex', 'stone');
  await bankOn(page, 'Rex', 'stone');
  await bankOn(page, 'Rex', 'branch');
  expect(await zonePile(page, 'bowl')).toEqual({ stone: 2, branch: 1 });
  expect(await zonePile(page, 'grove')).toEqual({});

  // Rex crosses bowl → grove. The grove (empty) needs branch most for its cairn, so the branch is ferried.
  await crossOnce(page, 'Rex');
  const grove = await zonePile(page, 'grove');
  expect(grove.branch).toBe(1); // the directed kind moved
  expect(grove.stone ?? 0).toBe(0); // the spare stayed behind
  expect((await zonePile(page, 'bowl')).branch ?? 0).toBe(0); // conserved: bowl −1 branch
  expect((await zonePile(page, 'bowl')).stone).toBe(2);

  expect(errors).toEqual([]);
});
