import { test, expect } from '@playwright/test';
import { boot } from './helpers';

// BACKLOG-169 — Mossback the stegosaurus is the second cast member through the GBA pixel
// pipeline (CHARTER v4). The 'steg_walk_<color>' anim-key contract is unchanged, so the pixel
// path takes over without disturbing any consumer (cycle-35 steg spec stays green).

type W = Record<string, unknown>;
type Art = { artKey: string | null; animating: boolean } | null;

test('Mossback renders via the pixel pipeline and ambles (boot is clean)', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const moss = await page.evaluate(() => ((window as W).__dinoArt as (n: string) => Art)('Mossback'));
  expect(moss).not.toBeNull();
  expect(moss!.artKey).toMatch(/^steg_walk_/); // same colour-keyed contract, now pixel-baked
  expect(moss!.animating).toBe(true);
  expect(errors).toEqual([]);
});

test('Rex (pixel) and the still-vector cast all render alongside Mossback', async ({ page }) => {
  await boot(page);
  const art = (n: string) => page.evaluate((x) => ((window as W).__dinoArt as (s: string) => Art)(x), n);

  // Two pixel rigs now (Rex + Mossback) under their own prefixes — no cross-species collision.
  expect((await art('Rex'))!.artKey).toMatch(/^tri_walk_/);
  expect((await art('Mossback'))!.artKey).toMatch(/^steg_walk_/);

  // The three still-vector dinos keep rendering until their own pixel restyle lands.
  for (const name of ['Sunny', 'Twitch', 'Glade']) {
    const a = await art(name);
    expect(a?.artKey, name).toBeTruthy();
    expect(a?.animating, name).toBe(true);
  }

  // The rectangle-fallback control still rides a genuine never-drawn species.
  const ptero = await page.evaluate(() => ((window as W).__hasArt as (s: string) => boolean)('pterodactyl'));
  expect(ptero).toBe(false);
});
