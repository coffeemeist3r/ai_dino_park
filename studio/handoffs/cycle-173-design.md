# Cycle 173 — Design

## Lore track — BACKLOG-136

**Item:** BACKLOG-136 [emergent] Comfort is for friends.

**Why this cycle.** It is the last open arc of Milestone 23, and the one that makes the graph *act*. The
book now names who is close to whom and the numbers move — but the only behaviour that reads the graph
to decide who walks somewhere for somebody, `comforter()`, uses a floor of 8, which every founding pair
clears, and it only runs for two sulks nobody reaches in a sitting (the homecoming's needs an absence; the
distress cry needs a startle or a cold night). The sulk a player causes in the first minute — the dino that
loses the scramble at the hatch (`shoulder`, 544) — has never had anybody come for it at all.

**The reshape (CHARTER v7).** The item as filed is a threshold change on a path the player cannot reach in
ten minutes. It ships on the reachable sulk instead, and the bar it introduces is the book's own word:
a friend comes if the book would call them **close** (`🤝 close to …`, bond ≥ 25). What the book promises
is what the park does.

**What ships.**
1. `CLOSE_BOND = 25` is exported from `social/closest.ts` and `friendLine` uses it (byte-identical output).
2. `comforter(sulker, bonds, names, gratitude?, floor = COMFORT_BOND_FLOOR)` gains an optional floor.
   Every existing caller passes nothing and is unchanged; the reciprocity override still ignores the floor.
3. When a dino enters the `shoulder` funk, the park asks `comforter(loser, bonds, <dinos on the loser's
   ground>, gratitude, CLOSE_BOND)`.
   - **Somebody clears the bar:** that friend gets a transient errand (`pendingConsole`), the ticker says
     `🫂 <friend> is heading over to <loser>`, and the friend walks toward the loser's live tile one tile per
     world step (the distress walk's shape, same priority tier). On adjacency, if the loser is still sore:
     the funk clears, the friend floats `comfortLine`, a comfort mark pops over the friend
     (`makeHourMark(COMFORT_ART_KEY, '🫂')`, 1.2 s — the crown's shape), the pair's bond grows by
     `COMFORT_BOND`, the loser remembers `comfortMemory(friend)`, gratitude is recorded, `lastComfort` is
     set, and the ticker says `🫂 <friend> talked <loser> round after the hatch`. The errand gives up after
     `CONSOLE_STEPS` steps or the moment the funk has already ended (keeper greet/feed, or it
     shook it off).
   - **Nobody clears it:** the ticker says who *didn't* come — `🫥 nobody came for <loser> — <closest>
     isn't close enough` naming the loser's highest-bond dino on its ground, or `🫥 nobody came for <loser>
     — nobody here knows it` when no bond there is above zero. The funk runs as it always has.
4. `COMFORT_ART_KEY` joins `worldPlacedProps` (the reachability register), so BACKLOG-572 is drawable.

**Acceptance criteria.**
- [ ] `comforter` with `floor = CLOSE_BOND`: a peer at 24 is refused, a peer at 25 comes; with no floor
      argument the old floor (8) still applies; the reciprocity override still ignores the floor. (unit)
- [ ] `friendLine` output unchanged at 24/25/59/60 after the refactor to `CLOSE_BOND`. (unit)
- [ ] `unconsoledLine(loser, closest | null)` returns both forms and names both dinos. (unit)
- [ ] `COMFORT_ART_KEY` is in `worldPlacedProps()`. (unit)
- [ ] e2e: bond Rex↔Glade to ≥ 25 (strangers fixture, gathered), force a contest Glade loses → the ticker
      carries `🫂 Rex is heading over to Glade`; driving steps, Rex ends adjacent, Glade's funk is gone
      before its 20-step window, Glade's memory has `Rex came over to comfort me`, the Rex↔Glade bond
      grew by `COMFORT_BOND`, and the ticker carries `talked Glade round`.
- [ ] e2e: as-shipped founding state, contest Glade loses (Glade's best bond is Mossback at 24 —
      *friendly*, not close) → nobody walks, the ticker carries `🫥 nobody came for Glade — Mossback isn't
      close enough`, and the funk still runs its 20 steps (cycle-157 spec stays green unchanged).
- [ ] e2e: a keeper greet while the friend is still walking ends the funk *and* the errand (no double
      ending, keeper credited, no comfort memory).
- [ ] Full suite green; no save change.

**Out of scope.** Raising the floor for the homecoming sulk or the distress cry (both keep 8 — a cry turns
anybody who knows you, and the homecoming is out of reach in a sitting; both are named in the verdict).
Drawing the mark (572, the Artist). LLM line variants.

**Constraints.** Transient errand, never persisted. `onErrand` must include the consoler so a vigil/mend
cannot steal it. Ground-scoped: only dinos on the loser's ground are candidates. WorldScene overlap with the
structure track: different methods (`resolveContest`/`shoulderFunk`/movement vs `onTouchButton`).

## Structure track — BACKLOG-552

**Item:** BACKLOG-552 [infra] The More sheet is full — a second column.

**Why this cycle.** Top of the Structure Track; every keeper verb since cycle 160 has shipped keyboard-only
because the phone's overflow sheet is at its geometric ceiling (ten rows). The Android PWA is a shipping
surface.

**What ships.** Option (b): `sheetRows(width)` lays rows out in columns of ten — the first ten exactly where
they are today (right column, byte-identical geometry), rows 11+ in a second column to its left at the same
pitch. Four keyboard-only verbs get rows: `🏠 read room` (R, `toggleRoom`), `🌱 plot` (P, `handlePlot`),
`📖 next entry` (N, `stepBookCursor`), `❔ help` (?, `toggleHelp`). The scene draws and hit-tests the sheet
from `sheetRows` as it does now, so no scene layout code changes; `onTouchButton` gains four cases.

**Acceptance criteria.**
- [ ] `sheetRows(640)` returns 14 rows; the first ten are byte-identical to today's (ids, x, y, w, h). (unit)
- [ ] Every pair of rows is disjoint; every row is on canvas; no row intersects an action-button circle or
      the stick's grab ring (at 640×480). (unit)
- [ ] Rows 11–14 share one x, left of the first column, with no horizontal overlap. (unit)
- [ ] e2e (touch on): open More, tap the `room` row → the Read-the-Room path runs (the non-Aki refusal or
      the readout — whichever the keeper is, the same thing `R` produces). Tap `help` → `__helpOpen()` true.
- [ ] e2e: tap `next entry` with the book lens up → the book cursor moves (same hook the N spec reads).
- [ ] Existing touch-controls spec green unchanged.

**Out of scope.** Pagination, scrolling, the `[` / `,` / `.` reverse steppers (the feed hold already covers
`.`), portrait-specific layout.

**Constraints.** `sheetRows` stays pure geometry. Keep the ten-row comment's reason, restated for columns.
