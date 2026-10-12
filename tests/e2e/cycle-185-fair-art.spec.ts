import { test, expect } from '@playwright/test';
import { boot, foundingState } from './helpers';

/** BACKLOG-601 — the fair basket is a drawn rig. */

type W = Record<string, unknown>;

test('the fair basket ships as pixel art (BACKLOG-601)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  expect(await page.evaluate(() => ((window as W).__hasPropArt as (k: string) => boolean)('festival-fair'))).toBe(true);
});
