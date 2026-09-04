import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The vigil at the hatch (BACKLOG-121) — somebody is already waiting when you open the park.
 *
 * Milestone 17's last open arc asks for *a dino awake at the wrong hour doing something*, and specifically
 * for an owl doing something a day-dino would not. The behaviour under test is one filter, not a branch: a
 * dino that is at rest cannot walk to the glass, so who keeps the vigil is decided by the hour.
 *
 * Two halves, and the second is the one that matters. A fresh save records the boot itself as a prior
 * visit, so the park knows the keeper's hour on the first frame and dispatches a vigil — and a save whose
 * history says the keeper comes at a *different* hour dispatches nobody, which is what makes this
 * anticipation rather than a greeting.
 */
type W = Record<string, any>;

const vigil = (p: Page) => p.evaluate(() => (window as W).__vigil() as { keeper: string } | null);
const stepVigil = (p: Page) => p.evaluate(() => (window as W).__stepVigil());
const visitHours = (p: Page, hours?: number[]) =>
  p.evaluate((hh) => (window as W).__visitHours(hh) as number[], hours);
const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);
const keeperNow = (p: Page, ms?: number) =>
  p.evaluate((m) => (window as W).__keeperNow(m) as { ms: number; hour: number; day: string }, ms);

/** An epoch whose *local* hour is `h` — the reading `keeperHour` will give the scene. */
function hourEpoch(h: number): number {
  const d = new Date();
  d.setHours(h, 30, 0, 0);
  return d.getTime();
}
const memory = (p: Page, n: string) =>
  p.evaluate((nn) => ((window as W).__memory() as Record<string, string[]>)[nn] ?? [], n);

/** Drive the errand to its end (or to its budget), one deterministic resolve step at a time. */
async function walkTheVigil(page: Page, limit = 60): Promise<void> {
  for (let i = 0; i < limit; i++) {
    await stepVigil(page);
    if ((await vigil(page)) === null) return;
  }
}

test.describe('the vigil at the hatch (BACKLOG-121)', () => {
  test('a fresh save already knows the hour you opened it at', async ({ page }) => {
    await boot(page);
    const hours = await visitHours(page);
    // The founding visit plus the boot: two sightings of the same hour, so the park can claim to know it.
    expect(hours.length).toBeGreaterThanOrEqual(2);
    expect(new Set(hours).size).toBe(1);
  });

  test('somebody walks to the glass and waits, and says so', async ({ page }) => {
    await boot(page);
    await stepVigil(page);
    const dispatched = await vigil(page);
    expect(dispatched).not.toBeNull();
    const keeper = dispatched!.keeper;

    await walkTheVigil(page);
    expect(await vigil(page)).toBeNull(); // it arrived (or ran out of budget — the events line tells us)

    const log = await events(page);
    expect(log.some((l) => l.includes(keeper) && l.includes('glass'))).toBe(true);
    expect((await memory(page, keeper)).some((m) => m.includes('glass'))).toBe(true);
  });

  /**
   * BACKLOG-529: this used to read `new Date().getHours()` in the spec, which is the same coin flip the
   * keeper-clock seam exists to remove — the assertion depended on what hour CI happened to run at. Now the
   * spec *puts* the keeper at an hour, and both halves derive that hour from the park's own learned history
   * rather than naming one.
   */
  test('nobody waits when the keeper turns up at an hour it has never seen', async ({ page }) => {
    await boot(page);
    const known = (await visitHours(page))[0];

    // Move the keeper to the far side of the dial from the hour it is anticipated at, so no wrapping can
    // bring it inside the anticipation window. The history is untouched: what changed is when you arrived.
    await keeperNow(page, hourEpoch((known + 12) % 24));
    await visitHours(page, [known, known, known]); // clears the cooldown; restates the history unchanged
    await stepVigil(page);
    expect(await vigil(page)).toBeNull();

    // Come back at the hour it does know, and somebody is there.
    await keeperNow(page, hourEpoch(known));
    await visitHours(page, [known, known, known]);
    await stepVigil(page);
    expect(await vigil(page)).not.toBeNull();
  });
});
