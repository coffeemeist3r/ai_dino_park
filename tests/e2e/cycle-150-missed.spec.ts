import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Missed-you memory (BACKLOG-116) — five accounts of the same absence.
 *
 * The park has narrated an absence since cycle 29 and had exactly one dino react to it. These specs are
 * about the other four: that each forms its own account, that the account is *visible* before you talk to
 * anybody, and that the resident who formed none wears nothing — which is the read the whole item is for.
 *
 * Every name here is derived from a hook. The grades follow name-seeded traits, and a spec that listed
 * dinos would be asserting the roster rather than the feature.
 */
type W = Record<string, any>;

const catchUp = (p: Page, realMs: number) =>
  p.evaluate((ms) => (window as W).__catchUp(ms) as { minutes: number; missed: Record<string, string> }, realMs);
const missedYou = (p: Page) => p.evaluate(() => (window as W).__missedYou() as Record<string, string>);
const missedMarks = (p: Page) =>
  p.evaluate(
    () =>
      (window as W).__missedMarks() as Array<{
        name: string;
        visible: boolean;
        alpha: number;
        tex: string | null;
      }>,
  );
const memory = (p: Page, n: string) =>
  p.evaluate((nn) => ((window as W).__memory() as Record<string, string[]>)[nn] ?? [], n);
const stepWorld = (p: Page) => p.evaluate(() => (window as W).__stepWorld());
const pickTone = (p: Page, name: string) =>
  p.evaluate((n) => (window as W).__pickTone(n, 'warm') as Promise<string>, name);

const MINUTE = 60_000;

test.describe('missed-you memory (BACKLOG-116)', () => {
  test('the threshold has two sides', async ({ page }) => {
    await boot(page);
    await catchUp(page, 4 * MINUTE);
    expect(await missedYou(page)).toEqual({});

    const out = await catchUp(page, 5 * MINUTE);
    expect(Object.keys(out.missed).length).toBeGreaterThan(0);
    // The nuzzle (112) wants six in-game *hours*; this is a far commoner, far fainter beat, and the
    // relationship between the two thresholds is the reason this one is reachable at all.
    expect(out.minutes).toBeLessThan(6 * 60);
  });

  test('every account is its own, and somebody formed none', async ({ page }) => {
    await boot(page);
    const graded = (await catchUp(page, 5 * MINUTE)).missed;
    const cast = (await missedMarks(page)).map((m) => m.name);

    // Both grades are present in a fresh park, and so is the third — a resident absent from the map.
    expect(new Set(Object.values(graded)).size).toBe(2);
    const unmoved = cast.filter((n) => !(n in graded));
    expect(unmoved.length).toBeGreaterThan(0);

    // The words differ by grade, and the unmoved dino filed nothing at all.
    const missedName = Object.keys(graded).find((n) => graded[n] === 'missed')!;
    const aloofName = Object.keys(graded).find((n) => graded[n] === 'aloof')!;
    const missedMem = (await memory(page, missedName)).filter((m) => m.includes('the keeper was gone'));
    const aloofMem = (await memory(page, aloofName)).filter((m) => m.includes('the keeper was gone'));
    expect(missedMem.length).toBe(1);
    expect(aloofMem.length).toBe(1);
    expect(missedMem[0]).not.toBe(aloofMem[0]);
    for (const n of unmoved) {
      expect((await memory(page, n)).some((m) => m.includes('the keeper was gone'))).toBe(false);
    }
  });

  test('you can see who noticed before you talk to anyone', async ({ page }) => {
    await boot(page);
    const graded = (await catchUp(page, 5 * MINUTE)).missed;
    const marks = await missedMarks(page);

    // A dino that is asleep, up at night, or keeping the vigil wears a *higher* mark and no thought — the
    // precedence rule in `refreshMissedMarks`. So the claim is over graded dinos wearing no higher mark,
    // which is what the player actually sees, and there is always at least one of them.
    const shown = marks.filter((m) => m.visible);
    expect(shown.length).toBeGreaterThan(0);
    for (const m of shown) expect(m.name in graded).toBe(true);
    // Nobody who formed no account is wearing one.
    for (const m of marks) if (!(m.name in graded)) expect(m.visible).toBe(false);
    // The two steps are visibly different marks.
    //
    // **BACKLOG-534 changed how.** This used to assert that `aloof` draws the *same* rig at a lower alpha,
    // which was true and was the defect: dim reads as far-away-or-nearly-gone, not as withheld, and the
    // whole reason `missed.ts` grades on two axes is that "did not care" and "cared and would not say" are
    // the two most different residents in the bowl. `aloof` now has a rig of its own — hollow, unlit,
    // turned away — so the claim is about the silhouette, and both steps draw at full strength.
    const rigs = new Set(shown.map((m) => m.tex));
    for (const m of shown) {
      expect(m.alpha).toBe(1);
      expect(m.tex).not.toBeNull();
    }
    const aloof = shown.filter((m) => graded[m.name] === 'aloof').map((m) => m.tex);
    const missed = shown.filter((m) => graded[m.name] === 'missed').map((m) => m.tex);
    for (const a of aloof) for (const t of missed) expect(a).not.toBe(t);
    // Within a grade the rig is the same one — this is two steps of one glyph, not per-dino art.
    expect(new Set(aloof).size).toBeLessThanOrEqual(1);
    expect(new Set(missed).size).toBeLessThanOrEqual(1);
    expect(rigs.size).toBeLessThanOrEqual(2);
  });

  test('greeting it says the thought out loud, and the mark goes', async ({ page }) => {
    await boot(page);
    const graded = (await catchUp(page, 5 * MINUTE)).missed;
    const visible = (await missedMarks(page)).filter((m) => m.visible).map((m) => m.name);
    const target = visible[0];
    expect(target).toBeTruthy();

    // The line is `<prefix><name>: <opener> <reply>` — the opener leads the dino's own words.
    const line = await pickTone(page, target);
    expect(line).toContain(`${target}: 💭`);
    expect(await missedYou(page)).not.toHaveProperty(target);
    const after = (await missedMarks(page)).find((m) => m.name === target)!;
    expect(after.visible).toBe(false);
  });

  test('a dino caught mid-ritual leads with the ritual, not with you', async ({ page }) => {
    await boot(page);
    const graded = (await catchUp(page, 5 * MINUTE)).missed;
    const target = (await missedMarks(page)).filter((m) => m.visible)[0].name;
    expect(target in graded).toBe(true);

    // The three openers are one-or-none. What happened *here*, just now, beats a thought about the absence.
    await page.evaluate((n) => (window as W).__inventTic(n), target);
    const line = await pickTone(page, target);
    expect(line).not.toContain('💭');
  });

  test('a thought nobody comes over for goes unsaid', async ({ page }) => {
    await boot(page);
    await catchUp(page, 5 * MINUTE);
    expect(Object.keys(await missedYou(page)).length).toBeGreaterThan(0);

    // MISSED_MARK_STEPS is 40; drive past it without greeting anyone.
    for (let i = 0; i < 45; i++) await stepWorld(page);
    expect(await missedYou(page)).toEqual({});
    expect((await missedMarks(page)).every((m) => !m.visible)).toBe(true);
  });
});
