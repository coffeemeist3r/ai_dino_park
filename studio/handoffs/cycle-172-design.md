# Cycle 172 — Design

## Lore track — BACKLOG-127: the inner circle

**Player story.** I open the book and the first thing under the title is where *I* stand: my three
closest dinos, ranked, hearts beside each. Before I have greeted anybody it says so. When a dino I have
been greeting climbs into the top three, a gold crown pops over it where it stands, and the ticker says
it joined my inner circle.

**Spec.**
- `social/circle.ts` (pure): `innerCircle(friendship, roster, n = 3)` — up to three `{ name, hearts }`,
  highest points first, only dinos in `roster` with points > 0, ties by the homecoming's tie-break.
  Built by calling `topBy` (homecoming.ts) repeatedly, so there is one tie-break in the park, and the
  circle's #1 is by construction the dino the homecoming picks.
- `circleLine(circle)` — `♛ your inner circle: 1 Rex ♥3 · 2 Sunny ♥1 · 3 Pip ♥0`, or
  `♛ your inner circle: nobody yet — say hello` when empty. Hearts shown as a count (the book's bars are
  long already).
- `joinedLine(name, rank)` — `♛ Pip has joined your inner circle (#3)`.
- `newcomers(prev, next)` — names in `next` not in `prev`.
- The book: `bookLines` gains an optional `circle` line printed straight under the title, above the
  away-log. Default absent → every existing literal renders byte-identical.
- The scene checks the circle every frame (before the dialog early-return, since greeting bumps
  friendship with the dialog open) and, for each newcomer, logs `joinedLine` and pops the crown mark
  over that dino (`makeHourMark('circle', '♛')`, the `popCallNote` shape, ~1.2 s) if it is in view.
  The first read after boot and after a save restore seeds silently — no join spam on load.
- `'circle'` joins `worldPlacedProps` (the host exists, so 569 can be drawn).
- Hooks: `__innerCircle()` → the current circle; `__circleJoins()` → count of crown pops.

**Acceptance criteria.**
- L1 `innerCircle` returns ≤3 entries, sorted by points desc, excludes 0-point and off-roster names.
- L2 Ties break by name exactly as `topBy`; the circle's #1 equals `homecoming(...)`'s name for any
  friendship map (property test over several maps).
- L3 `circleLine` empty wording and ranked wording as specified.
- L4 `bookLines` with no circle argument is byte-identical to before; with one, the circle line is line 2.
- L5 Fresh save e2e: the book shows `nobody yet`; greet one dino → the book shows it as #1, the ticker
  shows `has joined your inner circle`, and a crown pop was counted.
- L6 A restored save with friendship does not post join lines on load.
- L7 `circle` is in `worldPlacedProps`.

## Structure track — BACKLOG-570: bonds drift

**Spec.**
- `social/bonds.ts`: `BOND_REST = LONER_FLOOR` (8, imported, not copied), `BOND_DRIFT = 0.004`,
  `driftBonds(bonds, rate = BOND_DRIFT)` → new map; each value > rest becomes
  `rest + (v − rest)·(1 − rate)`; values ≤ rest unchanged; returns the same object when nothing moved.
- `WorldScene.forceStep`: one call, inside the existing `!ambientHeld` gate, before the meeting loop
  (so this step's meetings land after this step's cooling).
- No save change; no offline-catch-up drift (away time does not cool bonds — named, not built).
- Hook `__bondDrift()` → `BOND_DRIFT` for specs.

**Acceptance criteria.**
- S1 A bond above rest decreases toward rest and never crosses it; a bond at or under rest is untouched.
- S2 Equilibrium: iterating drift + `meetGain` every step from 0 settles between 85 and 95 (not ≥99).
- S3 A pair apart for 200 steps from 30 lands between 15 and 20 (visible within ten minutes).
- S4 No threshold at 8 can be crossed by drift alone (unit, over values just above 8).
- S5 e2e: with ambient running, a pair set to 60 on different grounds reads lower after a few steps
  but still ≥ 8; a held ambient does not drift.
- S6 Full suites green.
