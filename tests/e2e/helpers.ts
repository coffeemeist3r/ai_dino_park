import type { Page } from '@playwright/test';
import { FOUNDING_PILE_STEPS, FOUNDING_RUIN } from '../../game/src/world/founding';

/**
 * Boot the game and wait until the scene is fully ready.
 *
 * WorldScene.create() attaches all the `window.__*` dev hooks and then sets
 * `window.__ready = true` on its last line. Waiting on that flag (rather than
 * just the canvas being visible) removes the parallel-load flake where a spec
 * read a hook a frame before create() had attached it.
 *
 * The 30s ceiling (was 10s) covers cold parallel boots: when several fresh
 * browsers hit a cold Vite dev server at once, Phaser parse + first-load
 * transforms genuinely take longer than 10s. The server-side fix (vite
 * optimizeDeps + warmup) shrinks that cost; this headroom absorbs the rest so
 * a slow-but-correct cold boot isn't reported as a failure.
 *
 * BACKLOG-486: this number must stay **strictly below** the per-test `timeout` in
 * `playwright.config.ts` (60s). While the two were equal, a boot that genuinely
 * needed 22s left the spec no budget at all, and the failure surfaced as whatever
 * assertion the clock landed on — a different victim every run, always green in
 * isolation. If you raise this ceiling, raise that timeout first.
 */
const BOOT_TIMEOUT = 30_000;

export async function boot(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('canvas').waitFor({ state: 'visible', timeout: BOOT_TIMEOUT });
  await page.waitForFunction(() => (window as Record<string, unknown>).__ready === true, undefined, {
    timeout: BOOT_TIMEOUT,
  });
  // BACKLOG-486: `__ready` is a flag create() sets on its last line — it says the hooks are attached, not
  // that the scene has drawn. Give it one frame, so a spec reads a world that has actually stepped once.
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => r())));
  // BACKLOG-486 (rework): put the world on seeded dice. Capping the workers and lifting the per-test budget
  // did not stop the one-victim-per-run pattern, and the failures were never timeouts — `cycle-129-berth`
  // fell by exactly one tile, a wander step that happened to go toward the food. A spec asserting over a
  // live coin flip cannot be re-run into information. Every spec boots on the same sequence.
  await page.evaluate(() => (window as Record<string, (s: number) => boolean>).__seedRandom?.(20260818));
  // BACKLOG-431: freeze the wall-clock ambient timers (wander/sky/migration rolls) for every spec, so the
  // background world tick can't mutate pinned state mid-assert. Specs drive beats via explicit hooks
  // (__stepWorld, __triggerSky, __migrate, __maybeBarter, __advanceWall), which bypass the pause. A spec
  // that genuinely needs the live timers calls __resumeAmbient() after boot.
  await page.evaluate(() => (window as Record<string, () => void>).__pauseAmbient?.());
  settleAfterInput(page);
}

/**
 * Make every input on this page wait for the world to have processed it (BACKLOG-515).
 *
 * `page.keyboard.press()` and `page.mouse.click()` resolve when CDP has **dispatched** the DOM event.
 * Phaser's `KeyboardPlugin` queues that event and emits `Key.on('down')` from the scene's own update step —
 * see `WorldScene.ts`'s `this.cursors.left.on('down', …)`. Whatever a spec does next is a *second*
 * round-trip, and it can land before that frame has run.
 *
 * Which is why the failures always looked backwards. A **fast** round-trip (serial run, warm dev server)
 * loses the race and a slow one (under parallel load) wins it by accident — *fails serial, passes under
 * load*, the inverse of the parallel-load theory this studio carried from cycle 92 to cycle 135.
 *
 * **It is not only reads that lose.** Three of the seams found while fixing this were input-*after*-input:
 * `KeyE` opening the tone menu and `Digit1` picking from it in the same frame, so the pick landed against a
 * menu that was not open yet and the tone was never chosen at all. The `expect.poll` that followed then
 * timed out on a beat that had never been requested — which is why two of the catalogued specs failed
 * *despite* already polling. **A poll cannot recover an input that was dropped.**
 *
 * So the patch goes here, on the two input entry points, rather than at each seam. Six specs were fixed
 * one seam at a time before this was written and a seventh appeared on the next serial run; the victim
 * moves because the race is a property of the runner and not of any spec. One place, every spec that boots.
 *
 * None of this is a bug in the game: a real player's ArrowLeft turns the page on the next frame, sixteen
 * milliseconds later, which is correct. It is the harness that was reading the world too early.
 */
