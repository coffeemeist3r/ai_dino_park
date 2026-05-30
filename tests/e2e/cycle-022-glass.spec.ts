import { test, expect } from '@playwright/test';

type W = Record<string, unknown>;

test('the vivarium glass is present and the world still runs inside it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto('/');
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });

  // The glass drew and reports the bowl dimensions.
  const glass = await page.evaluate(() => ((window as W).__glass as () => { width: number; height: number; radius: number })());
  expect(glass.width).toBe(640);
  expect(glass.height).toBe(480);
  expect(glass.radius).toBeGreaterThan(0);

  // The sim is unaffected — dinos still move inside the bowl.
  const moved = await page.evaluate(() => {
    const before = ((window as W).__dinoPositions as () => Array<{ x: number; y: number }>)();
    ((window as W).__stepWorld as () => unknown)();
    const after = ((window as W).__dinoPositions as () => Array<{ x: number; y: number }>)();
    return before.some((p, i) => p.x !== after[i].x || p.y !== after[i].y);
  });
  expect(moved).toBe(true);
  expect(errors).toEqual([]);
});
