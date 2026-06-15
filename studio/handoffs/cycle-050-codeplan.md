# Cycle 50 — Code Plan

## Item

**BACKLOG-217** [emergent] Secondhand sympathy spurs a visit — a dino that heard about another's cold night drifts over to keep it company the next time they meet, a sub-floor bond bump + a "came to find you after I heard" memory.

## Reuse audit

- **Cold word already names the sufferer.** `coldWordLine(speaker)` (`world/cold.ts`) is the exact string planted on a hearer; detection is exact membership of `coldWordLine(sufferer)` in the hearer's recall — no new rumor parsing.
- **Comfort spine owns the magnitude + the gesture.** `COMFORT_BOND` (`world/comfort.ts`) is the bond bump; the converse-seam glue reuses `stepToward`/`tileOf`/`showBubble`/`logEvent` exactly as `playHomecoming` already does for the 130 console.
- **Memory + bonds primitives.** `recall`/`remember` (`ai/memory.ts`), `strengthen`/`bondPoints` (`social/bonds.ts`) — all already imported in the touched files.
- No new symbol reinvents anything: the detector and the memory line are the only genuinely new pieces.

## Files to create

- `tests/e2e/cycle-050-sympathy-visit.spec.ts` — e2e proving the visit fires headless via the new hooks.

## Files to modify

- `game/src/world/cold.ts`
  - Add `export const SYMPATHY_BOND = COMFORT_BOND;` (import `COMFORT_BOND` from `./comfort`) — names the magnitude in this module and pins it to the 130 console so they can't drift.
  - Add `heardColdWordAbout(store: MemoryStore, hearer: string, sufferer: string): boolean` — `recall(store, hearer).includes(coldWordLine(sufferer))`.
  - Add `cameToFindMemory(visitor: string): string` → `` `${visitor} came to find me after hearing` `` (first-hand, no `RUMOR_MARK`; filed on the sufferer).
  - Add `sympathyLine(visitor: string, sufferer: string): string` → `` `${visitor}: Heard you had a rough night, ${sufferer}. 🫂` `` (the floated bubble).
  - Add `sympathyVisit(store, a, b): { visitor: string; sufferer: string; memory: string } | null` — pure detector: if `a` carries `b`'s cold word → visitor `a`/sufferer `b`; else if `b` carries `a`'s → visitor `b`/sufferer `a`; else `null` (and `null` when `a === b`). `memory = cameToFindMemory(visitor)`. Does **not** mutate store or apply bonds — the caller applies `remember` + `strengthen(…, SYMPATHY_BOND)` so the snapshot-vs-live split stays in the caller's hands.
- `game/src/scenes/WorldScene.ts`
  - Import `sympathyVisit, cameToFindMemory, SYMPATHY_BOND` (and `sympathyLine`) from `../world/cold`.
  - In `converse(a, b)`: capture `const snapshot = this.memory;` at the top of the `try` (before the `you ran into` remember). Leave the existing `you ran into` + cold/generic gossip + 🥶/🗣️ log + chirp + speaker bubble **byte-identical**. After the speaker bubble, append the sympathy-visit step:
    ```
    const visit = sympathyVisit(snapshot, a.name, b.name);   // reads PRE-meeting memory → this meeting's fresh word can't self-trigger
    if (visit) {
      this.memory = remember(this.memory, visit.sufferer, visit.memory);
      this.bonds = strengthen(this.bonds, visit.visitor, visit.sufferer, SYMPATHY_BOND);
      const vDino = this.dinos.find((d) => d.name === visit.visitor);
      const sDino = this.dinos.find((d) => d.name === visit.sufferer);
      if (vDino && sDino) {
        const step = stepToward(this.tileOf(vDino), this.tileOf(sDino), COLS, ROWS);
        vDino.setPosition(step.tileX * TILE + TILE / 2, step.tileY * TILE + TILE / 2);
        this.showBubble(vDino, sympathyLine(visit.visitor, visit.sufferer));
      }
      this.logEvent(`🫂 ${visit.visitor} came to find ${visit.sufferer} after hearing`);
    }
    ```
  - Add hooks beside `__spreadColdWord`:
    - `__sympathyVisit(a, b)` — `const v = sympathyVisit(this.memory, a, b); if (v) { this.memory = remember(this.memory, v.sufferer, v.memory); this.bonds = strengthen(this.bonds, v.visitor, v.sufferer, SYMPATHY_BOND); } return v;`
    - `__bond(a, b)` — `return bondPoints(this.bonds, a, b);` (read the pairwise bond; `bondPoints` is already imported).
