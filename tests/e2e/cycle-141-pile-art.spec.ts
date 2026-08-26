import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The bank's heap, drawn (BACKLOG-506, for BACKLOG-504). 504 shipped the placement and the step function
 * this same cycle, on the stone-glyph fallback; these are the pixels it was placing.
 *
 * The e2e half that matters is not "the rig exists" — the unit spec covers that — but that the **swap**
 * works: `syncBank` drops and re-creates its sprite when a step crosses between the glyph fallback and a
 * baked rig, which is the guard against a half-drawn rig set calling `setTexture` on a `Text`. With `pile_1`
 * through `pile_3` drawn and step 0 deliberately undrawn, every boot now crosses that seam the first time a
 * ground banks anything, so it is exercised rather than dormant.
 */

type W = Record<string, any>;

const bank = (p: Page, z?: string) =>
  p.evaluate((zz) => (window as W).__bank(zz) as { step: number; visible: boolean }, z);
const setPile = (p: Page, z: string, pile: Record<string, number>) =>
  p.evaluate(([zz, pp]) => (window as W).__setZonePile(zz, pp), [z, pile] as [string, Record<string, number>]);

test('every step the bank can be in resolves a rig, and the empty ground deliberately does not', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  for (const key of ['pile_1', 'pile_2', 'pile_3']) {
    expect(await page.evaluate((k) => (window as W).__hasPropArt(k), key), key).toBe(true);
  }
  // The control: step 0 is bare ground, not a picture of bare ground.
  expect(await page.evaluate(() => (window as W).__hasPropArt('pile_0'))).toBe(false);

  expect(errors).toEqual([]);
});

test('the heap survives being walked up and down through every step', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // 0 → 1 crosses the glyph/rig seam, then 1 → 2 → 3 swap textures, then 3 → 0 crosses back.
  for (const [pile, step] of [
    [{}, 0],
    [{ stone: 1 }, 1],
    [{ stone: 2 }, 2],
    [{ stone: 4 }, 3],
    [{}, 0],
  ] as [Record<string, number>, number][]) {
    await setPile(page, 'bowl', pile);
    const b = await bank(page, 'bowl');
    expect(b.step).toBe(step);
    expect(b.visible).toBe(step > 0);
  }

  expect(errors).toEqual([]);
});
