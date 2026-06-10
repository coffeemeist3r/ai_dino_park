import { test, expect } from '@playwright/test';
import { boot } from './helpers';

// BACKLOG-169 — Sunny the brontosaurus is the third cast member through the GBA pixel
// pipeline (CHARTER v4). The 'bro_walk_<color>' anim-key contract is unchanged, so the pixel
// path takes over without disturbing any consumer (the cycle-31 bronto spec stays green).

type W = Record<string, unknown>;
type Art = { artKey: string | null; animating: boolean } | null;

test('Sunny renders via the pixel pipeline and ambles (boot is clean)', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const sunny = await page.evaluate(() => ((window as W).__dinoArt as (n: string) => Art)('Sunny'));
  expect(sunny).not.toBeNull();
  expect(sunny!.artKey).toMatch(/^bro_walk_/); // same colour-keyed contract, now pixel-baked
  expect(sunny!.animating).toBe(true);
  expect(errors).toEqual([]);
});

test('three pixel rigs and the two still-vector dinos all render alongside each other', async ({ page }) => {
  await boot(page);
  const art = (n: string) => page.evaluate((x) => ((window as W).__dinoArt as (s: string) => Art)(x), n);

  // Three pixel rigs now (Rex + Mossback + Sunny) under their own prefixes — no collisions.
  expect((await art('Rex'))!.artKey).toMatch(/^tri_walk_/);
  expect((await art('Mossback'))!.artKey).toMatch(/^steg_walk_/);
  expect((await art('Sunny'))!.artKey).toMatch(/^bro_walk_/);

  // The two still-vector dinos keep rendering until their own pixel restyle lands.
  for (const name of ['Twitch', 'Glade']) {
    const a = await art(name);
    expect(a?.artKey, name).toBeTruthy();
    expect(a?.animating, name).toBe(true);
  }

  // The rectangle-fallback control still rides a genuine never-drawn species.
  const ptero = await page.evaluate(() => ((window as W).__hasArt as (s: string) => boolean)('pterodactyl'));
  expect(ptero).toBe(false);
});
