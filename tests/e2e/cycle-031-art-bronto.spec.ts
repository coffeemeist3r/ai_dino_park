import { test, expect } from '@playwright/test';
import { boot } from './helpers';

type W = Record<string, unknown>;
type Art = { artKey: string | null; animating: boolean } | null;

test('Sunny the brontosaurus renders via the procedural pipeline and ambles (BACKLOG-034)', async ({ page }) => {
  await boot(page);

  const sunny = await page.evaluate(() => ((window as W).__dinoArt as (n: string) => Art)('Sunny'));
  expect(sunny).not.toBeNull();
  expect(sunny!.artKey).toMatch(/^bro_walk_/); // baked, colour-keyed brontosaurus
  expect(sunny!.animating).toBe(true);

  // Rex's triceratops still bakes under its own prefix — no cross-species collision
  const rex = await page.evaluate(() => ((window as W).__dinoArt as (n: string) => Art)('Rex'));
  expect(rex!.artKey).toMatch(/^tri_walk_/);

  // stegosaurus is drawn as of cycle 35-art; the rectangle-fallback control now rides a
  // genuine never-drawn species (CHARTER art-fallback policy).
  const hasArt = (s: string) => page.evaluate((sp) => ((window as W).__hasArt as (x: string) => boolean)(sp), s);
  expect(await hasArt('pterodactyl')).toBe(false); // never-drawn → flat-rectangle fallback
  expect(await hasArt('stegosaurus')).toBe(true);
});
