# Cycle 129 — Design

Milestone 13, arc 1 of each track. Two independent items, no shared function, one shared file
(`WorldScene.ts`) touched in two places that do not overlap.

---

## Lore track — BACKLOG-389

**Item:** BACKLOG-389 [emergent] Bullied dino remembers — a dino shouldered past at the hatch files who
grabbed its meal; repeated, it gives that gobbler a wider berth at future drops.

### Why this cycle

401 shipped the per-opponent disposition last cycle and wired it into exactly one decision: whether a
winner holds its tile when a gobbler is *already standing next to it*. That is the last instant of the
encounter. Everything before it — who walks toward the drop at all — is still `reactionToFood(energy,
distance, favorite)`, blind to who else is coming. So a dino that has been out-grabbed by the same rival
three times still trots cheerfully into the same losing contest, and the pecking order is a thing you can
only read in the book (`peckingLine`) or catch in one ticker line.

This item gives the disposition **feet**. It is the shortest path from an existing, tested, pure
derivation to something the player watches happen: at a drop, the dino that hangs back is telling you who
beat it, without a word. It also costs the wary dino a real meal, which is what makes it a character beat
rather than a display — the timid pay for their history.

### What ships

On a food drop, before a dino rushes:

1. The dino looks at the **other in-view dinos that are strictly nearer the food than it is** (the ones
   that will reach it first).
