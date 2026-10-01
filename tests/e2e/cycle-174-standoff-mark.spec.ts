import { test, expect } from '@playwright/test';
import { boot, foundingState } from './helpers';

/** BACKLOG-575 — the bristle is a drawn rig in the shipping bundle, so `squareOffPair` bakes an image, not the glyph. */

type W = Record<string, unknown>;

test('the standoff mark ships as pixel art (BACKLOG-575)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  expect(await page.evaluate(() => ((window as W).__hasPropArt as (k: string) => boolean)('standoff'))).toBe(true);
});
