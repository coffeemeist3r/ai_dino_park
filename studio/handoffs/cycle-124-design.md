# Cycle 124 — Design

Both tracks close **Milestone 11**. If both land, the milestone ships this cycle.

---

## Lore track — BACKLOG-360

**Item:** BACKLOG-360 [social] Pond pilgrimage — two pond-swap companions (346) may later cross to the
grove *together* (a near-simultaneous migration) to revisit the place they bonded over, so shared-place
friendship becomes shared travel, not just shared talk.

### Why this cycle

Milestone 11's last lore arc, and the one that makes the park's oldest social record do something. Every
crossing this park stages — ambient (334), homesick (340), scarcity (450), hearsay (458), longing (362) —
moves exactly one body; in 124 cycles the bond graph has never put two dinos on the road at once. Meanwhile
346 has been filing `🌿 traded pond stories with <name>` into the memory ring since cycle 76: a durable,
persisted, per-pair record of *two dinos who bonded over a place*, read by nothing. 360 is the first thing
to ask it a question, and the question is the arc's own sentence — do they ever go back there together?

### What ships

A **companion pull** on the migration departure seam. When a dino sets off on a crossing that is already
bound for the ground it once traded pond stories about, the dino it traded them *with* — if that one lives
on the same ground and isn't already crossing — sets off with it on the same roll.

Observable, in order:

1. Two dinos have both been to the grove and have met back home, so each carries the other's pond-swap
   memory (this is 346, unchanged; it is the precondition, not new behaviour).
2. Later, one of them starts a crossing whose destination is the grove — by any of the existing routes
   (ambient/scarcity, homesick, hearsay, longing). The destination is **not** re-decided by this feature.
3. Its pond-swap companion is marked migrating toward the same ground on the same roll, floats a bubble,
   and both file a memory naming who they went with and where. Both are then walking to the edge, and the
   existing `crossDino` arrival handles each of them independently.
4. A small bond strengthens between them at departure — the travelling twin of the `POND_BOND` 346 grants
   for the talk.
5. A ticker line names the pair and the ground.

Dormant on a fresh save by construction: a pond swap requires both dinos to have already crossed to the
grove *and* met back in a shared zone, so a park nobody has walked cannot fire this at all.

### Acceptance criteria

- [ ] A pure module exposes the pair read: given a leader's memory entries and a candidate list, it returns
      the candidate whose `pondSwapMemory(candidate)` the leader carries, or `null`.
- [ ] The pair read is **deterministic**: with two eligible companions in the candidate list, the same call
      returns the same name every time (first in candidate order). No `Math.random` anywhere in this feature.
- [ ] The companion pull returns `null` when the crossing's destination is not the shared ground (the
      grove), even when a pond-swap companion is available.
- [ ] The companion pull returns `null` when the companion is already migrating, or lives on a different
      ground than the leader.
- [ ] The companion pull returns `null` for a leader carrying no pond-swap memory.
- [ ] After a fired pull, `__migrating()` contains **both** names.
- [ ] After a fired pull, each of the two dinos' recalled memories contains a together-memory naming the
      other dino and the destination ground by name.
- [ ] The bond between the two is strictly greater after the pull than before it.
- [ ] The ticker records a line naming both dinos and the destination ground.
- [ ] On a freshly booted park (nobody has crossed anywhere), driving the departure seam for every dino
      fires no companion pull at all — the beat is inert until 346 has actually happened.
- [ ] `npm run build` clean; full unit + e2e suites green with no pinned migration spec amended.

### Out of scope

- **No new destination logic.** The companion rides the destination already chosen; it never picks one, and
  it must not influence `scarcityDestOf`, `plentyDestOf`, `yearnDestOf` or `pickMigrant`.
- **No generalization of the shared-place bond past the grove.** 346 records exactly one place. The module
  takes the shared ground as a parameter so a second shared-place bond is a caller change, but wiring one is
  a later item — retro-firing a grove beat for the Fernreach creek is precisely what `atWater`'s comment
  warns against.
- **No group larger than two.** One companion per departure.
- **No arrival beat, no collection-book line, no save-shape change.** The memory ring and `bonds` are both
  already persisted; this feature adds no new persisted field.

### Constraints

- Nothing may be added to `pickMigrant`. That method's tier order is pinned by the cycle-076/078 specs.
- The pull must fire from the same seam in production and under the dev hooks, so `__maybeMigrate` and
  `__homesickMigrate` exercise the identical path (they call `scarcityMigrate` / `tryHomesick` directly,
  **not** `maybeMigrate` — hook the pull inside those two, not in `maybeMigrate`).
