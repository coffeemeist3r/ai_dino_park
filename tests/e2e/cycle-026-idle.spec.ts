import { test, expect } from '@playwright/test';
import { boot } from './helpers';

type W = Record<string, unknown>;

test('the bowl goes ambient when idle and snaps back on input', async ({ page }) => {
  await boot(page);

  // Fresh boot: fully interactive, HUD opaque.
  const start = await page.evaluate(() => ({
    alpha: ((window as W).__idleAlpha as () => number)(),
    ambient: ((window as W).__isAmbient as () => boolean)(),
  }));
  expect(start.alpha).toBe(1);
  expect(start.ambient).toBe(false);

  // Simulate a long still spell → HUD fades, ambient mode on.
  const idle = await page.evaluate(() => {
    ((window as W).__forceIdle as (ms: number) => number)(20_000);
    return {
      alpha: ((window as W).__idleAlpha as () => number)(),
      ambient: ((window as W).__isAmbient as () => boolean)(),
    };
  });
  expect(idle.alpha).toBeLessThan(0.5);
  expect(idle.ambient).toBe(true);

  // Any input snaps it back to full.
  const woke = await page.evaluate(() => {
    ((window as W).__nudgeInput as () => number)();
    return {
      alpha: ((window as W).__idleAlpha as () => number)(),
      ambient: ((window as W).__isAmbient as () => boolean)(),
    };
  });
  expect(woke.alpha).toBe(1);
  expect(woke.ambient).toBe(false);
});

test('a real key press also wakes the bowl from ambient', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => ((window as W).__forceIdle as (ms: number) => number)(20_000));
  expect(await page.evaluate(() => ((window as W).__isAmbient as () => boolean)())).toBe(true);

  await page.locator('canvas').focus();
  await page.keyboard.press('KeyW');
  await page.waitForTimeout(80);
  expect(await page.evaluate(() => ((window as W).__isAmbient as () => boolean)())).toBe(false);
});
