import { test, expect } from '@playwright/test';
import { boot, foundingState } from './helpers';

/** BACKLOG-572 — the hug is a drawn rig in the shipping bundle, so `popComfortMark` bakes an image, not the glyph. */

type W = Record<string, unknown>;

test('the comfort mark ships as pixel art (BACKLOG-572)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  expect(await page.evaluate(() => ((window as W).__hasPropArt as (k: string) => boolean)('comfort'))).toBe(true);
});
