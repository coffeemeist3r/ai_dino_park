import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * In-character homecoming (BACKLOG-306). The welcome-back beat now leads with the homecomer's signature
 * idle quirk (the same `fidget()` label the book + the live above-head glyph use), so even the greeting
 * is unmistakably *that* dino.
 */

type W = Record<string, any>;
const DAY_MS = 24 * 60 * 60_000; // one in-game day of real time at 1×

test('the welcome-back line performs the homecomer signature quirk (BACKLOG-306)', async ({ page }) => {
  await boot(page);

  // Make Sunny the clear favorite so it's the homecomer.
  await page.evaluate(() => {
    const greet = (window as W).__greet as (n: string) => number;
    for (let i = 0; i < 4; i++) greet('Sunny');
  });

  const result = await page.evaluate((ms) => (window as W).__catchUp(ms), 2 * DAY_MS);
  expect(result.homecoming?.name).toBe('Sunny');

  // The line carries Sunny's exact signature quirk label, the name, and the 👋.
  const quirk = await page.evaluate(() => ((window as W).__fidget('Sunny') as { label: string }).label);
  expect(result.homecoming.line).toContain(quirk);
  expect(result.homecoming.line).toContain('Sunny');
  expect(result.homecoming.line).toContain('👋');
  // the quirk leads, before the spoken 👋 line
  expect(result.homecoming.line.indexOf(quirk)).toBeLessThan(result.homecoming.line.indexOf('👋'));
});
