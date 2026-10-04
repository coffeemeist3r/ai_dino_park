import { test, expect } from '@playwright/test';
import { boot, foundingState } from './helpers';

/** BACKLOG-580 — the regret bead is a drawn rig in the shipping bundle, so its pop bakes an image, not a glyph. */

type W = Record<string, unknown>;

test('the regret bead ships as pixel art', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  expect(await page.evaluate(() => ((window as W).__hasPropArt as (k: string) => boolean)('regret'))).toBe(true);
});
