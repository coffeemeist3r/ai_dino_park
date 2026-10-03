# Cycle 176 — Design

The lore track opens Milestone 25 (*the hatch has an audience*); the structure track takes a dead sliver off the
phone's Talk button and makes the hatch's memory strings one thing in one place.

## Lore track — BACKLOG-395

**Item:** BACKLOG-395 [emergent] Witnessed backbone.

**Why this cycle:** the first lore arc of Milestone 25. Every contested-drop beat since cycle 84 happens between two
dinos; the rest of the ground is scenery. On the bowl that wastes the best pair the park has: Mossback (bravery 0.94)
and Glade (0.67) are close friends (founding bond 24) and both bold, and Rex is the gobbler who shoves at them. When
one of them stands, the other is usually a few tiles away. Now it notices.

**What ships:**
- `world/pecking.ts` (pure):
  - `ADMIRE_BAR = 10` — the bond at/above which a witness counts the holder as a friend (one heart; the founding
    bonds on the bowl clear it, strangers do not).
  - `ADMIRE_BOND = 2` — the bond nudge toward the holder (a comfort's size; less than a meet).
  - `admirers(holder, gobbler, onlookers: {name, bond}[]): string[]` — onlookers other than the pair whose bond with
    the holder is ≥ `ADMIRE_BAR`, in the order given.
  - `ADMIRE_ART_KEY = 'admire'`, `ADMIRE_GLYPH = '👏'`.
  - `admiredMemory(holder, gobbler)` → `you saw <holder> stand up to <gobbler>` (a builder — the 483 rule).
  - `admireLine(witness, holder, gobbler)` → `👏 <witness> saw <holder> stand up to <gobbler>`.
- Scene (`resolveContest`, stand branch only): onlookers = dinos in view within `FEED_RANGE` of the food, with their
  bond to the winner. For each admirer: bond +`ADMIRE_BOND` toward the winner, memory `admiredMemory`, ticker
  `admireLine`, and a 👏 pop through `popMark(ADMIRE_ART_KEY, ADMIRE_GLYPH)`. `lastAdmire = { witnesses, holder,
  gobbler }` (null when a stand had no admirer; reset on every other branch the `lastStand` reset sits in).
- The memory is first-hand, so the existing gossip spine (019) retells it at the witness's next meeting with no
  new code ("Glade told me: they saw Mossback stand up to Rex").
- `ADMIRE_ART_KEY` added to `worldPlacedProps` (host for art BACKLOG-579).
- Hook: `__lastAdmire()` → `{ witnesses, holder, gobbler } | null`.

**Acceptance criteria:**
- [ ] Unit: `admirers` keeps a friend of the holder at/above the bar, drops one below it, never returns the holder or
      the gobbler, and is empty for strangers.
- [ ] Unit: `admireLine` / `admiredMemory` read as specified; `worldPlacedProps()` has `ADMIRE_ART_KEY`.
- [ ] E2E (production `checkFeeding`): a bold winner stands against a gobbler with a friend of the winner nearby → the
      friend is in `__lastAdmire().witnesses`, its bond to the winner rose by `ADMIRE_BOND`, its memory carries
      `you saw <winner> stand up to <gobbler>`, and the ticker says `👏 <friend> saw <winner> stand up to <gobbler>`.
- [ ] E2E: the same stand with no friend nearby (strangers) → `__lastAdmire()` is null.
- [ ] E2E: zero console errors.

**Reachability (CHARTER v7):** fresh save, drop food on the bowl among Rex, Mossback and Glade while they are hungry.
When Mossback holds against Rex, Glade (if within seven tiles) gets a 👏 and the ticker names what it saw; at Glade's
next meeting the book's gossip line carries it.

## Structure track — BACKLOG-573 (+ BACKLOG-483 rider)

**Item:** BACKLOG-573 [infra] The export row sits under Talk.

**What ships:**
- `input/touch.ts`: `SHEET_COLUMN_ROWS = 9` and the row pitch from 36 to 35, so the first column's last row
  (`time`, y 344, bottom 359) clears the top of Talk (y 366) and `export` heads the second column. The doc comment
  states the clearance rule instead of the old "base y=64" claim.
- `tests/unit/touch.test.ts`: the clearance check runs over **every** row (not `slice(10)`), and the 552
  byte-identical-first-column pin is rewritten to the new geometry (nine rows at pitch 35).

**Rider — BACKLOG-483:**
- `world/feeding.ts` exports `yieldedMemory`, `repaidMemory`, `snatchedMemory`, `stoodMemory` beside
  `slunkOffMemory`, and `hatchPattern(builder)` — a RegExp built from a builder with the name captured as group 1.
- `WorldScene` writes the four hatch memories through the builders; `manner.ts` and `pecking.ts` build their
  patterns with `hatchPattern` instead of hand-copied literals.

**Acceptance criteria:**
- [ ] Unit: no sheet row intersects any action button or the stick (all 14 rows); rows stay disjoint and on-canvas.
- [ ] Unit: first column is nine rows; `export` is the first row of the second column.
- [ ] Unit: for each builder, `hatchPattern(b).exec(b('Rex'))[1] === 'Rex'`; `mannerTallies` and `peckingRead` count
      memories made by the builders (existing manner/pecking suites stay green — they pin the literal strings).
- [ ] E2E: the existing sheet-column spec stays green (or is updated to the new geometry), and the full suite is green.

**Reachability (CHARTER v7):** on a phone, open ⋯, press the top edge of Talk — it talks; it no longer exports the save.