- `tests/unit/cold.test.ts` — add a `describe('sympathy visit (BACKLOG-217)')` block.

## New dependencies

`none`.

## Test plan

### Unit (`tests/unit/cold.test.ts`)
- `heardColdWordAbout` is exact: true when `coldWordLine(sufferer)` is in the hearer's recall; false when the hearer carries word about a *different* dino, and false on an empty store.
- `sympathyVisit` detects the carrier as visitor: seed Sunny with `coldWordLine('Mossback')`; `sympathyVisit(store,'Sunny','Mossback')` → `{visitor:'Sunny', sufferer:'Mossback', memory: cameToFindMemory('Sunny')}`.
- Direction-agnostic: same seed, `sympathyVisit(store,'Mossback','Sunny')` → identical visitor/sufferer.
- `null` when neither carries word; `null` when `a === b`.
- `cameToFindMemory` is distinct: ≠ `comfortMemory(v)`, ≠ `coldMemory()`, ≠ `warmMemory()`, ≠ `neglectMemory()`, and `isShareable` → true (no `RUMOR_MARK`).
- `SYMPATHY_BOND === COMFORT_BOND` (magnitude pinned to the console).

### E2E (`tests/e2e/cycle-050-sympathy-visit.spec.ts`)
- **Visit fires:** `__rememberCold('Mossback')` → `__spreadColdWord('Mossback','Sunny')`; read `__bond('Sunny','Mossback')` (expect 0); `__sympathyVisit('Sunny','Mossback')` returns `{visitor:'Sunny',sufferer:'Mossback'}`; `__memory().Mossback` includes the came-to-find line; `__bond('Sunny','Mossback')` now 2 (`=== COMFORT_BOND`).
- **Direction swapped:** same setup, `__sympathyVisit('Mossback','Sunny')` returns visitor Sunny / sufferer Mossback.
- **No word → nothing:** `__sympathyVisit('Rex','Glade')` returns `null`; `__bond('Rex','Glade')` unchanged at 0; no new memory.

## Risks

- **Self-trigger:** the visit must read the **pre-meeting snapshot**, not `this.memory` after the gossip plant — otherwise the word planted *this* meeting fires a visit the same meeting. Mitigated by capturing `snapshot` before any `remember` and passing it to `sympathyVisit` in the live path (the hook reads live memory, which is correct for the headless test since the word was planted in a *prior* hook call).
- **Repeat firing (deferred to 226):** while the carrier still holds the rumor, later meetings re-fire the bump/memory. In scope per the design's Out-of-scope; a `// ponytail:` comment names 226 as the gate.
- **Gossip byte-identity:** the visit block is strictly appended after the existing gossip/log/bubble and reads a snapshot, so `spreadGossip`/`spreadColdWord` and their 🥶/🗣️ lines are untouched (cycle-020 + cycle-049 specs are the pins).

## Estimated touch count

`~4 files` (cold.ts, WorldScene.ts, cold.test.ts, one new e2e). Under the 6-file ceiling.

## Shipped

**Files touched (4):**
- `game/src/world/cold.ts` — added `SYMPATHY_BOND` (= `COMFORT_BOND`, imported from `./comfort`), `heardColdWordAbout`, `cameToFindMemory`, `sympathyLine`, `sympathyVisit` (pure detector → `{visitor,sufferer,memory}|null`). A `ponytail:` comment names BACKLOG-226 as the once-per-sorrow gate.
- `game/src/scenes/WorldScene.ts` — imported the three live symbols; `converse` captures `snapshot = this.memory` before any plant and appends the sympathy-visit step (reads the snapshot → no self-trigger; applies `remember` + `strengthen(SYMPATHY_BOND)`, steps the visitor toward the sufferer, floats `sympathyLine`, logs a 🫂 line). Added `__sympathyVisit`/`__bond` hooks beside `__spreadColdWord`. Gossip plant + 🥶/🗣️ lines byte-unchanged.
- `tests/unit/cold.test.ts` — `describe('secondhand sympathy spurs a visit (BACKLOG-217)')`, 7 tests.
- `tests/e2e/cycle-050-sympathy-visit.spec.ts` — 3 e2e (visit fires + bond 0→2 + memory; direction-agnostic; no-word → null/no change).

**No deviations from plan.** No new deps. No save-format change.

**Build:** ✅ `npm --prefix game run build` clean.
**Unit:** ✅ 453 passed (46 files; +7 sympathy).
**Dev server:** ✅ HTTP 200 on `http://localhost:5173/`.
**E2E:** handed to QA for the full run.
