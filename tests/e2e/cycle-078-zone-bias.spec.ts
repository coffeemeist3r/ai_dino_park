import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Zone resource bias (BACKLOG-348). Each zone leans its resource roll toward its own character — the
 * grove's trees drop branches, the bowl's open ground turns up stones — so the two zone economies (328)
 * gather different things. A lean, not a lock: the off-kind still rolls past the bias weight. The
 * `__biasKind(zone, r)` hook drives the production bundle's `pickKind` with a seeded value.
 */

type W = Record<string, any>;
const bias = (p: Page, zone: string, r: number) => p.evaluate(([z, x]) => (window as W).__biasKind(z, x), [zone, r] as const);

test('the grove leans branch and the bowl leans stone, but the off-kind still appears', async ({ page }) => {
  await boot(page);

  // Below the bias weight → each zone rolls its favored kind.
  expect(await bias(page, 'grove', 0.1)).toBe('branch');
  expect(await bias(page, 'bowl', 0.1)).toBe('stone');

  // Past the bias weight → the off-kind still turns up (a lean, not a lock).
  expect(await bias(page, 'grove', 0.9)).toBe('stone');
  expect(await bias(page, 'bowl', 0.9)).toBe('branch');
});
