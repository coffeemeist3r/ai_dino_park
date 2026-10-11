import { test, expect } from '@playwright/test';
import { boot, foundingState } from './helpers';

/** BACKLOG-598 — the spring wreath and summer sun pole are drawn rigs, so the rite mark bakes an image. */

type W = Record<string, unknown>;

test('the spring and summer festival marks ship as pixel art (BACKLOG-598)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  for (const k of ['festival-spring', 'festival-summer']) {
    expect(await page.evaluate((key) => ((window as W).__hasPropArt as (k: string) => boolean)(key), k), k).toBe(true);
  }
  expect(await page.evaluate(() => ((window as W).__hasPropArt as (k: string) => boolean)('festival-winter'))).toBe(false);
});
