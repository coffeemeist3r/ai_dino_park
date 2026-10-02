import { test, expect } from '@playwright/test';
import { boot, foundingState } from './helpers';

/** BACKLOG-568 / 576 — both marks are drawn rigs in the shipping bundle, so their pops bake images, not glyphs. */

type W = Record<string, unknown>;

test('the friend-found sprig and the wait hourglass ship as pixel art', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const has = (k: string) => page.evaluate((kk) => ((window as W).__hasPropArt as (k: string) => boolean)(kk), k);
  expect(await has('friend_found')).toBe(true);
  expect(await has('wait')).toBe(true);
});
