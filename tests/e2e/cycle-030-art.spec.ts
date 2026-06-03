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

  // a species without art yet falls back gracefully to a flat shape (no crash, no art key)
  const moss = await page.evaluate(() => ((window as W).__dinoArt as (n: string) => Art)('Mossback'));
  expect(moss!.artKey).toBeNull();
  expect(moss!.animating).toBe(false);
});
