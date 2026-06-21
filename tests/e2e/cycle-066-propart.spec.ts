import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Resource + cairn pixel props (BACKLOG-296). The gathering→craft objects render as baked pixel
 * sprites, not emoji glyphs. Drives headless: spawn a resource and craft a cairn via the existing
 * hooks, then assert the live sprite is the baked image (not the text fallback).
 */

type W = Record<string, any>;
const TILE = 32;

/** Drop a resource on the first dino and step so it banks immediately (mirrors cycle-064-craft). */
async function bankOne(page: import('@playwright/test').Page, kind: string) {
  const ds = await page.evaluate(() => (window as W).__dinoPositions() as { x: number; y: number }[]);
  const tx = Math.floor(ds[0].x / TILE);
  const ty = Math.floor(ds[0].y / TILE);
  await page.evaluate(({ kind, tx, ty }) => (window as W).__spawnResource(kind, tx, ty), { kind, tx, ty });
  await page.evaluate(() => (window as W).__stepWorld());
}

test('a spawned resource renders as a baked pixel prop, not the emoji glyph', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  for (const name of ['branch', 'stone', 'cairn']) {
    expect(await page.evaluate((n) => (window as W).__hasPropArt(n), name)).toBe(true);
  }

  await page.evaluate(() => (window as W).__spawnResource('branch', 9, 7));
  expect(await page.evaluate(() => (window as W).__resource())).not.toBeNull();
  expect(await page.evaluate(() => (window as W).__resourceIsArt())).toBe(true);

  expect(errors).toEqual([]);
});

test('a crafted cairn renders as a baked pixel prop', async ({ page }) => {
  await boot(page);
  for (const k of ['branch', 'branch', 'branch', 'stone', 'stone']) await bankOne(page, k);

  expect(await page.evaluate(() => (window as W).__cairns())).not.toHaveLength(0);
  expect(await page.evaluate(() => (window as W).__cairnIsArt())).toBe(true);
});
