# Cycle 52 — Code Plan

**Item** — BACKLOG-234 [emergent] The bowl self-corrects — a carrier meeting a recovered sufferer drops the stale cold word with relief; the 217 sympathy visit gives way to the all-clear.

## Reuse list (MUST use, do not reinvent)

- `game/src/world/cold.ts` — `heardColdWordAbout(store, hearer, sufferer)` (217) is the exact carrier→sufferer test; `coldWordLine(sufferer)` (185) is the string to drop; `WARM_NEWS_TOKEN` (223) is the recovery tell; `cameToFindMemory` is the distinctness foil. `selfCorrect` mirrors `sympathyVisit`'s pure-detector shape verbatim.
- `game/src/social/gossip.ts` — `isShareable(event)` for the first-hand-warm-memory test in `recovered` (same predicate `spreadWarmWord` uses).
- `game/src/ai/memory.ts` — `recall`, `remember`, `MemoryStore`. Add `forget` here as a pure sibling of `remember`.
- The converse seam in `WorldScene.ts` already snapshots `this.memory` pre-meeting and runs `sympathyVisit(snapshot, a, b)` (≈ line 1423). We add a higher-precedence `selfCorrect` branch on the same snapshot, reusing `stepToward`/`showBubble`/`logEvent` exactly as the sympathy block does (minus the bond bump).

No new gossip/comfort machinery, no new dependency. The only new primitive is `forget`, kept to one filter line.

## Files to create

- `tests/e2e/cycle-052-self-correct.spec.ts` — e2e mirroring `cycle-050-sympathy-visit.spec.ts`:
  - **Recovered → all-clear**: plant cold word about `b` on `a` (`__rememberCold(b)` then `__spreadColdWord(b,a)` to carry it), plant a warm memory on `b` (`__rememberWarm(b)` = recovered), capture the `a`–`b` bond, run `__forceConverse`, then assert: `a`'s memory no longer contains `__coldWord(b)`, `a`'s memory gained the relief memory, the event log shows a 😌 line, and the `a`–`b` bond is unchanged (`__bond`).
  - **Control: not recovered → sympathy visit fires**: same cold-word setup, no warm memory on `b`; assert the sympathy visit still fires (bond bumps, 🫂 log) and no drop — i.e. cycle-050 behavior intact.

## Files to modify

- `game/src/ai/memory.ts` — add:
  ```ts
  /** Remove every occurrence of `entry` from `name`'s list. Returns a new store; no mutation. */
  export function forget(store: MemoryStore, name: string, entry: string): MemoryStore {
    const prev = store[name];
    if (!prev) return store;
    return { ...store, [name]: prev.filter((e) => e !== entry) };
  }
  ```
- `game/src/world/cold.ts` — add a self-correct block after the sympathy-visit block (mirrors it):
  - `export function recovered(store: MemoryStore, name: string): boolean` — `recall(store, name).some((e) => isShareable(e) && e.includes(WARM_NEWS_TOKEN))` (the keeper warmed it). (`isShareable` is already imported in cold.ts.)
  - `export function reliefLine(corrector: string, sufferer: string): string` — `` `${corrector}: Oh — you're alright now, ${sufferer}! 😌` ``.
  - `export function reliefMemory(sufferer: string): string` — `` `saw ${sufferer} came through it fine` `` (first-hand, no `RUMOR_MARK`).
  - `export function selfCorrect(store, a, b): { corrector; sufferer; dropped; memory } | null` — structural twin of `sympathyVisit`: `if (a === b) return null;` then if `heardColdWordAbout(store, a, b) && recovered(store, b)` → corrector `a`, sufferer `b`; else if `heardColdWordAbout(store, b, a) && recovered(store, a)` → corrector `b`, sufferer `a`; else null. Return `{ corrector, sufferer, dropped: coldWordLine(sufferer), memory: reliefMemory(sufferer) }`.
- `game/src/scenes/WorldScene.ts`:
  - Add `recovered, reliefLine, reliefMemory, selfCorrect` to the `from '../world/cold'` import; add `forget` to the `from '../ai/memory'` import.
  - Converse seam — insert a **higher-precedence** branch before the existing `sympathyVisit` block, both reading the pre-meeting `snapshot`:
    ```ts
    const correction = selfCorrect(snapshot, a.name, b.name);
    if (correction) {
      this.memory = forget(this.memory, correction.corrector, correction.dropped);
      this.memory = remember(this.memory, correction.corrector, correction.memory);
      const cDino = this.dinos.find((d) => d.name === correction.corrector);
      if (cDino) this.showBubble(cDino, reliefLine(correction.corrector, correction.sufferer));
      this.logEvent(`😌 ${correction.corrector} sees ${correction.sufferer} came through it fine`);
    } else {
      // ... the existing sympathyVisit(snapshot, a.name, b.name) block, unchanged ...
    }
    ```
  - Dev hook beside `__sympathyVisit`:
    ```ts
    (window as any).__selfCorrect = (a: string, b: string) => {
      const c = selfCorrect(this.memory, a, b);
      if (c) {
        this.memory = forget(this.memory, c.corrector, c.dropped);
        this.memory = remember(this.memory, c.corrector, c.memory);
      }
      return c;
    };
    ```
- `tests/unit/cold.test.ts` — add `describe('the bowl self-corrects (BACKLOG-234)')`:
  - `recovered` true for a warm-carrying store, false for cold-only / empty.
  - `reliefLine` contains both names + 😌; `reliefMemory` first-hand and distinct from `cameToFindMemory`/`coldMemory`/`warmMemory`/`neglectMemory`.
  - `selfCorrect`: fires when carrier holds the other's cold word AND that other recovered; direction-agnostic; null when not-recovered, when neither carries the word, and when `a===b`; `dropped === coldWordLine(sufferer)`.
- `tests/unit/memory.test.ts` — add a `forget` test: removes exactly the named entry, leaves siblings + other names intact, no-op on an unknown name/entry, returns a new object (no mutation).

## New dependencies

none.

## Test plan

- **Unit (vitest)** — `cold.test.ts` (recovered/relief/selfCorrect, ~8 assertions) + `memory.test.ts` (forget, ~3 assertions).
- **E2E (playwright)** — `cycle-052-self-correct.spec.ts`: recovered → drop + 😌 + unchanged bond; non-recovered control → sympathy visit fires. Pin `cycle-050-sympathy-visit` must stay green (it never recovers the sufferer, so `selfCorrect` is null there and the sympathy branch runs unchanged).

## Risks

- **Precedence is the whole correctness story.** `selfCorrect` must be checked before `sympathyVisit`, both on the *same pre-meeting snapshot*, so a recovered sufferer is corrected (not pitied) and the bond is left alone. The else-branch keeps the sympathy block byte-identical so cycle-050 is safe.
- `recovered` reuses the *exact* `spreadWarmWord` predicate (`isShareable && includes(WARM_NEWS_TOKEN)`); keep them textually identical so they can't drift (a unit test pins `recovered` on a `warmMemory()` store).
- `forget` filters by strict equality on the full entry string — `coldWordLine(sufferer)` is the exact string planted by `spreadColdWord`, so the drop is precise (no substring/regex). A unit test pins that only that entry goes.
- The e2e must carry the cold word the *real* way (plant `coldMemory` on the sufferer, then `__spreadColdWord(sufferer, carrier)`) so the dropped string matches `coldWordLine(sufferer)` exactly — don't hand-write the rumor.

## Estimated touch count

6 files (memory.ts, cold.ts, WorldScene.ts, cold.test.ts, memory.test.ts, new e2e). At the 6-file ceiling — no split needed.
