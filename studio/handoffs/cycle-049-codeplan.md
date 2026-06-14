# Cycle 49 — Code Plan

## Item

BACKLOG-185 [emergent] Word of the cold — a cold-slept dino leads with the cold news when it next meets another; the hardship travels the bowl as a distinct rumor through the existing gossip spine.

## Files to create

- `tests/e2e/cycle-049-cold-word.spec.ts` — e2e proving the cold word spreads, is one-hop, is distinct from generic gossip, and that the generic path is unchanged.

## Files to modify

- `game/src/world/cold.ts`
  - Add `export const COLD_NEWS_TOKEN = 'cold night'` — a stable substring of `coldMemory()` used to detect a first-hand cold memory. (Unit-pinned: `coldMemory().includes(COLD_NEWS_TOKEN)`.)
  - Add `coldWordLine(speaker: string): string` — the distinct flavored rumor the listener remembers, e.g. `` `${speaker} ${RUMOR_MARK} the frost got into their bones — slept the whole night alone` ``. MUST embed `RUMOR_MARK` (imported from gossip) so `isShareable` → false (1-hop for free). Distinct from `coldMemory()`/`neglectMemory()`/`warmMemory()` and from `makeRumor(speaker, coldMemory())`.
  - Add `spreadColdWord(store, speaker, listener): { store, rumor: string | null }` — null if `speaker === listener`; scan `recall(store, speaker)` for a **shareable** entry containing `COLD_NEWS_TOKEN`; if found, `remember(store, listener, coldWordLine(speaker))` and return that line; else `{ store, rumor: null }`. Imports `recall`/`remember` (memory), `RUMOR_MARK`/`isShareable` (gossip).
