import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Keeper avatars (BACKLOG-158) — the player is one of three robot observers. The default
 * observer (AETHER-1 / 'aether') is drawn this fire; the other two stay on the original amber
 * square until their rigs land, which doubles as the rectangle-fallback control (an undrawn
 * subject must still render). __keeperArt() is the baked anim key, or null for the square.
 */

type W = Window & Record<string, any>;

test('the default observer renders as a baked, playing pixel sprite (boot is clean)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await boot(page);

  expect(await page.evaluate(() => (window as W).__keeper())).toBe('aether');
  // a non-null anim key means the bake produced textures + a registered walk anim, not the square
  expect(await page.evaluate(() => (window as W).__keeperArt())).toBe('keeper_aether_walk');
  expect(errors).toEqual([]);
});

test('the rectangle-fallback control: a no-art id routes to the amber square', async ({ page }) => {
  await boot(page);

  // The whole roster is drawn (cycle 047-art), so the undrawn-subject guarantee is pinned on a
  // genuine no-art id — the pterodactyl convention (control re-pointed vanta→lumen→'vex-0').
  expect(await page.evaluate(() => (window as W).__hasKeeperArt('vex-0'))).toBe(false);
  expect(await page.evaluate(() => (window as W).__hasKeeperArt('aether'))).toBe(true);

  // observer switches stay sprite-backed
  await page.evaluate(() => (window as W).__pickKeeper('aether'));
  expect(await page.evaluate(() => (window as W).__keeperArt())).toBe('keeper_aether_walk');
});

test('the avatar swap keeps the keeper moving (position hook still works after a switch)', async ({ page }) => {
  await boot(page);
  const before = await page.evaluate(() => (window as W).__playerPos());
  await page.evaluate(() => (window as W).__pickKeeper('vanta'));
  const after = await page.evaluate(() => (window as W).__playerPos());
  expect(after).toEqual(before); // swap rebuilds in place — no teleport
});
