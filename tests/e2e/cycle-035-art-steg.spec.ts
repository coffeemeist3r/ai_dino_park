import { test, expect } from '@playwright/test';
import { boot } from './helpers';

type W = Record<string, unknown>;
type Art = { artKey: string | null; animating: boolean } | null;

test('Mossback the stegosaurus renders via the procedural pipeline and ambles — the cast is 5/5 (BACKLOG-034)', async ({ page }) => {
  await boot(page);

  const moss = await page.evaluate(() => ((window as W).__dinoArt as (n: string) => Art)('Mossback'));
  expect(moss).not.toBeNull();
  expect(moss!.artKey).toMatch(/^steg_walk_/); // baked, colour-keyed stegosaurus
  expect(moss!.animating).toBe(true); // the amble loop is running

  // every earlier-drawn species still bakes under its own prefix — no cross-species collision
  const dino = (n: string) => page.evaluate((name) => ((window as W).__dinoArt as (x: string) => Art)(name), n);
  expect((await dino('Rex'))!.artKey).toMatch(/^tri_walk_/);
  expect((await dino('Sunny'))!.artKey).toMatch(/^bro_walk_/);
  expect((await dino('Glade'))!.artKey).toMatch(/^para_walk_/);
  expect((await dino('Twitch'))!.artKey).toMatch(/^comp_walk_/);
});

test('the rectangle-fallback path still exists, now exercised by a genuine never-drawn species', async ({ page }) => {
  await boot(page);

  const hasArt = (s: string) => page.evaluate((sp) => ((window as W).__hasArt as (x: string) => boolean)(sp), s);
  // all five cast species are drawn…
  for (const s of ['triceratops', 'brontosaurus', 'parasaurolophus', 'compsognathus', 'stegosaurus']) {
    expect(await hasArt(s)).toBe(true);
  }
  // …and a species the pipeline has never drawn has no rig, so it would render as a flat rectangle.
  expect(await hasArt('pterodactyl')).toBe(false);
  expect(await hasArt('mosasaurus')).toBe(false);
});