2. If it holds a `wary` disposition (401's `dispositionToward`, off the live recall ring) toward any of
   them, it **gives that one a berth**: it does not rush. It goes on doing whatever it would otherwise do
   — wander, tic, huddle — and never joins the swarm for that drop.
3. The moment it declines, once per drop per dino, it flashes 😬 and the ticker reads
   `😬 <name> hung back — <rival> got to the food first`.
4. When more than one nearer dino is feared, the **most feared** (most negative pecking score) is the one
   named; ties break lexicographically, the `topBy` convention used everywhere else in this park.

Everything else about the drop is unchanged: the swarm, the yield (375), the gobble (387), the stand
(390), the slink-off (394), and the contest resolution (401) all behave exactly as they do today for
every dino that *does* come.

**No memory is filed.** Deliberate, and the sharpest constraint in this spec: the recall ring is 6 slots
and `pecking.ts` **parses that ring** to derive the disposition. A new memory string per declined drop
would roll the very beats the disposition is derived from off the ring, and a dino that hung back twice
would forget why it was hanging back. The berth is behaviour plus a ticker line; the ring is left alone.

### Acceptance criteria

- [ ] `givesBerthTo(memories, nearerNames)` is a pure exported function in `game/src/world/pecking.ts`, unit-tested, returning the name given a berth or `null`.
- [ ] `givesBerthTo([], ['Rex'])` is `null` — an empty history never yields a berth (a fresh park is inert).
- [ ] A dino with a `wary` disposition toward Rex returns `'Rex'` when Rex is in `nearerNames`, and `null` when Rex is not (the rival must be *nearer the food*, not merely present).
- [ ] A dino `confident` toward Rex returns `null` for `['Rex']` — confidence never produces a berth.
- [ ] With two feared names, the one with the more negative `peckingScore` is returned; on an exact tie the lexicographically first is returned.
- [ ] `givesBerthTo` returns `null` for any name whose disposition is `null` — it is filtered through `dispositionToward`, never the raw score, so the feet can never act on a disposition the hatch itself would not act on (the `peckingLine` discipline).
- [ ] In-game: with a staged wary history, a drop placed so the rival is nearer leaves the wary dino out of the swarm — it does not move toward the food while the rival does.
- [ ] The ticker shows `😬 <name> hung back — <rival> got to the food first` exactly once for that dino for that drop (a second tick does not repeat it).
- [ ] A dev hook `__berth()` returns the last berth beat `{ name, rival }` or `null`, and `__berth` is reset to `null` on a new drop.
- [ ] Unit suite and e2e suite green; `npm run build` clean.
- [ ] A dino with no wary disposition toward anyone rushes exactly as before (regression: the existing feeding/escort specs pass untouched).

### Out of scope

- Choosing a *different* food tile ("drifts to a different tile") — this park drops one piece of food at a
  time, so there is no second tile to drift to. The berth is realized as declining the rush, which is the
  same read with the geometry this game actually has. Note in the verdict for the milestone's next arc.
- Any change to `reactionToFood` itself (it stays a pure temperament+distance read; the berth is a gate
  *around* it, so the escort's `rushes()` and `stepDinos` keep reading the identical function).
- Any change to `startEscort`'s stranded-dino read. A wary dino that hangs back may therefore be picked up
  by the 381 escort and walked to the food by a friend. That is a *good* emergent read (the one thing that
  overrides a grudge is a friend fetching you) and is left in on purpose.
- A book line. `peckingLine` (401) already names who a dino is wary of; a second surface would be the
  same fact twice.
- Memory, bond change, or any effect on the disposition itself. The berth reads history; it does not
  write it.

### Constraints

- Pure logic in `game/src/world/pecking.ts`; the gate in `stepDinos`' food branch is the only scene glue.
- `@mlc-ai/web-llm` untouched (nothing here goes near `game/src/ai/`).
- No save-shape change at all (the berth is derived from the memory ring, which is already persisted).
- The berth must be computed from the **same** `this.food` tile and the same in-view set the rush branch
  already has in hand — no second pass over the roster per dino per tick beyond the one it needs.

---

## Structure track — BACKLOG-481

**Item:** BACKLOG-481 [emergent] The council actually decides — the work priority (473) set by council
majority, provider breaking ties. BACKLOG-031, from cycle 1.

### Why this cycle

479 derived the council and gave it nothing to do: a per-zone list of top food-bankers, shown as `👥3` on
the lens and a line in the book. Both of a ground's actual decisions — the spend priority (463) and the
work priority (473) — still read one dino's temperament, so the park's governance is a monarchy with a
visible court. This hands the court one of the two calls, which is precisely BACKLOG-031's ask ("at
threshold population, NPCs vote on a simple rule") and precisely why 031 sat open for 128 cycles: there
was no set of deciders to hold a vote.

The work priority is the safer of the pair (its hooks are the landmark defer, the granary gate and the
regrowth multiplier — none of them can starve a dino), and leaving the spend priority with the provider
means the unchanged call is a live control sitting next to the changed one.

### What ships

`workPriorityFor(zone)` stops being "the provider's temperament" and becomes "what the ground's council
decided":

1. Each seated council member (479, most-banked first) casts the vote its own temperament gives it —
   `providerWorkPriority(traits)`, the existing energy read, unchanged and reused.
2. **Majority wins.** More `'build'` votes than `'gather'` → `'build'`, and vice versa.
3. **The provider breaks a tie.** On an equal split, the provider's own vote decides. If the ground has no
   provider (a council can seat dinos that have banked one unit; the provider role needs three), the
   **first seat** — the ground's biggest contributor — breaks it.
4. A ground that seats **nobody** falls through to exactly today's rule: the standing provider's call, else
   the last provider's lingering call, else `null`.
5. When the resulting call *changes* for a zone that has a council, the ticker lands a one-off beat:
   `🗳️ the <Zone>'s council calls it: <meaning>` using the existing `WORK_CALL` option meaning ("fills its
   stores first" / "raises its walls first"), so the glyph on the lens and the words in the ticker are the
   same table read twice. No beat when nothing changed, and no beat for a ground with no council (that is
   still the provider's own call and 467's handover beat already reports it).

The lens row, the `[?]` legend, the two hooks, the regrowth multiplier and the save field are all
untouched — the call is the same enum from a different mouth.

### Acceptance criteria

- [ ] `councilWorkPriority(votes, tieBreak)` is a pure exported function in `game/src/world/governance.ts`, unit-tested.
- [ ] `councilWorkPriority([], x)` is `null` for any `x` — no council, no council decision (the compatibility seam; the caller then falls through to the provider rule).
- [ ] A single-seat council returns that seat's vote (so a ground whose only banker is its provider reads exactly as it did before this item).
- [ ] `['build','build','gather']` → `'build'`; `['gather','gather','build']` → `'gather'`.
- [ ] An even split returns the `tieBreak` vote when one is supplied (`['build','gather']` with `'gather'` → `'gather'`).
- [ ] An even split with `tieBreak = null` returns `votes[0]` — the biggest contributor's vote, deterministic, never `null`.
- [ ] `zoneCouncil` and `providerWorkPriority` are **reused**, not restated — no second definition of who sits or how a dino votes.
- [ ] In-game: a zone with a seated council of ≥2 whose members' energies disagree with the provider's resolves to the majority, readable via `__workPriority(zone)`.
- [ ] A dev hook `__councilVotes(zone)` returns `{ seats, votes, tieBreak, call }` so a spec can see the vote and not merely the outcome.
- [ ] On a fresh park (nobody has banked anything), `__councils()` is empty for every zone and `__workPriority(z)` returns exactly what it returns on today's `main` for the same save — the whole feature inert.
- [ ] The ticker shows `🗳️ the <Zone>'s council calls it: <meaning>` once when a council flips its ground's call, and does not repeat on the following ticks with the same membership and votes.
- [ ] Save is additive/unchanged: `workPriorityByZone` still round-trips, an old save without it still loads.
- [ ] Unit suite and e2e suite green; `npm run build` clean.

### Out of scope

- The **spend priority** (463). It stays the provider's — the control.
- Seat terms, election cadence, or a persisted electorate — that is BACKLOG-484, seeded this cycle
  precisely because a live-derived council will now flicker.
- Dinos *voicing* the vote (gossip, greeting, a discontent read). The lore track owns voices; a
  "word of how the ground voted" beat is a later arc if the Lore-smith wants it.
- Any change to `handoverBeat` (467). It still reports the ground's current calls on a provider change;
  with the council seated, the work call it reports is simply the council's. Its comment is corrected.
- A lens change. `👥N` (479) already says a council exists and `🧺`/`🧱` already says what it chose.

### Constraints

- Pure logic in `game/src/world/governance.ts` beside `providerWorkPriority`, which it reuses; the seating
  read stays `zoneCouncil` in `game/src/ai/roles.ts`.
- `workPriorityFor` is called on the regrowth tick — it must not build the whole candidate roster more
  than once per call, and it must stay synchronous and allocation-cheap.
- The ticker beat must fire from a place that runs once per step (the same tail `checkProviderHandover`
  runs from), **not** from inside `workPriorityFor`, which is called several times per tick from several
  hooks. A logging side effect inside a read is how you get the same line four times.
- `@mlc-ai/web-llm` untouched. Additive save only.

---

## File overlap (Coder: sequence)

| File | Lore (389) | Structure (481) |
|---|---|---|
| `game/src/world/pecking.ts` | new pure fn | — |
| `game/src/world/governance.ts` | — | new pure fn |
| `game/src/scenes/WorldScene.ts` | `stepDinos` food branch, one dev hook, `lastBerth` field | `workPriorityFor`, the step tail, one dev hook, `lastWorkCallByZone` field |

Both touch `WorldScene.ts` in disjoint regions. Build the structure track first (it is the one with a
persistence-adjacent read), then the lore track, then run the suites once over both.
