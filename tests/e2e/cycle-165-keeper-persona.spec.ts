import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

type W = Record<string, unknown>;
type Persona = { text: string; source: string } | null;

/**
 * BACKLOG-156 — the watcher's self, where a player reads it.
 *
 * The item's finding: `Keeper.backstory` had existed since cycle 155 with **no render site anywhere in
 * the game**, so these assertions are about the dialog first and the cache second. A persona that lives
 * only in `__keeperPersona()` is the groundwork CHARTER v7 calls a REWORK.
 *
 * Driven through the keyboard — `K`, then a digit — rather than through `__pickKeeper`, because the
 * claim being made is about what a player sees after pressing two keys on a fresh save. The hook path is
 * covered by cycle-037's spec and is the wrong instrument for a reachability assertion.
 *
 * This spec declares its founding state because the **structure track of this same cycle** shipped the
 * rule requiring it (BACKLOG-533). A new spec exempting itself from the rule its own cycle wrote would
 * be that item failing on its first night.
 */

/**
 * The dialog's text with the box's own word-wrap undone.
 *
 * `DialogBox` wraps to the frame and marks a continued line, so the rendered string carries newlines and
 * separators the caller never wrote. A spec asserting on line indices would be asserting about the frame
 * width — which is why the wrap is normalised away here and the claims below are about *content*.
 */
const dialogText = async (page: Page): Promise<string> => {
  const raw = await page.evaluate(() => ((window as W).__dialogAllText as () => string)());
  return raw.replace(/·/g, ' ').replace(/\s+/g, ' ').trim();
};

const persona = (page: Page): Promise<Persona> =>
  page.evaluate(() => ((window as W).__keeperPersona as () => Persona)());

const pickerOpen = (page: Page): Promise<boolean> =>
  page.evaluate(() => ((window as W).__keeperPickerOpen as () => boolean)());

/** Open the picker and commit to observer `n` (1-based), the way a player does. */
async function pickObserver(page: Page, n: number): Promise<string> {
  await page.locator('canvas').focus();
  await page.keyboard.press('KeyK');
  await expect.poll(() => pickerOpen(page)).toBe(true);
  await page.keyboard.press(`Digit${n}`);
  await expect.poll(() => pickerOpen(page)).toBe(false);
  return dialogText(page);
}

test('committing to an observer introduces who it is, not just what it does (BACKLOG-156)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  const shown = await pickObserver(page, 1);
  expect(shown).toContain('AETHER-1');
  expect(shown).toContain('Empath Protocol');

  // The self: everything after the ability line. Non-empty, and materially longer than a label — the
  // whole point is that it reads as a paragraph about somebody rather than as one more stat.
  const tail = 'warm to you faster.';
  const self = shown.slice(shown.indexOf(tail) + tail.length);
  expect(self.trim().length).toBeGreaterThan(40);
  // The hand-written roster line survives into it verbatim: the author elaborates the authored sentence
  // rather than replacing it, which is what keeps the four watchers from converging.
  expect(self).toContain('Quiet Accord');
});

test('a different observer introduces a different self (BACKLOG-156)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  const first = await pickObserver(page, 1);
  await page.keyboard.press('KeyE'); // close the confirmation dialog
  const second = await pickObserver(page, 2);

  expect(second).not.toBe(first);
  expect(second).toContain('VANTA-9');
  // Not merely a different header: the *self* differs too, which is what "the park can tell which watcher
  // is standing there" has to mean for the milestone to be true. Asserted on the authored sentences
  // themselves rather than by slicing the wrapped string, so this is about the text and not the frame.
  expect(first).toContain('drifted back to watch creatures that never learned to argue');
  expect(second).toContain('a future that ended');
  expect(second).not.toContain('drifted back to watch creatures that never learned to argue');
});

test('the self is cached into the watcher record, and is what the dialog showed (BACKLOG-156/555)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  expect(await persona(page)).toBeNull(); // nothing authors it before a pick

  const shown = await pickObserver(page, 3);
  const cached = await persona(page);
  expect(cached).not.toBeNull();
  expect(cached!.text.length).toBeGreaterThan(0);
  // Compared through the same normalisation, because the box wraps a 240-character paragraph.
  expect(shown).toContain(cached!.text.replace(/\s+/g, ' ').trim());
  // Headless CI has no WebGPU, so the floor is what is cached here. Asserting the source pins the
  // graceful-degradation contract rather than an inference result this runner will never produce.
  expect(cached!.source).toBe('procedural');
});

test('switching watchers authors the incoming one, never the outgoing one (BACKLOG-156/555)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  await pickObserver(page, 1);
  const aki = (await persona(page))!.text;
  await page.keyboard.press('KeyE');

  await pickObserver(page, 4);
  const kes = (await persona(page))!.text;

  expect(kes).not.toBe(aki);
  // 555's `switchTo` drops the cache on the way past; this is that rule asserted end-to-end, now that
  // something actually writes the slot. Kes is a descendant, not a machine — its own line proves whose.
  expect(kes).toContain('descendant');
});
