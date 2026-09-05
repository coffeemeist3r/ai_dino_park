import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * The beacon that went out (BACKLOG-532) — the fifth landmark's ruin, and the last one missing.
 *
 * Cycle 139 closed the ruin family at four of five and left the beacon behind, so a derelict beacon was the
 * lit rig at `DERELICT_ALPHA`. On the Ridge — a ground made of black glass — dim reads as *night*, which is
 * the wrong sentence and was the only landmark in the park telling it.
 *
 * The wiring is unchanged and that is the point: `showLandmarks(this.beaconSprites, this.beacons, 'beacon')`
 * has routed through `bakeRuinArt` since BACKLOG-503 and only fell back to alpha because the key was
 * absent. Drawing the rig *is* the wiring, which is why this spec asserts resolution rather than plumbing.
 */

type W = Record<string, any>;

test('all five landmarks resolve a fallen twin; a name without one still reports false', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  for (const name of [
    'cairn_derelict',
    'shelter_derelict',
    'thatch_derelict',
    'granary_derelict',
    'beacon_derelict',
  ]) {
    expect(await page.evaluate((n) => (window as W).__hasPropArt(n), name), name).toBe(true);
  }

  // The fallback control stays exercised, exactly as cycle 139 left it: nothing has drawn a fallen plot,
  // so "a landmark with no fallen twin keeps the fade" is still a path and not a claim the code makes
  // about itself.
  expect(await page.evaluate(() => (window as W).__hasPropArt('plot_derelict'))).toBe(false);

  expect(errors).toEqual([]);
});
