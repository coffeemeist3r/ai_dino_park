import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Quirk shaded by feeling (BACKLOG-310). The signature idle fidget (298) reads a dino's transient
 * mood: a sulk swaps the glyph to 😒, a cold funk adds a shiver clause. No mood → the plain signature.
 * Exercised through the real scene build via the __moodFidget hook (mirrors __fidget).
 */

type W = Record<string, any>;

test('the idle fidget reads the dino\'s mood', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const name = await page.evaluate(() => (window as W).__dinoPositions()[0].name as string);

  const sig = await page.evaluate((n) => (window as W).__fidget(n), name);
  const calm = await page.evaluate((n) => (window as W).__moodFidget(n), name);
  expect(calm).toEqual(sig); // no mood → signature

  const sulk = await page.evaluate((n) => (window as W).__moodFidget(n, 'sulk'), name);
  expect(sulk.glyph).toBe('😒');
  expect(sulk.label.endsWith(', sulking')).toBe(true);
  expect(sulk.label.startsWith(sig.label)).toBe(true);

  const cold = await page.evaluate((n) => (window as W).__moodFidget(n, 'cold'), name);
  expect(cold.glyph).toBe(sig.glyph); // 🥶 floats on its own mark — no double glyph
  expect(cold.label.endsWith(', shivering')).toBe(true);

  expect(errors).toEqual([]);
});