- `game/src/scenes/WorldScene.ts`
  - In `converse(a, b)` (~line 1374-1377): replace the single `spreadGossip` call with a cold-first try —
    ```ts
    const cold = spreadColdWord(this.memory, a.name, b.name);
    const gossip = cold.rumor ? cold : spreadGossip(this.memory, a.name, b.name);
    this.memory = gossip.store;
    if (cold.rumor) this.logEvent(`🥶 ${b.name} heard about ${a.name}'s cold night`);
    else if (gossip.rumor) this.logEvent(`🗣️ ${b.name} heard news about ${a.name}`);
    ```
  - Add imports `spreadColdWord`, `coldWordLine` from `../world/cold` (extend the existing cold import line; `RUMOR_MARK` already imported from gossip).
  - Add dev hooks beside `__spreadGossip` (~line 1136):
    ```ts
    (window as any).__spreadColdWord = (a: string, b: string) => {
      const g = spreadColdWord(this.memory, a, b);
      this.memory = g.store;
      return g.rumor;
    };
    (window as any).__coldWord = (speaker: string) => coldWordLine(speaker);
    ```

## Reuse list

- `game/src/social/gossip.ts` — `RUMOR_MARK`, `isShareable` (and the existing `makeRumor`/`swapPronouns` are the comparison baseline in tests). The cold-word rumor reuses `RUMOR_MARK` so the 1-hop / non-re-shareable semantics come free.
- `game/src/ai/memory.ts` — `recall`, `remember` (do not reinvent store access).
- `game/src/world/cold.ts` — `coldMemory()` (the first-hand memory whose token drives detection).
- `WorldScene.converse` / `__forceConverse` / `__memory` / `__spreadGossip` / `__greet` / `__dinoNames` / `__stepWorld` — existing seams + hooks; the new hooks mirror them.

## New dependencies

none.

## Test plan

- **Unit (`tests/unit/cold.test.ts`, extend):**
  - `COLD_NEWS_TOKEN` is a substring of `coldMemory()`.
  - `coldWordLine('Mossback')` contains `'Mossback'` and `RUMOR_MARK`; `isShareable(coldWordLine(...))` is `false`.
  - `coldWordLine('Mossback')` ≠ `coldMemory()`, ≠ `neglectMemory()`, ≠ `warmMemory()`, ≠ `makeRumor('Mossback', coldMemory())`.
  - `spreadColdWord` with a store where speaker has `coldMemory()`: returns non-null, plants the line in listener, planted line carries `RUMOR_MARK`.
  - `spreadColdWord` with a speaker that has no cold memory: returns `{ rumor: null }`, store unchanged.
  - `spreadColdWord` one-hop: after listener receives the cold word, `spreadColdWord(store, listener, third)` is null (the received line is not shareable as fresh cold news).
  - `spreadColdWord(store, X, X)` (same dino) → null.
- **E2E (`tests/e2e/cycle-049-cold-word.spec.ts`):**
  - Seed a cold memory via a hook (`__rememberCold` if present, else drive `__spreadColdWord` after planting through an existing path — see Risks); `__spreadColdWord('Mossback','Sunny')` returns non-null and `__memory().Sunny` includes the cold-word line; a second hop `__spreadColdWord('Sunny','Glade')` is null.
  - A dino with no cold memory: `__spreadColdWord('Rex','Sunny')` is null.
  - Generic gossip still works (smoke re-assert of cycle-020 shape via `__greet` + `__spreadGossip`).

## Risks

- **Seeding a cold memory in e2e.** `resolveColdMorning` only fires on a winter-night huddle-window edge — awkward to stage headless. Cleanest: add a tiny dev hook `__rememberCold(name)` that does `this.memory = remember(this.memory, name, coldMemory())` (one line, beside the other hooks), so the e2e can plant the first-hand cold memory directly without faking a winter night. Keep it dev-only. If the planner/coder prefers not to add it, the unit tests already cover the pure logic fully and the e2e can lean on `__memory` inspection after a forced winter resolve — but the hook is simpler and lower-risk.
- **Pronoun voice.** `coldWordLine` is hand-written third-person ("their bones"), NOT run through `swapPronouns` (the memory has no `you`), so no double-rewrite surprises.
- **Most-recent-wins illusion.** Generic `pickGossip` would often pick the cold memory anyway if it's newest — but the point of 185 is the *distinct line* + *preference even when stale*. The cold-first branch guarantees both; tests assert the distinct line, not just that something spread.

## Estimated touch count

~4 files (cold.ts, WorldScene.ts, cold.test.ts, new e2e). Under the 6-file ceiling.

## Shipped

**Files touched (4, exactly as planned):**
- `game/src/world/cold.ts` — added `COLD_NEWS_TOKEN`, `coldWordLine(speaker)`, `spreadColdWord(store, a, b)`; imported `RUMOR_MARK`/`isShareable` from gossip and `recall`/`remember`/`MemoryStore` from memory.
- `game/src/scenes/WorldScene.ts` — `converse` now tries `spreadColdWord` first, falls back to `spreadGossip`, logs a distinct 🥶 line; added `__spreadColdWord`, `__coldWord`, and the planned `__rememberCold` dev hooks; extended the cold import.
- `tests/unit/cold.test.ts` — added a `word of the cold (BACKLOG-185)` describe block (7 tests: token-substring pin, rumor-mark + 1-hop, distinctness vs every memory + generic retell, plant, no-cold→null, one-hop, no-self-gossip).
- `tests/e2e/cycle-049-cold-word.spec.ts` — 2 specs: cold word spreads + is one-hop + lands the distinct line; no-cold→null with the generic gossip spine still carrying first-hand news.

**Deviations:** none. The `__rememberCold` hook flagged as optional in Risks was added (it kept the e2e clean — no faked winter night).

**Build:** ✅ clean (`npm --prefix game run build`).
**Unit tests:** ✅ 438 passed (45 files), +7 from the new block.
**Dev render:** ✅ HTTP 200 from `http://localhost:5173/`.
**E2E:** deferred to QA (full Playwright run).
