import { test, expect } from '@playwright/test';
import { boot } from './helpers';

// BACKLOG-169 — Glade the parasaurolophus is the FIFTH and final cast member through the GBA
// pixel pipeline (CHARTER v4): the restyle arc is complete, no vector dino remains. The
// 'para_walk_<color>' anim-key contract is unchanged, so the pixel path takes over without
// disturbing any consumer (the cycle-32 para spec stays green).

type W = Record<string, unknown>;
type Art = { artKey: string | null; animating: boolean } | null;

test('Glade renders via the pixel pipeline and ambles (boot is clean)', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const glade = await page.evaluate(() => ((window as W).__dinoArt as (n: string) => Art)('Glade'));
  expect(glade).not.toBeNull();
  expect(glade!.artKey).toMatch(/^para_walk_/); // same colour-keyed contract, now pixel-baked
  expect(glade!.animating).toBe(true);
  expect(errors).toEqual([]);
});

test('the whole cast is pixel now — five rigs, five prefixes, no vector survivor', async ({ page }) => {
  await boot(page);
  const art = (n: string) => page.evaluate((x) => ((window as W).__dinoArt as (s: string) => Art)(x), n);

  expect((await art('Rex'))!.artKey).toMatch(/^tri_walk_/);
  expect((await art('Mossback'))!.artKey).toMatch(/^steg_walk_/);
  expect((await art('Sunny'))!.artKey).toMatch(/^bro_walk_/);
  expect((await art('Twitch'))!.artKey).toMatch(/^comp_walk_/);
  expect((await art('Glade'))!.artKey).toMatch(/^para_walk_/);

  // The rectangle-fallback control still rides a genuine never-drawn species.
  const ptero = await page.evaluate(() => ((window as W).__hasArt as (s: string) => boolean)('pterodactyl'));
  expect(ptero).toBe(false);
});
