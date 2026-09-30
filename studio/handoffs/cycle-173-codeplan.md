# Cycle 173 — Code Plan

## Lore track — BACKLOG-136

**Item:** Comfort is for friends.

**Files to modify**
- `game/src/social/closest.ts` — export `CLOSE_BOND = 25`; `friendLine` reads it instead of the literal 25.
- `game/src/world/comfort.ts` — `comforter(..., gratitude?, floor = COMFORT_BOND_FLOOR)`; export
  `CONSOLE_STEPS = 8`, `COMFORT_ART_KEY = 'comfort'`, `COMFORT_GLYPH = '🫂'`, `headingOverLine(friend, loser)`,
  `talkedRoundLine(friend, loser)`, `unconsoledLine(loser, closest | null)`.
- `game/src/world/reachability.ts` — `worldPlacedProps` adds `COMFORT_ART_KEY`.
- `game/src/scenes/WorldScene.ts`
  - field `pendingConsole: { friend, loser, steps } | null` (transient).
  - `shoulderFunk(name)` → after entering the funk, call new `sendConsoler(name)`.
  - `sendConsoler(loser)`: candidates = dinos on the loser's ground (`zoneOf(dinoZones, …, BOWL_ID)`),
    `comforter(loser, bonds, names, gratitude, CLOSE_BOND)`; hit → set errand + log `headingOverLine`;
    miss → `closestFriend(loser, bonds, names, 0)` (reuse, `social/bonds.ts`) → log `unconsoledLine`.
  - movement loop: beside the distress walk, the consoler steps toward the loser's live tile
    (`activityById = 'responding'`).
  - `stepConsole()` beside `stepResponder()`: funk no longer `shoulder` → drop errand; adjacent → resolve
    (clear funk, bubble `comfortLine`, `popComfortMark`, `strengthen` + `COMFORT_BOND`, memory, gratitude,
    `lastComfort`, log `talkedRoundLine`); else decrement, drop at 0.
  - `onErrand` includes `pendingConsole?.friend`.
  - hook `__consoler()` → the errand or null.

**Reuse list:** `comforter`, `comfortLine`, `comfortMemory`, `recordGratitude`, `COMFORT_BOND`
(`world/comfort.ts`); `closestFriend`, `strengthen` (`social/bonds.ts`); `stepToward`; `makeHourMark` +
the `popCircleMark` shape; `clearFunk`/`funkOf`; `logEvent`; `zoneOf`.

**New dependencies:** none.

**Test plan**
- Unit `game/src/world/cycle-173-comfort.test.ts`: floor param (24 refused / 25 comes / default 8 intact /
  reciprocity ignores floor); `friendLine` boundaries; `unconsoledLine` both forms; `COMFORT_ART_KEY` in
  `worldPlacedProps`.
- E2E `tests/e2e/cycle-173-comfort-is-for-friends.spec.ts`: close friend walks over and talks the loser round;
  as-shipped Glade (Mossback 24) — nobody comes, ticker names Mossback, funk still holds past step 8; keeper
  greet mid-walk ends both.

**Risks:** the contest can fire inside `checkFeeding` with the scene mid-step — the errand only sets state,
the walk happens next step. `forceContest` is production code, so e2e exercises the real path.

**Estimated touch count:** ~6 files.

## Structure track — BACKLOG-552

**Item:** The More sheet is full — a second column.

**Files to modify**
- `game/src/input/touch.ts` — `sheetRows`: ids grow `room`, `plot`, `book`, `help`; row `i` sits in column
  `floor(i / 10)` at `x = width - 12 - w/2 - col * (w + 8)`, `y = 64 + (i % 10) * (h + 6)`.
- `game/src/scenes/WorldScene.ts` — `onTouchButton`: `room` → `toggleRoom()`, `plot` → `handlePlot()`,
  `book` → `stepBookCursor()`, `help` → `sheetOpen=false; toggleHelp()`.
- `tests/unit/touch.test.ts` — the sheet test becomes: first ten ids + geometry unchanged, 14 rows, pairwise
  disjoint, on canvas, clears action circles + stick grab ring.

**Reuse list:** `inRect`, `actionButtons`, `STICK` (`input/touch.ts`).

**New dependencies:** none.

**Test plan**
- Unit as above.
- E2E `tests/e2e/cycle-173-sheet-columns.spec.ts`: Aki picked (K,1), touch on, More → `room` → `__roomOpen()`;
  More → `help` → `__helpOpen()`; book lens up, More → `book` → the ▸ entry moves.

**Risks:** `toggleHelp` may be modal; closing the sheet first keeps taps from landing on it.

**Estimated touch count:** ~4 files. Cross-track: WorldScene only, disjoint methods; do the structure edit first.
