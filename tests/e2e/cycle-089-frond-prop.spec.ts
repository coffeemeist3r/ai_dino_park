import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Frond pixel prop (BACKLOG-419). The Fernreach's frond (400) now bakes to a pixel sprite like branch/stone,
 * while a kind with no rig still falls back to the emoji glyph (the fallback control the art policy protects).
 */

type W = Record<string, any>;

test('a spawned frond renders as a baked pixel prop; an undrawn kind falls back', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await page.evaluate(() => (window as W).__hasPropArt('frond'))).toBe(true);
  // Fallback control: a key with no rig must still report false (the rectangle/emoji fallback holds).
  // BACKLOG-508: this used to name `'obsidian'` — a plausible thing nobody had drawn — and cycle 142 made
  // obsidian real and then drew it. The control now names something nothing can ever claim.
  expect(await page.evaluate(() => (window as W).__hasPropArt('__no_such_prop__'))).toBe(false);

  await page.evaluate(() => (window as W).__spawnResource('frond', 9, 7));
  expect(await page.evaluate(() => (window as W).__resource())).not.toBeNull();
  expect(await page.evaluate(() => (window as W).__resourceIsArt())).toBe(true);

  expect(errors).toEqual([]);
});
