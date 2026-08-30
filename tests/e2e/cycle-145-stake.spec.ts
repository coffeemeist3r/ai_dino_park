import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The founder's mark, planted (BACKLOG-501's repair).
 *
 * The reachability register's ninth entry asked whether every rig the studio has drawn is one the park can
 * put on the ground, and its first walk said no: the two founder's-stake rigs were drawn the night of cycle
 * 144 and nothing placed either of them. This is that gap closed, from the player's side — a post standing
 * on the ground the keeper is on, and bare dirt on the one ground nobody has ever claimed.
 */

type W = Record<string, any>;

const stake = (p: Page) => p.evaluate(() => (window as W).__stake() as string | null);
const hollowed = (p: Page) => p.evaluate(() => (window as W).__hollowed() as string[]);

test('a founder’s mark stands on the ground the player wakes up on', async ({ page }) => {
  await boot(page);
  // BACKLOG-517: set in stone, not driven — the bowl's founder woke up there, it did not walk in.
  expect(await stake(page)).toBe('founder_stake_native');
});

test('a ground somebody crossed into stands the driven post instead', async ({ page }) => {
  await boot(page);
  // A real crossing, not just a record: `__found` alone would leave the Saltpan founded and empty, which
  // is `hollowed` and correctly so. Somebody has to actually be standing there.
  await page.evaluate(() => (window as W).__migrate('Twitch', 'saltpan'));
  await page.evaluate(() => (window as W).__setZone('saltpan'));
  expect(await stake(page)).toBe('founder_stake');
});

test('the frontier shows nothing — bare is what unclaimed ground looks like', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__setZone('saltpan'));
  expect(await stake(page)).toBeNull();
});

test('the mark leans the moment its ground empties, and stands again when somebody returns', async ({
  page,
}) => {
  await boot(page);
  // Move every resident of the starting ground off it; the ground keeps its founder and reads hollowed.
  await page.evaluate(() => {
    const w = window as W;
    for (const name of ['Rex', 'Mossback', 'Sunny', 'Twitch', 'Glade']) w.__migrate(name, 'grove');
  });
  await page.evaluate(() => (window as W).__setZone('bowl'));
  expect(await hollowed(page)).toContain('bowl');
  expect(await stake(page)).toBe('founder_stake_hollowed');

  await page.evaluate(() => (window as W).__migrate('Sunny', 'bowl'));
  await page.evaluate(() => (window as W).__setZone('bowl'));
  expect(await hollowed(page)).not.toContain('bowl');
  expect(await stake(page)).toBe('founder_stake_native');
});
