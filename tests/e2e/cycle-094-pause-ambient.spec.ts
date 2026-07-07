import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Pause ambient timers in e2e (BACKLOG-431). The shared boot() freezes the wall-clock background timers
 * (wander/sky/migration rolls) so 300+ parallel specs can't race the ambient world tick. Explicit stepping
 * still works; resume re-arms the timers. This is the root fix for the "Expected 1 Received 0" flake class.
 */

type W = Record<string, any>;
const positions = (p: Page) => p.evaluate(() => (window as W).__dinoPositions() as { name: string; x: number; y: number }[]);
const paused = (p: Page) => p.evaluate(() => (window as W).__ambientPaused() as boolean);

test('boot() pauses ambient — the world holds still without an explicit step', async ({ page }) => {
  await boot(page);
  expect(await paused(page)).toBe(true);

  const before = await positions(page);
  // WANDER_STEP_MS is 3000ms; wait past one full tick window. Paused → the callback no-ops → nobody moves.
  await page.waitForTimeout(3500);
  const after = await positions(page);
  expect(after).toEqual(before);
});

test('explicit stepping still advances the world while ambient is paused', async ({ page }) => {
  await boot(page);
  const before = await positions(page);
  for (let i = 0; i < 6; i++) await page.evaluate(() => (window as W).__stepWorld());
  const after = await positions(page);
  const moved = before.some((b) => {
    const a = after.find((x) => x.name === b.name);
    return a && (a.x !== b.x || a.y !== b.y);
  });
  expect(moved).toBe(true);
});

test('__resumeAmbient re-arms the timers', async ({ page }) => {
  await boot(page);
  expect(await paused(page)).toBe(true);
  await page.evaluate(() => (window as W).__resumeAmbient());
  expect(await paused(page)).toBe(false);
});