- The companion's crossing is started through the existing `startMigration`, so the edge choice, the
  `migrationCross` record and every arrival behaviour (carry, pioneer, seen, crossings tally) are unchanged.
- No file overlap with the structure track.

---

## Structure track — BACKLOG-477

**Item:** BACKLOG-477 [core] Both of the ground's calls, on the lens.

### Why this cycle

Milestone 11's last structure arc. The lens box's prosperity line has accreted five independent reads, two
of which are governance calls appended by the cycles that invented them (468's 🍽️/🏦, then 473's 🧺/🧱 by
copying it). Nothing tells the player those two are the same *kind* of fact, and nothing anywhere in the
game says what any of the four glyphs mean. Both of last cycle's closing stages flagged the line
independently — the Validator withheld a crowding glyph so it would not become the sixth read, and the
Artist fire recorded the same judgement from the art side. A third call is coming (479 is now queued); this
is the cycle to make it a row instead of a redesign.

### What ships

1. **A table.** `world/governance.ts` gains one descriptor per governance call — its name, and for each
   possible value a glyph and a one-line plain meaning — plus an ordered array of those descriptors. The
   two existing enums (`SpendPriority`, `WorkPriority`) are described by it; nothing about how they are set
   or read by the sim changes.
2. **One folded line, derived from the table.** A pure function turns a ground's current call values into a
   single compact governance row for the lens box. An **unset** call renders a placeholder rather than
   collapsing, so position one is always the pantry call and position two is always the labour call — a
   partly-decided ground can't be misread as a fully-decided one. A ground with **no** calls set at all
   renders nothing, so a young park's map is exactly as it is today.
3. **A legend, from the same table.** The `[?]` controls panel gains a governance section listing each
   call's glyphs and meanings, and the placeholder. Because it is generated from the same descriptors the
   line is, the legend cannot drift from the glyphs it explains.
4. **The box.** The two glyphs come off the end of the prosperity line; the governance row is drawn as its
   own line, and the box grows to fit it (it already grew once, for 446's banked-food line).

### Acceptance criteria

- [ ] `GOVERNANCE_CALLS` is an ordered array of descriptors; the folded line and the legend are both
      derived from it, and adding a third descriptor changes neither function's body.
- [ ] The folded line for `feed` + `build` contains both 🍽️ and 🧱, in table order (pantry before labour).
- [ ] The folded line for a ground with a spend call and no work call still renders two positions — the
      spend glyph and the unset placeholder — so the row's width and meaning are position-stable.
- [ ] The folded line for a ground with **no** calls set is the empty string.
- [ ] `spendGlyph`/`workGlyph` keep their existing behaviour (they are the descriptors' data now, so their
      existing unit tests must pass unamended).
- [ ] The legend names every glyph that the line can render, including the placeholder: for each of the four
      values there is a legend line containing that glyph and a human meaning.
- [ ] The `[?]` panel text contains the legend at runtime (checked through a dev hook on the panel's text),
      and still contains every controls row it did before.
- [ ] The drawn zone-map box text contains the folded governance line for a ground whose provider has set a
      policy, and the prosperity line of that box no longer ends with the two governance glyphs.
- [ ] A freshly booted park's zone-map boxes contain no governance row at all.
- [ ] `__zoneMap()` still returns `spend` and `work` per entry (the model is unchanged; this item changes
      the rendering), so the cycle-117 and cycle-121 lens specs pass unamended.
- [ ] `npm run build` clean; full unit + e2e suites green.

### Out of scope

- **No change to how a policy is set or read by the sim.** `providerPriority`, `providerWorkPriority`, all
  four hooks and the handover beat (467) are untouched.
- **No new governance call.** 479 is queued and is not this cycle.
- **No crowding glyph.** 476 shipped without one deliberately; adding it here would be scope creep wearing
  the item's own justification as a costume. If a later cycle adds it, it is a governance-adjacent *state*,
  not a *call*, and does not belong in this table.
- **No rework of `zoneMapModel`'s positional-argument list.** It is a known smell and a separate item; the
  model already carries `spend` and `work`.

### Constraints

- The `null` compatibility seam that every governance function honours (`null` → today's behaviour) must
  hold in the new functions too: no calls set → empty line, and nothing added to the box.
- `ui/controlsHelp.ts` may import from `world/governance.ts` (both are pure, no Phaser); the reverse import
  must not be added.
- The lens box must not grow so tall that four boxes overflow the canvas — one added line only.
- No file overlap with the lore track.
