import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Frond thatch rig (BACKLOG-427) — the first stash-ahead. The rig is registered and bakeable ahead
 * of the 417 structure that will place it in the world; nothing spawns it yet, so the assertion is
 * exactly the stash-ahead rule's condition: it resolves standalone, and the no-art fallback control
 * still holds for a kind nobody drew.
 */

type W = Record<string, any>;

test('the stashed thatch rig resolves standalone; the fallback control holds', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await page.evaluate(() => (window as W).__hasPropArt('thatch'))).toBe(true);
  // Fallback control: a key with no rig must still report false (the rectangle/emoji fallback holds).
  // BACKLOG-508: was `'obsidian'`, which cycle 142 turned into a real drawn prop. See NO_RIG_CONTROL.
  expect(await page.evaluate(() => (window as W).__hasPropArt('__no_such_prop__'))).toBe(false);

  expect(errors).toEqual([]);
});