function settleAfterInput(page: Page): void {
  const p = page as Page & { __settlePatched?: boolean };
  if (p.__settlePatched) return; // `boot()` is called twice in a few specs (a relaunch)
  p.__settlePatched = true;
  const press = page.keyboard.press.bind(page.keyboard);
  page.keyboard.press = async (key, options) => {
    await press(key, options);
    await settle(page);
  };
  const click = page.mouse.click.bind(page.mouse);
  page.mouse.click = async (x, y, options) => {
    await click(x, y, options);
    await settle(page);
  };
}

/**
 * The founding fixture (BACKLOG-495) — the one place that says what founding state a spec wants.
 *
 * Three times a founding constant has moved and taken a crowd of unrelated specs down with it: cycle 135
 * spread the cast (~15 red), cycle 136 seeded the Grove's ruin (16 red, two of them about upkeep), cycle
 * 142 found the same class hiding inside a dev hook. Each was repaired with a helper, and each helper was
 * the right fix and the wrong shape — a helper answers *this* spec's question and never writes the question
 * down. A spec that does not say which founding state it wants is making an assertion nobody knows it is
 * making, and the only instrument that has ever surfaced one is moving the constant, which is exactly what
 * CHARTER v7 wants this studio doing more of.
 *
 * So the assumptions get names. A spec opts into one by calling `foundingState(page, name)`, and the name
 * carries a **postcondition** — because a fixture that silently fails to apply is the same invisible
 * assumption in a nicer coat. Every apply is followed by its own verify, and a failure names the fixture.
 *
 * Adding a fifth name (with a `why` line) is the seam working. Re-flattening a founding constant to make a
 * spec green, or writing a twelfth ad-hoc helper, is the seam being worked around.
 */
export type FoundingFixtureName = 'as-shipped' | 'all-bowl' | 'empty-grounds' | 'bare';

/** A verify returns the reason it did not hold, or `null`. One throw site, one message shape. */
type Verify = (page: Page) => Promise<string | null>;

interface FoundingFixture {
  /** Why a spec would want this state. Read by a human deciding which name to call. */
  why: string;
  apply: (page: Page) => Promise<void>;
  verify: Verify;
}

const verifyAllBowl: Verify = async (page) =>
  page.evaluate(() => {
    const w = window as Record<string, any>;
    for (const d of w.__dinoPositions() as Array<{ name: string }>) {
      const z = w.__homeZone(d.name);
      if (z !== 'bowl') return `${d.name} is on ${z}`;
    }
    return null;
  });

const verifyEmptyGrounds: Verify = async (page) =>
  page.evaluate((ruin) => {
    const w = window as Record<string, any>;
    for (const [zone, pile] of Object.entries(w.__pilesByZone() as Record<string, Record<string, number>>)) {
      const total = Object.values(pile).reduce((a, b) => a + b, 0);
      if (total > 0) return `${zone} still holds ${total} in its pile`;
    }
    const stillThere = (w.__cairns() as Array<{ zone: string; tileX: number; tileY: number }>).some(
      (c) => c.zone === ruin.zone && c.tileX === ruin.tileX && c.tileY === ruin.tileY,
    );
    if (stillThere) return `the founding ruin is still standing on ${ruin.zone}`;
    // BACKLOG-528: and the standing half. The founding state grew a lean-to this cycle, and a fixture that
    // clears half of what it names is exactly the silent failure this postcondition exists for.
    const shelters = w.__shelters() as Array<{ zone: string; tileX: number; tileY: number }>;
    const left = shelters.length;
    return left ? `${left} founding landmark(s) still standing` : null;
  }, FOUNDING_RUIN);

/**
 * The shipping state's own postcondition. Reads the expected steps out of the game's `FOUNDING_PILE_STEPS`
 * rather than restating them, so moving a founding pile fails **here**, by name, once — instead of in
 * whatever unrelated spec the change happens to reach first.
 */
const verifyAsShipped: Verify = async (page) =>
  page.evaluate((expected) => {
    const w = window as Record<string, any>;
    for (const [zone, step] of Object.entries(expected)) {
      const got = w.__bank(zone).step as number;
      if (got !== step) return `${zone} boots at heap step ${got}, expected ${step}`;
    }
    const ruin = (w.__cairns() as Array<{ derelict?: boolean }>).length;
    if (ruin === 0) return 'the founding ruin is missing';
    // BACKLOG-528: and something still standing beside it. This is the postcondition that makes the upkeep
    // economy's reachability a thing the suite holds rather than a thing a verdict claimed once — a later
    // pass that thins the founding skyline fails here, by name, instead of somewhere unrelated.
    const standing = (w.__shelters() as unknown[]).length;
    return standing > 0 ? null : 'the founding skyline ships nothing standing';
  }, FOUNDING_PILE_STEPS);

