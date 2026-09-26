import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState, settle } from './helpers';

/**
 * BACKLOG-204 + BACKLOG-202 — a cry you can find, and a cry that is answered.
 *
 * The arithmetic is pinned by `game/src/world/cycle-169-distress.test.ts`; this walks the reachable
 * half. Before tonight every output of a distress call was local to the two dinos involved, so a
 * keeper looking at another corner of the ground learned nothing at all.
 *
 * Headless-safe by construction, like every audio spec since 191: the beat is recorded at the call
 * site in the scene, never read out of an AudioContext.
 */

type W = Record<string, unknown>;

const ticker = (p: Page) => p.evaluate(() => ((window as W).__ticker as () => string[])());
const lastCallback = (p: Page) =>
  p.evaluate(() => ((window as W).__lastCallback as () => { name: string; caller: string; bond: number; delayMs: number } | null)());
/**
 * Let the park be a park for a moment.
 *
 * `comforter()` has wanted a bond over `COMFORT_BOND_FLOOR` since cycle 33, and a park one frame old
 * has an empty bond graph — so this is not staging, it is the reachability demonstration: ordinary
 * meetings carry the founding cast over the floor inside the first minute of play, with nobody
 * touching a hook. (Measured: the first pair crosses well inside 40 steps.)
 */
const live = async (p: Page) => {
  for (let i = 0; i < 40; i++) await p.evaluate(() => ((window as W).__stepWorld as () => void)());
};
const cry = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__cryDistress as (x: string) => unknown)(n), name);
const isMuted = (p: Page) => p.evaluate(() => ((window as W).__soundMuted as () => boolean)());

test('a cry posts a ticker line naming the caller, and a friend answers it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await boot(page);
  await foundingState(page, 'as-shipped');
  await settle(page);
  await live(page);

  await cry(page, 'Rex');

  // 204: the keeper standing anywhere at all can now find the dino in trouble.
  const lines = await ticker(page);
  const call = lines.find((l) => l.includes('📢'));
  expect(call, `no distress line in ticker: ${JSON.stringify(lines)}`).toBeTruthy();
  expect(call).toContain('Rex');

  // 202: something answered, in its own voice, and it is not the dino that called.
  const back = await lastCallback(page);
  expect(back, 'nobody called back').not.toBeNull();
  expect(back!.caller).toBe('Rex');
  expect(back!.name).not.toBe('Rex');
  expect(back!.delayMs).toBeGreaterThan(0);

  expect(errors).toEqual([]);
});

test('the ticker line is posted on a silent device too', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await settle(page);
  await live(page);

  // The cry is diegetic: mute gates playback, not the event. A keeper who has turned the sound off
  // needs the written line more than one who has not, which is the whole point of 204.
  await page.locator('canvas').focus();
  await page.keyboard.press('KeyM');
  await settle(page);
  expect(await isMuted(page)).toBe(true);

  await cry(page, 'Rex');

  const lines = await ticker(page);
  expect(lines.some((l) => l.includes('📢') && l.includes('Rex'))).toBe(true);

  // ...and the beat is still recorded, so the friend still turns toward it.
  expect((await lastCallback(page))?.caller).toBe('Rex');

  // Leave the stored preference as we found it — mute persists across reloads (044).
  await page.keyboard.press('KeyM');
  await settle(page);
  expect(await isMuted(page)).toBe(false);
});
