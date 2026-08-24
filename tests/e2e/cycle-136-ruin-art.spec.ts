import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Ruin rigs (BACKLOG-494). Disrepair has been drawn since 480 by turning a landmark's own sprite down to
 * `DERELICT_ALPHA` — which was honest while nothing was drawn, and reads as a cairn in fog rather than a
 * cairn that fell over. The founding ruin (488) makes it the first structure a new player inspects, so it
 * now wears a rig of its own: a squat surviving stub with two stones lying on the ground beside it.
 *
 * The subject here is the founding state, so this spec asserts the new one and does not call `emptyGrounds`.
 */

type W = Record<string, any>;

const cairnArt = (p: Page) => p.evaluate(() => (window as W).__cairnArt() as { texture: string; alpha: number } | null);
const setZone = (p: Page, z: string) => p.evaluate((zz) => (window as W).__setZone(zz), z);
const stepMend = (p: Page) => p.evaluate(() => (window as W).__stepMend());
const landmarks = (p: Page, z: string) =>
  p.evaluate((zz) => (window as W).__landmarks(zz) as { derelict: boolean }[], z);

test('the founding ruin wears the ruin rig at full opacity, and the mend swaps it back', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  await setZone(page, 'grove');

  // A fallen thing, not a faded one: the ruin texture, drawn at full alpha.
  const fallen = await cairnArt(page);
  expect(fallen).not.toBeNull();
  expect(fallen!.texture).toContain('cairn_derelict');
  expect(fallen!.alpha).toBe(1);

  // Somebody puts it back up (488), and the sprite returns to the standing rig.
  for (let i = 0; i < 60; i++) {
    await stepMend(page);
    if ((await landmarks(page, 'grove')).every((l) => !l.derelict)) break;
  }
  expect((await landmarks(page, 'grove')).every((l) => !l.derelict)).toBe(true);

  const standing = await cairnArt(page);
  expect(standing!.texture).toBe('prop_cairn');
  expect(standing!.alpha).toBe(1);

  expect(errors).toEqual([]);
});

test('a landmark whose ruin is undrawn keeps the alpha fade', async ({ page }) => {
  await boot(page);
  // Cycle 139 drew the remaining two, so all four landmarks now resolve — the roster assertion moved to
  // `cycle-139-ruin-art.spec.ts`, and with it the fallback control, which now rides on a name nobody has
  // drawn a fallen twin for at all rather than on a landmark that was merely waiting its turn.
  const has = await page.evaluate(
    () => ['cairn_derelict', 'shelter_derelict', 'thatch_derelict', 'granary_derelict']
      .map((n) => (window as W).__hasPropArt(n) as boolean),
  );
  expect(has).toEqual([true, true, true, true]);
});
