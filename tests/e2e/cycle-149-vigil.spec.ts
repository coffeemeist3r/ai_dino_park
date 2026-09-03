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

  test('nobody waits when the keeper turns up at an hour it has never seen', async ({ page }) => {
    await boot(page);
    // A history that agrees with itself about a hour twelve hours from now — the far side of the dial, so
    // no wrapping can bring it inside the anticipation window.
    const far = (new Date().getHours() + 12) % 24;
    await visitHours(page, [far, far, far]);
    await stepVigil(page);
    expect(await vigil(page)).toBeNull();
  });
});
