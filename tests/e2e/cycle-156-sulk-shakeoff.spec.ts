import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

type W = Record<string, unknown>;
type Jealousy = { name: string; line: string; memory: string } | null;
type Homecoming = { name: string; hearts: number; line: string; memory: string; jealous: Jealousy } | null;
type CatchUp = { days: number; minutes: number; capped: boolean; digest: string[]; homecoming: Homecoming };

const DAY_MS = 24 * 60 * 60_000;

/** The BACKLOG-125 staging, reused verbatim from cycle-032-repair.spec.ts: two greets inside one heart of
 *  each other make a guaranteed near-tie, so the homecoming has a runner-up to slight. */
async function stageJealousy(page: Page): Promise<string> {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await page.evaluate(() => {
    const greet = (window as W).__greet as (n: string) => number;
    greet('Sunny');
    greet('Glade');
  });
  const result: CatchUp = await page.evaluate(
    (ms) => ((window as W).__catchUp as (m: number) => CatchUp)(ms),
    2 * DAY_MS,
  );
  expect(result.homecoming?.jealous).not.toBeNull();
  return result.homecoming!.jealous!.name;
}

/** Drive `n` ambient steps through the dev hook. The window is measured in steps precisely so a spec can
 *  do this instead of sleeping two minutes. */
async function driveSteps(page: Page, n: number): Promise<void> {
  await page.evaluate((count) => {
    const step = (window as W).__stepWorld as () => void;
    for (let i = 0; i < count; i += 1) step();
  }, n);
}

test('a sulk nobody attends to ends on its own after forty steps (BACKLOG-123)', async ({ page }) => {
  const sulker = await stageJealousy(page);
  expect(await page.evaluate(() => ((window as W).__pendingRepair as () => string | null)())).toBe(sulker);
  expect(await page.evaluate(() => ((window as W).__sulkAge as () => number | null)())).toBe(0);

  // One step short of the window: still sulking. This is the half of the assertion that proves the clock
  // is a clock and not a "clears on the next step" no-op.
  await driveSteps(page, 39);
  expect(await page.evaluate(() => ((window as W).__pendingRepair as () => string | null)())).toBe(sulker);

  await driveSteps(page, 1);
  expect(await page.evaluate(() => ((window as W).__pendingRepair as () => string | null)())).toBeNull();
  expect(await page.evaluate(() => ((window as W).__sulkAge as () => number | null)())).toBeNull();

  const mem: string[] = await page.evaluate(
    (n) => ((window as W).__memory as () => Record<string, string[]>)()[n] ?? [],
    sulker,
  );
  expect(mem.some((e) => e.includes('got over it') && e.includes(sulker))).toBe(true);
  // The register: an unattended ending must not credit the keeper.
  expect(mem.some((e) => e.includes('got over it') && e.includes('keeper'))).toBe(false);
});

test('the shakeoff plays the same recovery flourish a make-up greet earns (BACKLOG-123/318)', async ({ page }) => {
  const sulker = await stageJealousy(page);
  await driveSteps(page, 40);

  const bubbles: string[] = await page.evaluate(() => ((window as W).__bubbleTexts as () => string[])());
  expect(bubbles.some((t) => t.includes(sulker) && t.includes('anyway'))).toBe(true);

  const lift: string | null = await page.evaluate(() => ((window as W).__lastMoodLift as () => string | null)());
  expect(lift).not.toBeNull();
  expect(lift).toContain('✨');
});

test('a make-up greet inside the window still takes the repair ending, not the shakeoff (BACKLOG-125)', async ({
  page,
}) => {
  const sulker = await stageJealousy(page);
  await driveSteps(page, 20); // half the window — the keeper got there first
  await page.evaluate((n) => ((window as W).__greet as (x: string) => number)(n), sulker);

  expect(await page.evaluate(() => ((window as W).__pendingRepair as () => string | null)())).toBeNull();
  const mem: string[] = await page.evaluate(
    (n) => ((window as W).__memory as () => Record<string, string[]>)()[n] ?? [],
    sulker,
  );
  expect(mem.some((e) => e.includes('noticed'))).toBe(true);
  expect(mem.some((e) => e.includes('got over it'))).toBe(false);

  // ...and driving past the window afterwards files nothing, because there is no sulk left to end.
  await driveSteps(page, 60);
  const after: string[] = await page.evaluate(
    (n) => ((window as W).__memory as () => Record<string, string[]>)()[n] ?? [],
    sulker,
  );
  expect(after.some((e) => e.includes('got over it'))).toBe(false);
});

test('a dino that was never slighted never files a shakeoff memory (BACKLOG-123)', async ({ page }) => {
  const sulker = await stageJealousy(page);
  await driveSteps(page, 60);

  const all: Record<string, string[]> = await page.evaluate(() =>
    ((window as W).__memory as () => Record<string, string[]>)(),
  );
  const shookOff = Object.keys(all).filter((n) => (all[n] ?? []).some((e) => e.includes('got over it')));
  expect(shookOff).toEqual([sulker]);
});
