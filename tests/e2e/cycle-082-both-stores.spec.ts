import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Both-zone stores readout (BACKLOG-357). The plaque's Stores line shows *both* zones' piles, ▸ on the
 * keeper's active zone, so the player can watch the bowl and grove economies diverge without crossing.
 */

type W = Record<string, any>;
const TILE = 32;

const dinos = (p: Page) => p.evaluate(() => (window as W).__dinoPositions() as { name: string; x: number; y: number }[]);
const storesLine = (p: Page) => p.evaluate(() => (window as W).__plaque().stockpile as string);

/** Drop a resource on a named dino's tile in the active zone and step so it banks immediately. */
async function bankOn(p: Page, name: string, kind: string) {
  const d = (await dinos(p)).find((x) => x.name === name)!;
  await p.evaluate(({ kind, tx, ty }) => (window as W).__spawnResource(kind, tx, ty), {
    kind,
    tx: Math.floor(d.x / TILE),
    ty: Math.floor(d.y / TILE),
  });
  await p.evaluate(() => (window as W).__stepWorld());
}

test('the plaque shows both zones piles at once, ▸ on the active zone', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // Bank a branch in the bowl (active at boot).
  await bankOn(page, (await dinos(page))[0].name, 'branch');

  // Cross to the grove and bank a stone there.
  await page.evaluate(() => (window as W).__migrate('Rex', 'grove'));
  await page.evaluate(() => (window as W).__setZone('grove'));
  await bankOn(page, 'Rex', 'stone');

  // From the grove, the readout still shows the bowl's pile (no crossing needed to see it).
  let line = await storesLine(page);
  expect(line).toContain('Pocket Cretaceous'); // the bowl, the inactive zone here
  expect(line).toContain('The Grove');
  expect(line).toContain('🪵'); // bowl's branch
  expect(line).toContain('🪨'); // grove's stone
  expect(line).toContain('▸The Grove'); // ▸ on the active zone

  // Cross back to the bowl — the line still carries both, ▸ moves to the bowl.
  await page.evaluate(() => (window as W).__setZone('bowl'));
  line = await storesLine(page);
  expect(line).toContain('▸Pocket Cretaceous');
  expect(line).toContain('The Grove');
  expect(line).toContain('🪵');
  expect(line).toContain('🪨');

  expect(errors).toEqual([]);
});
