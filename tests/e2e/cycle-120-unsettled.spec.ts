import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The unsettled ground (BACKLOG-474) — Milestone 10's closing structure arc. 472 laid a fourth ground and
 * nobody could ever get there: an empty ground is the least appealing place in the park and the destination
 * pick takes the most appealing. These prove the three things that changed — a ground that reads unsettled,
 * a migration that aims at it, and a founding that is also a settling.
 *
 * A finding these specs pin (cycle 120): on a fresh save the Hollow is not the *only* unsettled ground.
 * The whole cast begins in the bowl, so the grove and the Fernreach have no residents and no pioneer
 * either — the park has always started as one inhabited ground and three empty ones, and nothing before
 * this arc could say so. The chain fills west→east as the herd walks it.
 */

type W = Record<string, any>;

const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);
const unsettled = (p: Page) => p.evaluate(() => (window as W).__unsettled() as string[]);
const zoneMap = (p: Page) =>
  p.evaluate(() => (window as W).__zoneMap() as Array<{ id: string; unsettled: boolean }>);

test('a fresh park has exactly one unsettled ground — the frontier — and reads another the moment one empties', async ({ page }) => {
  await boot(page);
  // The assertion has now flipped twice, and both flips are the finding. BACKLOG-500 obeyed CHARTER v7's
  // "every ground the player can walk to has life on it at boot" and turned this from ['hollow', 'ridge']
  // into [] — the frontier tier, the lens badge and the settling beat all went dormant on a fresh save,
  // a real cost recorded here rather than papered over. BACKLOG-505 pays it: the Saltpan is a ground that
  // is empty because nobody has settled it *yet*, which is what 474 meant by unsettled all along. This is
  // the first shipping save in the park's history on which the frontier read returns anything.
  expect(await unsettled(page)).toEqual(['saltpan']);

  const booted = await zoneMap(page);
  expect(booted.find((e) => e.id === 'hollow')!.unsettled).toBe(false);
  expect(booted.find((e) => e.id === 'bowl')!.unsettled).toBe(false);
  expect(booted.find((e) => e.id === 'saltpan')!.unsettled).toBe(true); // BACKLOG-505: the badge lights

  // Empty the Hollow and it reads unsettled too — the read is heads, not history.
  await page.evaluate(() => (window as W).__migrate('Murk', 'fernreach'));
  expect(await unsettled(page)).toEqual(['hollow', 'saltpan']);
  expect((await zoneMap(page)).find((e) => e.id === 'hollow')!.unsettled).toBe(true);
});

test('a migrant aims at the unsettled ground over an inhabited neighbour', async ({ page }) => {
  await boot(page);
  // Settle the grove, then stand a dino in the Fernreach: its neighbours are now the grove (inhabited,
  // richer by every read) and the Hollow (still nobody). The frontier tier must take the Hollow.
  await page.evaluate(() => (window as W).__migrate('Sunny', 'grove'));
  await page.evaluate(() => (window as W).__migrate('Twitch', 'fernreach'));
  // BACKLOG-500: the frontier has to be *made* now — both far grounds ship with a resident, so their
  // residents walk out first. The Ridge stays two hops off, so this is still a test of the frontier tier's
  // nearest-qualifying read rather than a one-candidate walkover.
  await page.evaluate(() => (window as W).__migrate('Murk', 'grove'));
  await page.evaluate(() => (window as W).__migrate('Ember', 'grove'));
  expect(await unsettled(page)).toEqual(['hollow', 'saltpan', 'ridge']); // chain order — BACKLOG-505
  expect(await page.evaluate(() => (window as W).__scarcityDest('Twitch') as string)).toBe('hollow');
});

test('the first dino in settles it, once, and the ground stops reading unsettled', async ({ page }) => {
  await boot(page);
  // BACKLOG-500: the Hollow ships with Murk on it, so empty it before founding it — this test is about the
  // pioneer record (343), and a spawned resident records none.
  await page.evaluate(() => (window as W).__migrate('Murk', 'fernreach'));
  await page.evaluate(() => (window as W).__migrate('Twitch', 'hollow'));

  const log = (await events(page)).join('\n');
  expect(log).toMatch(/🚩 Twitch is the first ever to set foot in The Hollow/); // 343 founds
  expect(log).toMatch(/🌱 Twitch settles The Hollow — nobody has ever lived here/); // 474 settles
  // Nobody tells the founder its brand-new home has gone quiet (464 must stay silent at peak 1 / heads 1).
  expect(log).not.toMatch(/gone quiet/);

  expect(await unsettled(page)).not.toContain('hollow');
  expect((await zoneMap(page)).find((e) => e.id === 'hollow')!.unsettled).toBe(false);

  // A second arrival settles nothing — the founding happened once, forever.
  await page.evaluate(() => (window as W).__migrate('Sunny', 'hollow'));
  const settles = (await events(page)).filter((e) => e.includes('settles The Hollow'));
  expect(settles).toHaveLength(1);
});
