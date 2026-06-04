# Cycle 31 — Code Plan

## Item
**BACKLOG-120 [emergent] Jealous nuzzle** — runner-up sulks (😒) when the near-tied closest dino
gets its homecoming 👋.

## Files to create
- `tests/e2e/cycle-031-jealous.spec.ts` — e2e: a near-tie homecoming stages a sulk over the runner-up.

(No new source module — the logic is a small extension of the existing pure `homecoming.ts`.)

## Files to modify
- `game/src/world/homecoming.ts`
  - Add `export const JEALOUS_TIE_POINTS = 10;` (one heart's worth of points — see `heartsFromPoints`, 10 pts/heart).
  - Add `export interface Jealousy { name: string; line: string; memory: string; }`.
  - Add `jealous: Jealousy | null;` field to the `Homecoming` interface (additive — existing fields unchanged).
  - Add a pure `runnerUp(friendship, excludeName)` helper: same selection as `closest` (max points > 0, ties → lexicographically smallest name) but skipping `excludeName`. Reuse/refactor `closest` so both share the "best positive, alpha tie-break" scan (e.g. `closest` calls a generic `topBy(friendship, skip?)`).
  - In `homecoming(...)`: after `best` is chosen, compute `ru = runnerUp(friendship, best.name)`. If `ru` exists **and** `best.points - ru.points <= JEALOUS_TIE_POINTS`, set `jealous = { name: ru.name, line: jealousLine(ru.name), memory: \`the keeper fussed over ${best.name}\` }`; else `jealous = null`. Add it to the returned object.
  - Add `function jealousLine(name: string): string { return \`${name}: Hmph. 😒\`; }` (deterministic, no hearts/persona — line contains the name + 😒).
- `game/src/scenes/WorldScene.ts`
  - `playHomecoming()`: after floating `hc.line` over the homecomer, if `hc.jealous`, find the runner-up dino by name and `showBubble(dino, hc.jealous.line)`.
  - Restore path (~line 1222) and `__catchUp` hook (~line 1260): after `remember(... hc.name, hc.memory)`, also fold the jealous memory when present: `if (hc.jealous) this.memory = remember(this.memory, hc.jealous.name, hc.jealous.memory);`. Factor this into a tiny private `applyHomecomingMemory()` to avoid duplicating the two-line fold in both spots (reuse over copy-paste).
  - `__catchUp` already returns `homecoming: this.lastHomecoming`, so `jealous` rides along automatically — no return-shape change needed beyond the type.
  - Add a dev hook for the e2e to confirm a bubble actually rendered: track live bubble strings. In `showBubble`, push `text` into a `private liveBubbles = new Set<string>()` before the delayedCall and `delete` it in the destroy callback; expose `(window as any).__bubbleTexts = () => [...this.liveBubbles];` next to the other `__` hooks. `// any: dev-only Playwright hook` comment to match house style.

## Reuse list
- `heartsFromPoints`, `Friendship` from `game/src/social/friendship.ts` — already imported by `homecoming.ts`; reuse for the tie threshold rationale (10 pts/heart).
- Existing `closest` scan in `homecoming.ts` — generalize it rather than writing a second near-duplicate selector (`runnerUp` shares the same skip-aware scan).
- `remember` from `game/src/ai/memory.ts` — already imported in WorldScene; reuse for the jealous memory.
- `showBubble` in WorldScene — the one and only bubble path; reuse for the sulk bubble.
- `__greet` / `__catchUp` / `__homecoming` dev hooks — already present; e2e drives these.

## New dependencies
none.

## Test plan
- **Unit — `tests/unit/homecoming.test.ts`** (extend the existing file, new `describe('jealous nuzzle (BACKLOG-120)')`):
  - near-tie (closest 60, runner-up 55) → `jealous` non-null, `name` is the runner-up.
  - runner-up tie among several (closest Rex 60; Glade 55, Mossback 55) → `jealous.name === 'Glade'` (alpha tie-break).
  - exact top tie (Sunny 60, Glade 60) → closest is `Glade` (alpha), `jealous.name === 'Sunny'`, gap 0 ≤ threshold.
  - clear gap (closest 60, runner-up 40) → `jealous` is `null`.
  - boundary: gap exactly 10 (60 vs 50) → `jealous` non-null; gap 11 (60 vs 49) → `null`.
  - single befriended dino (`{ Sunny: 90 }`) → `jealous` is `null`.
  - short absence → `homecoming(...)` is `null` (so no jealous), unchanged.
  - `jealous.line` contains the runner-up name and `😒`; `jealous.memory` contains the closest dino's name and is truthy.
  - Regression: the 8 existing homecoming assertions still pass (additive field).
- **E2E — `tests/e2e/cycle-031-jealous.spec.ts`**:
  - boot; greet two dinos **once each** (e.g. `Sunny`, `Glade`) — `greetGain` clamps each to ≤10 pts, so the two are within 10 → guaranteed near-tie.
  - `__catchUp(2 * DAY_MS)`; assert `result.homecoming` non-null and `result.homecoming.jealous` non-null, with `jealous.name` being the greeted dino that is **not** `homecoming.name`.
  - assert `__bubbleTexts()` includes a string containing `😒` (the sulk bubble rendered).
  - second test (negative): greet only one dino once, `__catchUp(2 * DAY_MS)` → `homecoming.jealous` is `null` (no runner-up).

## Risks
- `greetGain` is trait-seeded, so absolute points vary per dino — the e2e must **not** assert exact points; it relies only on the "one greet ⇒ ≤10 pts ⇒ within-10" invariant for the near-tie, and on greeting a single dino for the negative case. Unit tests own the precise threshold math.
- Tie-break must stay consistent between `closest` and `runnerUp` (both alpha-smallest) or the exact-top-tie case is ambiguous — generalizing one scan avoids drift.
- Bubble tracking Set must delete on destroy or `__bubbleTexts` leaks stale strings across a session; the 3500ms destroy callback already exists — hook the delete there.

## Estimated touch count
~4 files (homecoming.ts, WorldScene.ts, homecoming.test.ts, new e2e). Within budget.

---

## Shipped

**Files touched:**
- `game/src/world/homecoming.ts` — added `JEALOUS_TIE_POINTS`, `Jealousy` interface, `jealous` field on `Homecoming`; generalized `closest`→`topBy(friendship, exclude?)` (shared alpha tie-break); `homecoming()` now computes the runner-up and emits a jealous beat when within threshold.
- `game/src/scenes/WorldScene.ts` — `playHomecoming()` floats a 2nd 😒 bubble for the rival; new `applyHomecomingMemory()` folds both memories (used on restore + `__catchUp`); `showBubble` tracks `liveBubbles`; new `__bubbleTexts` dev hook.
- `tests/unit/homecoming.test.ts` — new `jealous nuzzle (BACKLOG-120)` describe (8 cases incl. near-tie, alpha tie-break, exact-top-tie, clear gap, threshold boundary, lone dino, line/memory content, short absence).
- `tests/e2e/cycle-031-jealous.spec.ts` — near-tie sulk (asserts `jealous` + a 😒 bubble rendered) + lone-favorite no-jealousy.

**Deviations from plan:** none. Touched exactly the 4 planned files.

**Build:** ✅ `npm --prefix game run build` clean.
**Unit tests:** ✅ `npx vitest run` — 193 passed (was 185; +8 jealous cases).
**Dev smoke:** ✅ dev server returns HTTP 200.
