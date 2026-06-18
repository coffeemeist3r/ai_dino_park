# Cycle 56 — Code Plan

## Item
BACKLOG-251 [emergent] Gratitude fades — the 247 thanks-line surfaces only while the cleared-name
memory is fresh (within the most-recent `GRATITUDE_FRESH_WINDOW` ring entries), then quiets.

## Approach
One pure change in `world/cold.ts`: gate the existing `whoClearedMyName` read-back parser to the
**tail window** of the memory ring. The parser already scans most-recent-first; today it scans the
whole ring, so a grateful memory keeps surfacing the thanks until it is pushed out at 6 entries.
Bound the scan to the last `GRATITUDE_FRESH_WINDOW` entries — once that many *newer* memories are
filed on top, the grateful memory falls out of the window and the parser returns `null`, so both the
canned thanks line and the LLM prompt weave (which both read the `gratitude` ctx WorldScene computes
from this parser) go quiet together. No WorldScene/brain change — the gate is inherited at both call
sites (`pickTone` greet ctx + `__greetPrompt`). No new memory field, no save change: freshness is
read from ring position, the only deterministic age signal the plain `Record<string,string[]>` ring
carries.

`GRATITUDE_FRESH_WINDOW = 3` (≤ the ring's `DEFAULT_MAX` of 6): gratitude surfaces while the clearing
is among the dino's 3 freshest memories, then fades. Exported so the unit test pins it and a later
beat can re-tune.

## Files to create
- `tests/unit/cycle-056-gratitude-fades.test.ts` — the fade gate over `whoClearedMyName`.
- `tests/e2e/cycle-056-gratitude-fades.spec.ts` — fresh greet names the clearer; after burying the
  memory under `GRATITUDE_FRESH_WINDOW` newer ones, the greet no longer names it.

## Files to modify
- `game/src/world/cold.ts` — add `export const GRATITUDE_FRESH_WINDOW = 3;` beside `CLEARED_NAME_SUFFIX`
  (with a doc line tying it to BACKLOG-251), and change `whoClearedMyName`'s loop lower bound from `0`
  to `Math.max(0, mems.length - GRATITUDE_FRESH_WINDOW)` so it scans only the freshest window. Update
  the function's doc comment to note the freshness gate (drop the obsolete "whole ring" framing).

## Reuse list
- `whoClearedMyName` / `CLEARED_NAME_SUFFIX` / `recall` / `isShareable` — all already in `cold.ts`;
  this is a bound change on the existing parser, no new symbol beyond the window const. Modify in place
  (the constraint): WorldScene's two call sites (line 1684 `__greetPrompt`, line 2167 `pickTone`) and
  the brain paths need zero edits.
- `__rememberGrateful(sufferer, clearer)` (WorldScene dev hook) — plants the grateful memory in e2e.
- `__rememberCold(name)` (WorldScene dev hook) — files a plain `coldMemory()`; used as **filler** to
  bury the grateful memory under newer entries (cold memories never end in ` cleared my name`, so they
  push the grateful memory down the ring without themselves matching). No new hook needed.
- `__pickTone` / `__dialogPage` / `__greetPrompt` — existing e2e drivers (cycle-055 pattern).
- `gratefulMemory` — unit test builds the planted memory string the same way the parser expects.

## New dependencies
none.

## Test plan
### Unit (`tests/unit/cycle-056-gratitude-fades.test.ts`)
- `GRATITUDE_FRESH_WINDOW` is a positive integer and ≤ 6 (the ring size).
- grateful memory as the *newest* entry → `whoClearedMyName` returns the clearer (247 regression).
- grateful memory with `GRATITUDE_FRESH_WINDOW - 1` newer memories on top (still inside the window) →
  still returns the clearer.
- grateful memory with exactly `GRATITUDE_FRESH_WINDOW` newer memories on top (just outside) → `null`,
  asserting the grateful memory is still present in the ring (faded, not forgotten).
- grateful memory with `GRATITUDE_FRESH_WINDOW + 2` newer memories → `null`.
- a fresh grateful memory shadowed by an *older* (out-of-window) grateful memory for a different clearer
  → returns the fresh one (most-recent-in-window wins; pins scan direction under the new bound).

### E2E (`tests/e2e/cycle-056-gratitude-fades.spec.ts`)
- Boot; `__rememberGrateful('Mossback','Twitch')`; `__pickTone('Mossback','warm')`; reply names
  `Twitch` and `__greetPrompt('Mossback')` contains `cleared your name` (fresh → thanks).
- Then `__rememberCold('Mossback')` ×`GRATITUDE_FRESH_WINDOW` (read the exported const via a tiny
  import or hard-code 3 with a comment) to bury it; `__pickTone('Mossback','warm')` again; reply does
  **not** contain `Twitch` / `I owe them one` and `__greetPrompt('Mossback')` does **not** contain
  `cleared your name` (faded → normal greeting). No console errors.

## Risks
- **Window-size vs cycle-055 specs:** the five existing `whoClearedMyName` assertions keep the grateful
  memory in the most-recent 1–2 slots, so any window ≥ 2 leaves them green. `=3` is safe; do not lower
  below 2.
- **E2E async timing:** `pickTone` resolves the reply async — `waitForTimeout(150)` after each pick
  before reading the dialog (cycle-055 precedent).
- **Hard-coding 3 in e2e:** prefer importing `GRATITUDE_FRESH_WINDOW` into the spec, or loop "bury
  until faded" a fixed 3 times with a comment pointing at the const, so the spec can't silently drift
  if the const changes. Low risk; a comment is enough.

## Estimated touch count
~3 files (`cold.ts` + 2 new tests). Well within budget.

## Shipped
Files touched (exactly the plan, 3):
- `game/src/world/cold.ts` — added `export const GRATITUDE_FRESH_WINDOW = 3` (doc tied to BACKLOG-251)
  and bounded `whoClearedMyName`'s reverse scan to the freshest window (`fresh = max(0, len - WINDOW)`);
  doc comment updated to describe the freshness gate. No other symbol added.
- `tests/unit/cycle-056-gratitude-fades.test.ts` — 6 assertions: const sanity, fresh/in-window names
  the clearer (247 regression), faded-but-still-present returns null, buried-deep null, fresh-clearer
  beats a faded older one.
- `tests/e2e/cycle-056-gratitude-fades.spec.ts` — 1 spec, the full transition: fresh greet names the
  clearer (canned line + `__greetPrompt`), bury under `FRESH_WINDOW` cold memories, greet again names
  none (both paths quiet), no console errors.

No deviations from the plan. No WorldScene/brain edit — both `whoClearedMyName` call sites inherit the
gate. No `ai → world` import. No save-format change, no new dependency, NPCBrain boundary untouched.

**Build:** ✅ clean (`npm --prefix game run build`, built in 9.01s).
**Unit:** ✅ 500 passed (was 494; +6 new). Full suite, 48 files.
**Dev server:** ✅ `http://localhost:5173/` → HTTP 200 (started, curled, killed).
**Full e2e:** deferred to QA's run.
