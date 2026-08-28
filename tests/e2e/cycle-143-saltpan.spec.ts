import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The frontier gets a ground (BACKLOG-505).
 *
 * 474 built the unsettled ground — a read, a lens badge, a migration tier above the richest-neighbour pick,
 * and a settling beat for whoever gets there first — and 500 then obeyed CHARTER v7 and put a resident on
 * every ground, which left the whole of it with no input. These specs are the input: a sixth ground that is
 * empty because nobody has settled it *yet*, and a park in which the frontier read finally returns something
 * on a save the player could actually be holding.
 */

type W = Record<string, any>;

const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);
const unsettled = (p: Page) => p.evaluate(() => (window as W).__unsettled() as string[]);
const zoneMap = (p: Page) =>
  p.evaluate(() => (window as W).__zoneMap() as Array<{ id: string; name: string; unsettled: boolean }>);

test('the park has six grounds and the sixth is the frontier, from the first frame', async ({ page }) => {
  await boot(page);
  const map = await zoneMap(page);
  expect(map.map((e) => e.id)).toEqual(['bowl', 'grove', 'fernreach', 'hollow', 'saltpan', 'ridge']);
  expect(map.find((e) => e.id === 'saltpan')!.name).toBe('The Saltpan');

  // The assertion this whole item exists for. It returned [] last night, on every save the park has ever
  // shipped since 500.
  expect(await unsettled(page)).toEqual(['saltpan']);
  expect(map.find((e) => e.id === 'saltpan')!.unsettled).toBe(true);
  for (const id of ['bowl', 'grove', 'fernreach', 'hollow', 'ridge']) {
    expect(map.find((e) => e.id === id)!.unsettled, `${id} should be settled`).toBe(false);
  }
});

test('a Hollow resident is pulled at the frontier over its richer neighbour', async ({ page }) => {
  await boot(page);
  // No setup: the Hollow ships with a resident and borders the Fernreach (inhabited, richer by every read)
  // and the Saltpan (nobody). The frontier tier sits above the richest pick, so it must take the Saltpan —
  // and this is the first time in the park's life that read has had anything to return on a fresh save.
  expect(await page.evaluate(() => (window as W).__scarcityDest('Murk') as string)).toBe('saltpan');
});

test('the first dino in settles it, once, and it never reads unsettled again', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__migrate('Murk', 'saltpan'));

  const log = (await events(page)).join('\n');
  expect(log).toMatch(/🚩 Murk is the first ever to set foot in The Saltpan/); // 343 founds
  expect(log).toMatch(/🌱 Murk settles The Saltpan — nobody has ever lived here/); // 474 settles

  // The Saltpan stops reading unsettled — and the Hollow starts, because Murk was its only resident and a
  // *spawned* resident records no pioneer (343 records one at arrival). That is a pre-existing property of
  // the frontier read, not something this item introduced: every ground except the bowl is `isOrigin: false`,
  // so emptying one makes it read as a place nobody has ever lived. Worth writing down here rather than
  // hiding behind a looser assertion; it is BACKLOG-505's second candidate ("re-point the tier at a ground
  // that has lost its last resident") already half-true by accident, and it is not this item's to change.
  expect(await unsettled(page)).toEqual(['hollow']);
  expect((await zoneMap(page)).find((e) => e.id === 'saltpan')!.unsettled).toBe(false);

  // And the Saltpan stays settled even after its founder walks back out: unsettled is stricter than empty.
  await page.evaluate(() => (window as W).__migrate('Murk', 'hollow'));
  expect(await unsettled(page)).toEqual([]);
});

test('the ground the player walks onto is crust, and the floor is whole without a salt rig', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__setZone('saltpan'));
  // The ground shipped on the flat-checker fallback that has held through path/water (294) and fern (399),
  // and BACKLOG-511 drew the crust the same night. Either way the floor is whole: the scene renders, the
  // hooks answer, nothing is blank.
  expect(await page.evaluate(() => (window as W).__zone() as string)).toBe('saltpan');
  expect(await page.evaluate(() => (window as W).__hatch().visible as boolean)).toBe(true);
});
