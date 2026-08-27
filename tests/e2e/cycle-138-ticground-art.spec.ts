import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * The ritual's worn ground (BACKLOG-496, 2 of 3) — a stash-ahead under the cycle-91 rule: both marks
 * resolve standalone, and nothing in `WorldScene` lays one down yet.
 *
 * `fuss` is deliberately still undrawn, and that is the control: a `TicKind` with no rig must report false,
 * so the per-kind fallback 490 and 494 both ship stays exercised rather than becoming a claim the code makes
 * about itself.
 */

type W = Record<string, any>;

test('all three worn-ground rigs resolve standalone; the fallback control still reports false', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await page.evaluate(() => (window as W).__hasPropArt('tic_pace'))).toBe(true);
  expect(await page.evaluate(() => (window as W).__hasPropArt('tic_circle'))).toBe(true);
  // BACKLOG-496 closed cycle 142-art: all three ritual kinds are drawn now, so `tic_fuss` is no longer
  // the control. The branch it guarded is still live and still needs one, so it names the key nothing
  // can claim (NO_RIG_CONTROL) rather than the next plausible-sounding undrawn thing.
  expect(await page.evaluate(() => (window as W).__hasPropArt('tic_fuss'))).toBe(true);
  expect(await page.evaluate(() => (window as W).__hasPropArt('__no_such_prop__'))).toBe(false);

  expect(errors).toEqual([]);
});
