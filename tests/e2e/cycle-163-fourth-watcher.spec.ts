import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * BACKLOG-212 — the roster's fourth seat, and whether a player can actually sit in it.
 *
 * The picker body has always been data-driven over KEEPERS, so a fourth row *renders* for free. What did
 * not exist was any way to choose it: the keyboard bound ONE/TWO/THREE and the touch chip row was the
 * literal `['◀','1','2','3','✕']`. These specs are pointed at the selection, not the roster — a roster
 * entry listed on screen and selectable by nobody is the defect this item was scoped around.
 */

type W = Window & Record<string, any>;

/**
 * The whole dialog, every page, with the word-wrap flattened.
 *
 * Two traps, both met the first time this spec ran. `__dialogPage().text` is the *visible* page — the
 * four-row picker chunks into more than one, so an assertion against it silently tested row 1 alone. And
 * Phaser's wrap inserts its own break mid-phrase, so `toContain('a hundred million years downstream')`
 * fails on a string that plainly contains it. Normalize both and assert on the message the player reads.
 */
const dialogText = async (page: import('@playwright/test').Page) => {
  const raw = await page.evaluate(() => (window as W).__dialogAllText() as string);
  return raw.replace(/·/g, '').replace(/\s+/g, ' ');
};

test('the picker lists a fourth watcher that is not a machine', async ({ page }) => {
  await boot(page);

  expect(await page.evaluate(() => (window as W).__openKeeperPicker())).toBe(true);
  const text = await dialogText(page);
  expect(text).toContain('Kestrel of the Ninth Quiet');
  expect(text).toContain('Quiet Company');
  expect(text).toContain('[4]');
});

test('pressing 4 at the open picker selects it, and the choice survives a reload', async ({ page }) => {
  await boot(page);

  await page.evaluate(() => (window as W).__openKeeperPicker());
  await page.keyboard.press('Digit4');

  expect(await page.evaluate(() => (window as W).__keeper())).toBe('kestrel');
  // The confirm dialog is the player's only feedback that the key landed.
  expect(await dialogText(page)).toContain('a hundred million years downstream');

  await page.reload();
  await boot(page);
  expect(await page.evaluate(() => (window as W).__keeper())).toBe('kestrel');
});

test('4 with no picker open is a no-op, not an undefined tone', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await boot(page);

  const before = await page.evaluate(() => (window as W).__keeper());
  await page.keyboard.press('Digit4');
  expect(await page.evaluate(() => (window as W).__keeper())).toBe(before);
  expect(errors).toEqual([]);
});

test('the fourth watcher is sprite-backed, and the fallback control is undisturbed', async ({ page }) => {
  await boot(page);

  await page.evaluate(() => (window as W).__pickKeeper('kestrel'));
  expect(await page.evaluate(() => (window as W).__keeper())).toBe('kestrel');
  // Shipped on the amber square this morning (as the robot roster did at cycle 37) and drawn the same
  // night by BACKLOG-554 — the host `renderKeeperAvatar` had been live since cycle 047-art and was only
  // ever missing a fourth id, which this cycle's structure track supplied.
  expect(await page.evaluate(() => (window as W).__hasKeeperArt('kestrel'))).toBe(true);
  expect(await page.evaluate(() => (window as W).__keeperArt())).toBe('keeper_kestrel_walk');
  // And the control is still a genuine no-art id, not a roster entry pressed into service as one.
  expect(await page.evaluate(() => (window as W).__hasKeeperArt('vex-0'))).toBe(false);
  expect(await page.evaluate(() => (window as W).__hasKeeperArt('aether'))).toBe(true);
});

test('the chip row carries a [4] for the picker and not for the tone menu', async ({ page }) => {
  await boot(page);

  // The chip objects are built once for the widest overlay — that set is fixed and includes pick4.
  const chips = await page.evaluate(() => (window as W).__touchLayout().chips.map((c: any) => c.id));
  expect(chips).toEqual(['back', 'pick1', 'pick2', 'pick3', 'pick4', 'close']);

  // What changes per overlay is how many of them are LIVE. This is the assertion that would fail if the
  // old boolean had simply been widened to four: the tone menu would have grown a dead [4].
  expect(await page.evaluate(() => (window as W).__numberedOptions())).toBe(0);

  await page.evaluate(() => (window as W).__openKeeperPicker());
  expect(await page.evaluate(() => (window as W).__numberedOptions())).toBe(4);
  await page.keyboard.press('Escape');

  const dino = await page.evaluate(() => (window as W).__dinoNames()[0]);
  await page.evaluate((n) => (window as W).__openToneMenu(n), dino);
  expect(await page.evaluate(() => (window as W).__toneMenuOpen())).toBe(true);
  expect(await page.evaluate(() => (window as W).__numberedOptions())).toBe(3);
});
