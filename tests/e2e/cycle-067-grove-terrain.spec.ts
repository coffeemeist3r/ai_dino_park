import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Grove terrain (BACKLOG-294). The bowl floor is the untinted grass; crossing into the grove swaps the
 * floor to its own terrain bake under a cool tint, so the second zone reads as a different place. The
 * path/water pixel rigs are the Artist's (033); this asserts the swap + tint, not pixel colours, so it
 * stays green whether or not those rigs exist yet.
 */

type W = Record<string, any>;
const floor = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__floorInfo() as { zone: string; key: string | null; tinted: boolean });

test('the floor swaps to a distinct tinted grove terrain and back', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const bowl = await floor(page);
  expect(bowl.zone).toBe('bowl');
  expect(bowl.tinted).toBe(false);
  expect(bowl.key).toContain('grass'); // the untinted bowl grass

  await page.evaluate(() => (window as W).__setZone('grove'));
  const grove = await floor(page);
  expect(grove.zone).toBe('grove');
  expect(grove.tinted).toBe(true);
  expect(grove.key).toContain('terrain_grove'); // the grove's own terrain bake

  // back to the bowl: untinted grass restored.
  await page.evaluate(() => (window as W).__setZone('bowl'));
  const back = await floor(page);
  expect(back.tinted).toBe(false);
  expect(back.key).toContain('grass');

  expect(errors).toEqual([]);
});