export const FOUNDING_FIXTURES: Record<FoundingFixtureName, FoundingFixture> = {
  'as-shipped': {
    why: 'the founding state production actually ships — the spec is about a fresh park itself',
    apply: async () => {},
    verify: verifyAsShipped,
  },
  'all-bowl': {
    why: 'the whole cast in one place — the spec is about two dinos meeting, not about where they live',
    apply: async (page) => {
      await page.evaluate(() => {
        const w = window as Record<string, any>;
        for (const d of w.__dinoPositions() as Array<{ name: string }>) {
          if (w.__homeZone(d.name) !== 'bowl') w.__migrate(d.name, 'bowl');
        }
      });
    },
    verify: verifyAllBowl,
  },
  'empty-grounds': {
    why: 'no founding ruin, no founding piles, no founding bank ledger — the spec is about what it puts there itself',
    apply: async (page) => {
      await page.evaluate(() => (window as Record<string, () => number>).__clearFounding?.());
    },
    verify: verifyEmptyGrounds,
  },
  bare: {
    why: 'the pre-v7 park: cast co-located and every ground empty. Both of the above, in one call.',
    apply: async (page) => {
      await FOUNDING_FIXTURES['all-bowl'].apply(page);
      await FOUNDING_FIXTURES['empty-grounds'].apply(page);
    },
    verify: async (page) => (await verifyAllBowl(page)) ?? (await verifyEmptyGrounds(page)),
  },
};

/** Put the park into a **named** founding state, and prove it got there. Throws naming the fixture if not. */
export async function foundingState(page: Page, name: FoundingFixtureName): Promise<void> {
  const fixture = FOUNDING_FIXTURES[name];
  if (!fixture) throw new Error(`unknown founding fixture '${name}'`);
  await fixture.apply(page);
  const reason = await fixture.verify(page);
  if (reason) throw new Error(`founding fixture '${name}' did not hold: ${reason}`);
}

/**
 * Gather the whole cast into the bowl (CHARTER v7).
 *
 * Before v7 the roster spawned entirely into the bowl, so "everyone is co-located and every other ground is
 * empty" was the free founding fixture, and a good many specs were written against it without ever saying
 * so. v7 ships residents on the grove and the Fernreach, which is the point — but a spec whose *subject* is
 * something else (a comfort visit, an inspection, a shared stargaze) still needs the cast in one place.
 *
 * This restores that fixture **explicitly**, so the assumption is visible in the spec that depends on it
 * rather than smuggled in from the roster. Specs whose subject genuinely *is* the founding state assert the
 * new distribution instead and must not call this.
 *
 * @deprecated BACKLOG-495 — this is `foundingState(page, 'all-bowl')` and nothing else. Kept, and kept
 * exported, because its ~20 callers are correct as written and rewriting them changes no behavior; new
 * specs should name the fixture.
 */
export async function gatherToBowl(page: Page): Promise<void> {
  await foundingState(page, 'all-bowl');
}

/**
 * Restore the pre-v7 empty grounds (CHARTER v7 / BACKLOG-488).
 *
 * The founding park now ships a ruin in the Grove and the stone to raise it, so that the disrepair, upkeep
 * and mend systems are things a new player can watch rather than facts about a save file. That is the point
 * — but a good many specs used "every ground but the bowl is empty, and no pile has anything in it" as a
 * free fixture without ever saying so: a carry spec, a craft spec, a prosperity tier.
 *
 * This restores that fixture **explicitly**, the way `gatherToBowl` restores the co-located cast. A spec
 * whose subject genuinely *is* the founding state asserts the new one instead and must not call this.
 *
 * @deprecated BACKLOG-495 — this is `foundingState(page, 'empty-grounds')`. Same reasoning as
 * `gatherToBowl`: kept for its existing callers, named for new ones. It now also *verifies* that the
 * clear landed, which the bare hook call never did.
 */
export async function emptyGrounds(page: Page): Promise<void> {
  await foundingState(page, 'empty-grounds');
}

/**
 * Two frames of world time (BACKLOG-515) — the primitive `settleAfterInput` runs after every key and click.
 *
 * The first frame drains Phaser's input queue into the handler; the second lets the handler's effect be
 * true when the next `evaluate` reads it. `boot()` keeps its own single-frame await unchanged.
 *
 * Exported so a spec can settle after something the patch does not cover — a drag, a touch gesture, a
 * `dispatchEvent`. It is not a general-purpose sleep: use it at an input seam or not at all.
 */
export async function settle(page: Page): Promise<void> {
  await page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
  );
}
