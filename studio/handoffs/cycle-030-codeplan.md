# Cycle 30 — Code Plan

**Item** — BACKLOG-112 [emergent] Homecoming nuzzle.

## Files to create
- `game/src/world/homecoming.ts` — pure module (no Phaser, no WebLLM), sibling to `away.ts`.
  - `export const HOMECOMING_MIN_MINUTES = 360;` — a "long" absence = ≥ 6 in-game hours of
    catch-up. Below this, no nuzzle.
  - `export interface Homecoming { name: string; hearts: number; line: string; memory: string; }`
  - `export function homecoming(friendship: Friendship, awayMinutes: number): Homecoming | null`
    - returns `null` when `awayMinutes < HOMECOMING_MIN_MINUTES`.
    - picks the entry with the max points; tie-break: lexicographically smallest name. Ignores
      points ≤ 0. Returns `null` if no positive-friendship dino exists.
    - `hearts = heartsFromPoints(points)` (reuse `friendship.ts`).
    - `line` = heart-graded, deterministic template containing the name + `👋`:
      - hearts ≥ 7 → `` `${name}: You're finally back! 👋` ``
      - hearts ≥ 4 → `` `${name}: Welcome home! 👋` ``
      - else → `` `${name}: Oh — you're back. 👋` ``
    - `memory` = `'the keeper came home after being away a while'` (the string WorldScene will
      pass to `remember`, kept here so the copy lives with the logic).
- `tests/unit/homecoming.test.ts` — unit tests (see Test plan).
- `tests/e2e/cycle-030-homecoming.spec.ts` — e2e (note: distinct from the pre-existing
  `cycle-030-art.spec.ts`; do not touch that file).

## Files to modify
- `game/src/scenes/WorldScene.ts`
  - import `homecoming, type Homecoming` from `../world/homecoming`.
  - add field `private lastHomecoming: Homecoming | null = null;` (near `lastAwayDigest`).
  - add a private helper `private playHomecoming(): void` that reads `this.lastHomecoming`,
    finds the dino by name in `this.dinos`, and `showBubble(dino, hc.line)`. No-op if null or
    the dino isn't found.
  - in `setupSave()` restore block (after `this.lastAwayDigest = away.digest;` and after dinos
    are (re)spawned, i.e. near the end of the `.then`), compute
    `this.lastHomecoming = homecoming(this.friendship, away.minutes);` then, if non-null,
    `this.memory = remember(this.memory, hc.name, hc.memory);` and call `this.playHomecoming()`.
    (Friendship is already assigned from `save.friendship` just above — order matters: compute
    homecoming after that assignment.)
  - in the `__catchUp` dev hook: after applying `away`, also compute + store
    `this.lastHomecoming = homecoming(this.friendship, away.minutes)`, write the memory if
    non-null, call `this.playHomecoming()`, and include `homecoming: this.lastHomecoming` in the
    returned object so the e2e can assert without timing on the boot-restore path.
  - add dev hook `(window as any).__homecoming = () => this.lastHomecoming;`.

## Reuse list
- `game/src/social/friendship.ts` — `heartsFromPoints`, `type Friendship`. MUST reuse for the
  heart grading and the friendship map type; do not recompute hearts.
- `game/src/ai/memory.ts` — `remember`. MUST reuse to fold the homecoming memory in (already
  imported in WorldScene).
- `game/src/world/away.ts` — `AwayResult.minutes` is the away duration input; homecoming reads it,
  does not recompute time. Pattern-match away.ts for the pure-module shape.
- `WorldScene.showBubble(dino, text)` — existing floating-bubble helper; reuse for the 👋 beat.
- `this.dinos.find((d) => d.name === ...)` — existing lookup idiom (see `__greet`).

## New dependencies
none.

## Test plan
- **Unit** (`tests/unit/homecoming.test.ts`, vitest):
  - picks the highest-points dino as homecomer.
  - alphabetical tie-break when two dinos share the top points.
  - returns `null` when `awayMinutes < HOMECOMING_MIN_MINUTES` even with a clear favorite.
  - returns `null` when the friendship map is empty / all zero.
  - ignores zero/negative-point dinos when a positive one exists.
  - `line` contains the name and `👋`; high-heart vs low-heart lines differ.
  - `hearts` matches `heartsFromPoints(points)` for the chosen dino.
- **E2E** (`tests/e2e/cycle-030-homecoming.spec.ts`, playwright):
  - boot, `__greet('Sunny')` several times so Sunny is the clear favorite, then
    `__catchUp(LONG_MS)` (e.g. 2 in-game days) → `__homecoming()` returns `{ name: 'Sunny', ... }`
    and the returned object's `homecoming.name === 'Sunny'`; assert a bubble Text containing 👋
    exists on the scene (via a small scene query or the returned line).
  - short absence: fresh boot, `__greet('Sunny')`, `__catchUp(60000)` (1 in-game min) →
    `__homecoming()` is `null`.

## Risks
- **Bubble assertion in e2e**: Phaser Text objects aren't trivially queryable by content. Mitigate
  by asserting through the `__homecoming()` hook + the `__catchUp` return (both carry the line),
  rather than scraping the display list. The bubble *render* is exercised by `playHomecoming()`
  running without throwing; that's enough for the "appears" criterion at e2e altitude.
- **Restore ordering**: homecoming must be computed *after* `this.friendship = save.friendship`.
  Placing the call at the end of the `.then` block avoids reading an empty map.
- **Don't double-fire**: only the restore path and `__catchUp` compute homecoming; the live clock
  pump never does, so no repeat nuzzles during normal play.

## Estimated touch count
~4 files (2 new src/test + 1 e2e + WorldScene). Well within the 6-file limit.

---

## Shipped

**Files touched:**
- `game/src/world/homecoming.ts` (new) — pure `homecoming(friendship, awayMinutes)`, `HOMECOMING_MIN_MINUTES = 360`, `closest()` selector (max points, alpha tie-break, ignores ≤0), `homecomingLine()` heart-graded 👋 template, `Homecoming` interface.
- `game/src/scenes/WorldScene.ts` (modified) — import homecoming; `lastHomecoming` field; `playHomecoming()` helper (find dino by name → `showBubble`); compute in the restore `.then` (after friendship assigned) + write memory + play; same in `__catchUp` (now returns `homecoming`); new `__homecoming()` dev hook.
- `tests/unit/homecoming.test.ts` (new) — 8 tests: selection, alpha tie-break, threshold gate, empty/zero map, ignore-zero, line content + high/low differ, hearts match, memory non-empty.
- `tests/e2e/cycle-030-homecoming.spec.ts` (new) — long absence → Sunny welcome-back beat; short absence → null.

**Deviations from plan:** none. (Distinct from the pre-existing `cycle-030-art.spec.ts`; untouched.)

**Build + unit-test status:** `npm --prefix game run build` ✅ clean; `npm run test:unit` ✅ **185** (+8). Dev server boot → `curl http://localhost:5173/` → **HTTP 200**. E2E left for the QA stage.
