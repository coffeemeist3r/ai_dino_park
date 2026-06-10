import { test, expect } from '@playwright/test';
import { boot } from './helpers';

// BACKLOG-168 — the GBA pixel pipeline's proof dino. Rex now bakes from a pixel-grid rig
// (CHARTER v4); the anim-key contract ('tri_walk_<color>') is unchanged, so this spec proves
// the pixel path took over without disturbing any consumer.

type W = Record<string, unknown>;
type Art = { artKey: string | null; animating: boolean } | null;

test('Rex renders via the pixel pipeline and ambles (boot is clean)', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const rex = await page.evaluate(() => ((window as W).__dinoArt as (n: string) => Art)('Rex'));
  expect(rex).not.toBeNull();
  expect(rex!.artKey).toMatch(/^tri_walk_/); // same colour-keyed contract, now pixel-baked
  expect(rex!.animating).toBe(true);
  expect(errors).toEqual([]);
});

test('the rest of the cast still renders (vector rigs hold until their pixel restyle)', async ({ page }) => {
  await boot(page);

  const art = (n: string) => page.evaluate((x) => ((window as W).__dinoArt as (s: string) => Art)(x), n);
  for (const name of ['Mossback', 'Sunny', 'Twitch', 'Glade']) {
    const a = await art(name);
    expect(a?.artKey, name).toBeTruthy();
    expect(a?.animating, name).toBe(true);
  }

  // The rectangle-fallback control still rides a genuine never-drawn species.
  const ptero = await page.evaluate(() => ((window as W).__hasArt as (s: string) => boolean)('pterodactyl'));
  expect(ptero).toBe(false);
});
