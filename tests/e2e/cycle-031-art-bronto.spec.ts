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

  // a still-undrawn species (stegosaurus) keeps the flat-rectangle fallback
  const moss = await page.evaluate(() => ((window as W).__dinoArt as (n: string) => Art)('Mossback'));
  expect(moss!.artKey).toBeNull();
  expect(moss!.animating).toBe(false);
});
