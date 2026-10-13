import { test, expect } from '@playwright/test';
import { boot, foundingState } from './helpers';

/** BACKLOG-598 — all four rite marks are drawn rigs (spring/summer 184-art, fall/winter 186-art), so the rite mark bakes an image. */

type W = Record<string, unknown>;

test('the four festival marks ship as pixel art (BACKLOG-598)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  for (const k of ['festival-spring', 'festival-summer', 'festival-fall', 'festival-winter']) {
    expect(await page.evaluate((key) => ((window as W).__hasPropArt as (k: string) => boolean)(key), k), k).toBe(true);
  }
});
