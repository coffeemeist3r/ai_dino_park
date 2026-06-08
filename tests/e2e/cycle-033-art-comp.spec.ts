import { test, expect } from '@playwright/test';
import { boot } from './helpers';

type W = Record<string, unknown>;
type Art = { artKey: string | null; animating: boolean } | null;

test('Twitch the compsognathus renders via the procedural pipeline and skitters (BACKLOG-034)', async ({ page }) => {
  await boot(page);

  const twitch = await page.evaluate(() => ((window as W).__dinoArt as (n: string) => Art)('Twitch'));
  expect(twitch).not.toBeNull();
  expect(twitch!.artKey).toMatch(/^comp_walk_/); // baked, colour-keyed compsognathus
  expect(twitch!.animating).toBe(true);

  // the earlier-drawn species still bake under their own prefixes — no cross-species collision
  const rex = await page.evaluate(() => ((window as W).__dinoArt as (n: string) => Art)('Rex'));
  expect(rex!.artKey).toMatch(/^tri_walk_/);
  const sunny = await page.evaluate(() => ((window as W).__dinoArt as (n: string) => Art)('Sunny'));
  expect(sunny!.artKey).toMatch(/^bro_walk_/);
  const glade = await page.evaluate(() => ((window as W).__dinoArt as (n: string) => Art)('Glade'));
  expect(glade!.artKey).toMatch(/^para_walk_/);

  // stegosaurus was the last undrawn cast species; it's drawn as of cycle 35-art, so the
  // rectangle-fallback control now rides a genuine never-drawn species (CHARTER art-fallback policy).
  const hasArt = (s: string) => page.evaluate((sp) => ((window as W).__hasArt as (x: string) => boolean)(sp), s);
  expect(await hasArt('pterodactyl')).toBe(false); // never-drawn → flat-rectangle fallback
  expect(await hasArt('stegosaurus')).toBe(true);
});
