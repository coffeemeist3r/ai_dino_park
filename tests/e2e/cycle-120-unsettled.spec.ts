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
  p.evaluate(() => (window as W).__zoneMap() as Array<{ id: string; unsettled: boolean; hollowed: boolean }>);

test('a fresh park has exactly one unsettled ground — the frontier — and an emptied ground does not join it', async ({ page }) => {
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

  // And the assertion below has now flipped a third time, which is BACKLOG-512 and is the point of the
  // read. It used to say "empty the Hollow and it reads unsettled too — the read is heads, not history",
  // and that was the defect: `isUnsettled` asked for a pioneer, 343 recorded one only on *arrival*, and
  // the five grounds the roster wakes on had none — so a ground the cast has lived on since the first
  // frame declared itself virgin the moment its last resident stepped out. The read is history again.
  await page.evaluate(() => (window as W).__migrate('Murk', 'fernreach'));
  expect(await unsettled(page)).toEqual(['saltpan']);
  expect((await zoneMap(page)).find((e) => e.id === 'hollow')!.unsettled).toBe(false);
  expect((await zoneMap(page)).find((e) => e.id === 'hollow')!.hollowed).toBe(true);
});

test('a migrant aims at the unsettled ground over an inhabited neighbour', async ({ page }) => {
  await boot(page);
  // BACKLOG-512: the frontier can no longer be *made* by emptying a ground — an emptied ground is hollowed,
  // not virgin — so this test uses the park's one real frontier and a genuinely richer alternative. Stand
  // Twitch in the Hollow: its neighbours are the Fernreach (inhabited, richer by every read) and the
  // Saltpan (nobody, ever). The frontier tier must still take the Saltpan.
  await page.evaluate(() => (window as W).__migrate('Twitch', 'hollow'));
  expect(await unsettled(page)).toEqual(['saltpan']);
  expect(await page.evaluate(() => (window as W).__scarcityDest('Twitch') as string)).toBe('saltpan');
});

test('the first dino in settles it, once, and the ground stops reading unsettled', async ({ page }) => {
  await boot(page);
  // BACKLOG-512: emptying a ground no longer un-founds it — a spawned resident now records a founding — so
  // a *founding* needs a ground nobody has founded, which since BACKLOG-505 is the Saltpan, and which is
  // what 474 meant by unsettled all along.
  await page.evaluate(() => (window as W).__migrate('Twitch', 'saltpan'));

  const log = (await events(page)).join('\n');
  expect(log).toMatch(/🚩 Twitch is the first ever to set foot in the Saltpan/); // 343 founds (499 wording)
  expect(log).toMatch(/🌱 Twitch settles the Saltpan — nobody has ever lived here/); // 474 settles
  // Nobody tells the founder its brand-new home has gone quiet (464 must stay silent at peak 1 / heads 1).
  expect(log).not.toMatch(/gone quiet/);

  expect(await unsettled(page)).not.toContain('saltpan');
  expect((await zoneMap(page)).find((e) => e.id === 'saltpan')!.unsettled).toBe(false);

  // A second arrival settles nothing — the founding happened once, forever.
  await page.evaluate(() => (window as W).__migrate('Sunny', 'saltpan'));
  const settles = (await events(page)).filter((e) => e.includes('settles the Saltpan'));
  expect(settles).toHaveLength(1);
});
