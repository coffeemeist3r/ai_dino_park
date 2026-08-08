# Cycle 125 — Code Plan

Build order: **structure first** (456 supplies the quiet park 370's e2e wants), then lore.

## Prior art checked (CHARTER: reuse before adding)

- `world/loner.ts` already owns `isLoner` / `edgeTarget` / `MOPE_CHANCE` / `LONER_FLOOR` → 370's additions go
  **in that file**, not a new one.
- `social/friendship.ts` `heartsFromPoints` already converts points → hearts → reuse, no new maths.
- `WorldScene.ticCaughtFiled` + `resetTic` is an existing once-per-solitary-stretch guard (408) → 370's
  lean memory reuses the same clearing seam rather than inventing a second stretch concept.
- `WorldScene.ambientPaused` + `__pauseAmbient` (431) is the naming precedent for 456(a).
- `pondCompanion` (360), `richestNeighbor` (450), `unsettledNeighbor` (474), `hopToward` (475) are the
  positional-pick precedents for 456(b) — first in list order wins.

## Structure track — BACKLOG-456

**`game/src/scenes/WorldScene.ts`**

1. Field `private ambientHeld = false;` beside `ambientPaused`, with a comment saying what it does **not**
   do (movement/crossings/needs still run) so a future reader doesn't widen it.
2. Dev hooks beside the 431 block (~line 729): `__holdAmbient`, `__releaseAmbient`, `__ambientHeld`.
3. `forceStep()`: three guards, nothing else.
   - wrap the pairwise meeting double-loop in `if (!this.ambientHeld) { … }`
   - `if (!this.ambientHeld) this.maybeSpawnResource();`
   - `if (!this.ambientHeld) this.checkGather();`
4. `pickMigrant`: `homesick[Math.floor(Math.random() * homesick.length)]` → `homesick[0]`, with a comment
   citing this item and the four precedents. **Only** that tier.
5. `__flushSave = () => this.saveGame()` in the dev-hook block. `saveGame` is already `async`; the hook just
   stops discarding the promise. No production call site changes.

**`tests/unit/`** — new `ambient-hold.spec.ts` is not possible (the flag lives in the scene, not a pure
module), so 456's unit coverage is the **homesick pick**: extend the existing migration spec with a
20-call positional assertion. Everything else in 456 is a harness change and is covered by e2e, which is
the honest place for it.

**`tests/e2e/`**

- `cycle-077-carry.spec.ts` / `cycle-097-carry-pressure.spec.ts`: `__holdAmbient()` at the top of
  `crossOnce` (after the pile is banked), `__releaseAmbient()` at the end. The banking steps stay outside
  the hold — they *need* `checkGather`.
- `cycle-076-news-pull.spec.ts`: hold around the driven crossings.
- `cycle-121-work-priority.spec.ts`: `await __flushSave()` immediately before `page.reload()`.
- New `cycle-125-ambient-hold.spec.ts` covering criteria 1–6 and 9: the flag's three states, no
  meeting/bond change under hold, a pinned pile unchanged across 10 held steps, resumption after release,
  a crossing still completing under hold, `__pauseAmbient` unaffected, and a flush surviving reload.

## Lore track — BACKLOG-370

**`game/src/world/loner.ts`** (pure, additive)

```
export const LEAN_HEARTS = 4;
export function leansOnKeeper(hearts: number, floor = LEAN_HEARTS): boolean
export function keeperEdgeTarget(keeper: Tile, cols: number, rows: number): Tile
export function leanMemory(): string
```
`keeperEdgeTarget` is `edgeTarget` applied to the keeper's tile — implement it by **delegating** to
`edgeTarget(keeper, cols, rows)` so the two can never drift in their wall choice or tie-break order. That
is the whole function; the value is in the name and the call site.

**`game/src/scenes/WorldScene.ts`**

- `private leanFiled = new Set<string>();` beside `ticCaughtFiled`; `resetTic` deletes from it too.
- In `forceStep`'s `moping` branch only:
  ```
  const leaning = moping && this.inView(d) && leansOnKeeper(heartsFromPoints(this.friendship[d.name] ?? 0));
  next = stepToward(cur, leaning ? keeperEdgeTarget(this.playerTile(), COLS, ROWS) : edgeTarget(cur, COLS, ROWS), COLS, ROWS);
  ```
  then, if `leaning` and the step **lands on** that target and the name isn't in `leanFiled`, file
  `leanMemory()` and add it.
- Dev hook `__leanTarget(name)`: returns the tile a currently-moping-eligible leaning loner would aim at,
  or `null`. Computed from the same three predicates the branch uses (loner + in view + hearts), so the
  hook cannot drift from the behaviour — it deliberately does **not** re-roll `MOPE_CHANCE` (that roll is
  about *whether* it mopes this step, not *where* it mopes).

**`tests/unit/loner.spec.ts`** — extend: criteria 1–4 (heart floor, four wall cases, tie-break order,
`edgeTarget` unchanged), plus `leanMemory` shape.

**`tests/e2e/cycle-125-lean.spec.ts`** — criteria 5–10 via `__leanTarget`, `__friendship` /
`__setFriendship` (add a setter hook if none exists), `__relocate`/zone hooks for the cross-zone case, and
the fresh-park negative assertion.

## Risk / blast radius

- 456(a) can only change behaviour when a spec opts in — `ambientHeld` defaults false and no production
  path sets it.
- 456(b) is the one production behaviour change: which homesick dino is picked. Tiers above and below are
  untouched; cycle-076/078 pin identity in the *grove* tiers, so they should be unaffected — **verify, do
  not assume** (the 475 lesson).
- 370 is inert below 4 hearts, which is every dino on a fresh save.

## Blockers

_(none at plan time)_

---

## Shipped (Coder, 2026-08-08)

**456.** `ambientHeld` + `__holdAmbient`/`__releaseAmbient`/`__ambientHeld`; three guards in `forceStep`
(meet loop, `maybeSpawnResource`, `checkGather`); `pickMigrant` homesick tier `homesick[0]`; `__flushSave`.
Four catalogued specs moved onto the seam; new `cycle-125-ambient-hold.spec.ts` (7 specs) pins the seam.

**370.** `LEAN_HEARTS`/`leansOnKeeper`/`keeperEdgeTarget`/`leanMemory` in `world/loner.ts`; `leanTargetFor`
+ the mope-branch target swap + the once-per-bout memory; hooks `__leanTarget`, `__setFriendship`,
`__leanFiled`, `__playerTile`. +5 unit, +5 e2e.

**One finding, and the plan was wrong about it.** The plan said to hang the lean memory's once-per-stretch
guard off `resetTic`, reusing 408's `ticCaughtFiled` seam. Shipped that way it filed the memory **six times**
— the ring's entire capacity — because `resetTic` tracks the *tic* stretch, which any company within
`TIC_COMPANY_RANGE` breaks every few steps, while a loner standing at the keeper's wall is still very much
waiting. The two stretches are not the same stretch. The guard now clears in `checkLonerLift` instead: the
bout of waiting ends when the dino stops being a loner, which is the only event that actually ends it. Caught
by the e2e asserting `toBe(1)`; an assertion of `toBeLessThanOrEqual(1)` would have passed on a broken build
*and* on a build where the memory never fired at all.

Build clean. Unit 1607/1607. `@mlc-ai/web-llm` still imported only under `game/src/ai/`. No save-shape change.
