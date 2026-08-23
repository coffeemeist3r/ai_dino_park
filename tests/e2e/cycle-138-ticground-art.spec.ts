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

test('the scuff and the ring resolve standalone; the undrawn kind still reports false', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await page.evaluate(() => (window as W).__hasPropArt('tic_pace'))).toBe(true);
  expect(await page.evaluate(() => (window as W).__hasPropArt('tic_circle'))).toBe(true);
  expect(await page.evaluate(() => (window as W).__hasPropArt('tic_fuss'))).toBe(false);

  expect(errors).toEqual([]);
});
