import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';
import { MOPE_ART_KEY, MOPE_GLYPH } from '../../game/src/world/loner';

type W = Record<string, unknown>;
type MarkKind = { kind: 'image'; texture: string } | { kind: 'text'; text: string } | null;

const marks = (p: Page) => p.evaluate(() => ((window as W).__marks as () => Record<string, string[]>)());
const markKind = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__markKind as (a: string, b: string) => MarkKind)(n, 'mope'), name);
const hasRig = (p: Page, n: string) =>
  p.evaluate((nn) => ((window as W).__hasPropArt as (k: string) => boolean)(nn), n);

/**
 * BACKLOG-556 — the loner's wilt, drawn, and its host proven to host.
 *
 * The mark is the one un-drawn thing in this park that is on screen *five times over* on a fresh save:
 * every founding dino is friendless by construction, so the bowl opens with the whole cast wearing it.
 * Its host shipped on the main chain the same cycle the item was seeded (the cycle-154 / BACKLOG-530
 * precedent), which is why this spec can exist at all — before that, `mopeMarks` was a bare `Text` with
 * no rig lookup and no rig could have been shown there.
 */
test('the founding park wears the wilt, and it is a drawn rig', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  // This spec's subject IS the founding state: five dinos, no bonds, therefore five loners.
  await foundingState(page, 'as-shipped');

  expect(await hasRig(page, MOPE_ART_KEY)).toBe(true);

  const worn = Object.values(await marks(page)).filter((m) => m.includes('mope'));
  expect(worn.length).toBeGreaterThan(0);

  const kind = await markKind(page, 'Rex');
  expect(kind).toEqual({ kind: 'image', texture: expect.any(String) });
  expect(errors).toEqual([]);
});

// The control the cycle-142 lesson protects: the swap is a swap, not a rename. A key with no rig must
// still come back false, or `makeHourMark`'s fallback has stopped being exercised anywhere.
test('the fallback path is still a path — an undrawn key reports no rig', async ({ page }) => {
  await boot(page);
  expect(await hasRig(page, '__no_such_prop__')).toBe(false);
  expect(MOPE_GLYPH.length).toBeGreaterThan(0); // the glyph stays, as the fallback's text
});
