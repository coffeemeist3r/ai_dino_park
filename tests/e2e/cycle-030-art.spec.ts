import { test, expect } from '@playwright/test';
import { boot } from './helpers';

type W = Record<string, unknown>;
type Art = { artKey: string | null; animating: boolean } | null;

test('Rex renders via the procedural vector pipeline and plays his walk loop', async ({ page }) => {
  await boot(page);

  const rex = await page.evaluate(() => ((window as W).__dinoArt as (n: string) => Art)('Rex'));
  expect(rex).not.toBeNull();
  expect(rex!.artKey).toMatch(/^tri_walk_/); // baked, colour-keyed triceratops
  expect(rex!.animating).toBe(true); // the amble loop is running

  // Every cast member is drawn as of cycle 35-art, so the rectangle-fallback control now rides
  // a genuine never-drawn species (CHARTER art-fallback policy): an unknown species has no rig
  // and would fall back to a flat shape, while every real dino is baked.
  const hasArt = (s: string) => page.evaluate((sp) => ((window as W).__hasArt as (x: string) => boolean)(sp), s);
  expect(await hasArt('pterodactyl')).toBe(false); // never-drawn → flat-rectangle fallback
  expect(await hasArt('stegosaurus')).toBe(true); // Mossback's species, drawn cycle 35-art
});
