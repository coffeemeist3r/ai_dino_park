import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * The founder's stake and its hollowed twin (BACKLOG-513 / 514) — a stash-ahead pair.
 *
 * Nothing plants these in the world yet: BACKLOG-512 recorded who founded each ground tonight, and the
 * tile that stands a marker on it is a later item. The cycle-91 stash rule allows exactly this — a rig may
 * be authored ahead of its host **when it renders standalone** — so the assertion is that rule's own
 * condition, plus the control that keeps the draw-a-rig-or-draw-nothing fallback live.
 */

type W = Record<string, any>;

test('both stake rigs resolve standalone; the fallback control holds', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await page.evaluate(() => (window as W).__hasPropArt('founder_stake'))).toBe(true);
  expect(await page.evaluate(() => (window as W).__hasPropArt('founder_stake_hollowed'))).toBe(true);
  // A key with no rig must still report false — the emoji/rectangle fallback is the shipping path for
  // anything a later cycle adds without art. NO_RIG_CONTROL is the name nothing can ever claim.
  expect(await page.evaluate(() => (window as W).__hasPropArt('__no_such_prop__'))).toBe(false);

  expect(errors).toEqual([]);
});
