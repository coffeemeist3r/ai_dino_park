import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

type W = Record<string, unknown>;
type Funk = { name: string; kind: string; age: number };

/**
 * BACKLOG-544 — the state that ends, and its reachable second caller.
 *
 * Since cycle 100 the dino that lost a scramble at the hatch got one frame of 😤 or 😖 and was then, from
 * the player's side, indistinguishable from a dino that had never been at the hatch at all. It now carries
 * a `shoulder` funk on the 544 seam with the same two endings BACKLOG-123 gave the jealous sulk.
 *
 * Staged through `__forceContest`, which runs the **production** resolution (the branch `checkFeeding`
 * calls) rather than a hook that re-implements it — the cycle-128 discipline.
 */

const funks = (page: Page): Promise<Funk[]> => page.evaluate(() => ((window as W).__funks as () => Funk[])());

const memoryOf = (page: Page, name: string): Promise<string[]> =>
  page.evaluate((n) => ((window as W).__memory as () => Record<string, string[]>)()[n] ?? [], name);

async function driveSteps(page: Page, n: number): Promise<void> {
  await page.evaluate((count) => {
    const step = (window as W).__stepWorld as () => void;
    for (let i = 0; i < count; i += 1) step();
  }, n);
}

/** Drop food, force the production contest, and return the dino that came away with nothing. */
async function stageStandoff(page: Page): Promise<string> {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await page.evaluate(() => ((window as W).__dropFood as (c?: number, f?: string) => unknown)(undefined, 'fish'));
  // Sunny holds against Glade: the bold winner keeps its food and Glade is the one left with nothing.
  await page.evaluate(() => ((window as W).__setTrait as (n: string, k: string, v: number) => boolean)('Sunny', 'bravery', 1));
  await page.evaluate(() => ((window as W).__forceContest as (w: string, g: string) => unknown)('Sunny', 'Glade'));
  return 'Glade';
}

test('the loser of a contested drop is visibly sore about it (BACKLOG-544)', async ({ page }) => {
  const loser = await stageStandoff(page);
  const live = await funks(page);
  expect(live.map((f) => f.name)).toContain(loser);
  expect(live.find((f) => f.name === loser)?.kind).toBe('shoulder');
  expect(live.find((f) => f.name === loser)?.age).toBe(0);

  // The winner is not in a funk. Only the dino that came away with nothing is.
  expect(live.map((f) => f.name)).not.toContain('Sunny');
});

test('it ends on its own after twenty steps, crediting nobody (BACKLOG-544)', async ({ page }) => {
  const loser = await stageStandoff(page);

  // One step short: still sore. The half of the assertion that proves the clock is a clock.
  await driveSteps(page, 19);
  expect((await funks(page)).map((f) => f.name)).toContain(loser);

  await driveSteps(page, 1);
  expect((await funks(page)).map((f) => f.name)).not.toContain(loser);

  const mem = await memoryOf(page, loser);
  expect(mem.some((e) => e.includes('let it go') && e.includes(loser))).toBe(true);
  // The register, inherited from BACKLOG-123: an unattended ending must not credit the keeper.
  expect(mem.some((e) => e.includes('let it go') && e.includes('keeper'))).toBe(false);
});

test('a greet inside the window ends it early, and the book says the keeper came (BACKLOG-544)', async ({
  page,
}) => {
  const loser = await stageStandoff(page);
  await driveSteps(page, 10); // half the window — the keeper got there first
  await page.evaluate((n) => ((window as W).__greet as (x: string) => number)(n), loser);

  expect((await funks(page)).map((f) => f.name)).not.toContain(loser);
  const mem = await memoryOf(page, loser);
  expect(mem.some((e) => e.includes('keeper came over') && e.includes(loser))).toBe(true);
  expect(mem.some((e) => e.includes('let it go'))).toBe(false);

  // ...and driving past the window afterwards files nothing, because there is no funk left to end.
  await driveSteps(page, 40);
  expect((await memoryOf(page, loser)).some((e) => e.includes('let it go'))).toBe(false);
});

test('the jealous sulk still behaves exactly as it did before the seam (BACKLOG-123/544)', async ({ page }) => {
  // The conversion's own regression net: `__pendingRepair` and `__sulkAge` are held byte-identical on
  // purpose, so the thirty-odd assertions that read them are what proves the move changed nothing.
  await boot(page);
  await foundingState(page, 'as-shipped');
  await page.evaluate(() => {
    const greet = (window as W).__greet as (n: string) => number;
    greet('Sunny');
    greet('Glade');
  });
  const jealous: string | null = await page.evaluate(() => {
    const r = ((window as W).__catchUp as (m: number) => { homecoming: { jealous: { name: string } | null } })(
      2 * 24 * 60 * 60_000,
    );
    return r.homecoming?.jealous?.name ?? null;
  });
  expect(jealous).not.toBeNull();
  expect(await page.evaluate(() => ((window as W).__pendingRepair as () => string | null)())).toBe(jealous);
  expect(await page.evaluate(() => ((window as W).__sulkAge as () => number | null)())).toBe(0);

  // Kind, on the seam, is `sulk` — not the new one. The two funks are the same feeling by different doors
  // and the park must still be able to tell them apart in the book.
  expect((await funks(page)).find((f) => f.name === jealous)?.kind).toBe('sulk');
});
