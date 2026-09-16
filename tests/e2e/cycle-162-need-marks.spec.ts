import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';
import { NEED_ART_KEY, NEED_GLYPH } from '../../game/src/world/needs';
import { PROP_RIGS } from '../../game/src/art/propArt';

type W = Record<string, unknown>;
type MarkKind = { kind: 'image'; texture: string } | { kind: 'text'; text: string } | null;

const marks = (p: Page) => p.evaluate(() => ((window as W).__marks as () => Record<string, string[]>)());
const markKind = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__markKind as (a: string, b: string) => MarkKind)(n, 'need'), name);
const setNeed = (p: Page, name: string, which: 'hunger' | 'thirst', v: number) =>
  p.evaluate(
    ([n, w, val]) =>
      ((window as W).__setNeed as (a: string, b: string, c: number) => unknown)(n as string, w as string, val as number),
    [name, which, v] as const,
  );

/** Both rigs, or neither — the scene's own rule, so the spec asks the same question the scene asks. */
const needsDrawn = !!PROP_RIGS[NEED_ART_KEY.hunger] && !!PROP_RIGS[NEED_ART_KEY.thirst];

/**
 * BACKLOG-551 — the two marks that were not in the mark family.
 *
 * Every floating mark in this park is built by `makeHourMark`, which swaps a glyph for a drawn rig the
 * moment one exists. The need tells (371) were raw `Text` with no rig lookup at all, so no rig could ever
 * be shown over a hungry dino — which is why BACKLOG-550 was seeded blocked and the Artist no-op'd twice.
 *
 * These specs are written to pass **either way**, on purpose: before the rigs are drawn they pin that
 * nothing about 371 changed, and after they are drawn they pin that the host actually hosts. A spec that
 * only works in one of those two states cannot prove the degradation the design promised.
 */
test('the need tell is still the 371 mark — shown by pressing need, hidden without one', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  await setNeed(page, 'Rex', 'hunger', 0);
  await setNeed(page, 'Rex', 'thirst', 0);
  expect((await marks(page)).Rex, 'a dino that wants nothing wears nothing').not.toContain('need');

  await setNeed(page, 'Rex', 'hunger', 1);
  expect((await marks(page)).Rex).toContain('need');
});

test('hunger and thirst reach the mark by the same route, and it degrades to the glyph', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  await setNeed(page, 'Rex', 'hunger', 1);
  await setNeed(page, 'Rex', 'thirst', 0);
  const hungry = await markKind(page, 'Rex');
  await setNeed(page, 'Rex', 'hunger', 0);
  await setNeed(page, 'Rex', 'thirst', 1);
  const thirsty = await markKind(page, 'Rex');

  if (needsDrawn) {
    // The `missed` / `missed_aloof` swap: one sprite, two keys, chosen by the condition.
    expect(hungry).toEqual({ kind: 'image', texture: expect.any(String) });
    expect(thirsty).toEqual({ kind: 'image', texture: expect.any(String) });
    expect((hungry as { texture: string }).texture).not.toBe((thirsty as { texture: string }).texture);
  } else {
    // Undrawn, it is byte-for-byte the 371 behaviour, which is what makes this host safe to land early.
    expect(hungry).toEqual({ kind: 'text', text: NEED_GLYPH.hunger });
    expect(thirsty).toEqual({ kind: 'text', text: NEED_GLYPH.thirst });
  }
});
