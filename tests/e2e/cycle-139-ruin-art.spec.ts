import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * The last two ruin rigs (BACKLOG-494, 4 of 4). The thatch and the granary were the two landmarks still
 * wearing 480's alpha fade, which reads as fog rather than ruin. Both now resolve in the production bundle,
 * so `WorldScene`'s existing `hasPropArt(`${prop}_derelict`)` swap — one generic line, no per-landmark
 * wiring — picks them up with nothing added.
 *
 * The per-landmark **fallback control** moves rather than retiring: a name with no ruin rig must still
 * report false, so "a landmark with no fallen twin keeps the fade" stays an exercised path rather than a
 * claim the code makes about itself.
 */

type W = Record<string, any>;

test('all four landmarks resolve a fallen twin; a name without one still reports false', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  for (const name of ['cairn_derelict', 'shelter_derelict', 'thatch_derelict', 'granary_derelict']) {
    expect(await page.evaluate((n) => (window as W).__hasPropArt(n), name)).toBe(true);
  }

  // The control: nothing has drawn a fallen plot, so the alpha fade is still the answer for one.
  expect(await page.evaluate(() => (window as W).__hasPropArt('plot_derelict'))).toBe(false);

  expect(errors).toEqual([]);
});
