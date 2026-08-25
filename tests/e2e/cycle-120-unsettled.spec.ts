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

test('a fresh park has no unsettled ground left — and reads unsettled again the moment one empties', async ({ page }) => {
  await boot(page);
  // BACKLOG-500 flips this assertion, and the flip is the finding. CHARTER v7 says every ground the player
  // can walk to has life on it at boot; 474's frontier read is *about* grounds nobody lives on. Satisfying
  // the constitution makes the frontier tier dormant on a fresh save — a real cost, recorded here rather
  // than papered over. The read itself still works the instant a ground actually empties.
  expect(await unsettled(page)).toEqual([]);

  const booted = await zoneMap(page);
  expect(booted.find((e) => e.id === 'hollow')!.unsettled).toBe(false);
  expect(booted.find((e) => e.id === 'bowl')!.unsettled).toBe(false);

  // Empty the Hollow and it reads unsettled again — the read is heads, not history.
  await page.evaluate(() => (window as W).__migrate('Murk', 'fernreach'));
  expect(await unsettled(page)).toEqual(['hollow']);
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
  expect(await unsettled(page)).toEqual(['hollow', 'ridge']);
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
