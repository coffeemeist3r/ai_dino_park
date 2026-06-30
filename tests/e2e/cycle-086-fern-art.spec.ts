import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Fern scrub tile renders (BACKLOG-399 / cycle 086-art). The Fernreach's new `fern` ground kind is now a
 * real pixel rig, so the pixel pipeline reports it drawn — while a genuinely undrawn kind still falls back
 * (the rectangle-fallback control holds).
 */

type W = Record<string, any>;
const hasTileArt = (p: Page, name: string) => p.evaluate((n) => (window as W).__hasTileArt(n) as boolean, name);

test('the fern scrub tile is drawn; an undrawn ground kind still falls back', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await hasTileArt(page, 'fern')).toBe(true);
  expect(await hasTileArt(page, 'grass')).toBe(true);
  expect(await hasTileArt(page, 'lava')).toBe(false); // the fallback control: a never-drawn kind stays false
  expect(errors).toEqual([]);
});
