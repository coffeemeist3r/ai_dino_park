# Cycle 145 — Code Plan

Two tracks, one shared file (`world/founding.ts`). Lore lands first; the register then reads what it left.

---

## Lore track — BACKLOG-516 (the founding standing says "first across" about a dino that never crossed)

### Prior art (reuse, do not re-implement)

- `world/pioneer.ts` — owns the record and both line builders. Already routes names through `theZone`.
- `world/founding.ts` — owns `foundingPioneers()`, the complete list of spawn-foundings. The derivation goes here.
- `world/standings.ts` — the one place standings are derived (482). Already imports `pioneer.ts` and `zones.ts`;
  adding `founding.ts` closes no cycle (`founding` imports `pioneer` for a *type* only, and never `standings`).
- `WorldScene.bookRows()` calls `standingLines(...)` and needs **no change** — the kind rides the standing.

### Files

| file | change |
|---|---|
| `game/src/world/pioneer.ts` | `export type FoundingKind = 'born' \| 'crossed'`; `pioneerLine(zoneId, kind)` gains the kind and returns the matching sentence. `pioneerEvent`, `recordPioneer`, `pioneerOf`, `foundedBy` untouched. |
| `game/src/world/founding.ts` | `export function foundingKind(pioneers, zoneId): FoundingKind` — `born` iff `foundingPioneers()[zoneId] === pioneers[zoneId]`, else `crossed`. |
| `game/src/world/standings.ts` | `Standing` gains `via?: FoundingKind`; `zoneStandings` sets it on the pioneer standing via `foundingKind`; `standingLine` passes it to `pioneerLine`. Emission order unmoved. |
| `tests/unit/cycle-119-pioneer.test.ts` | updated for the new `pioneerLine` arity — both wordings asserted. |
| `game/src/world/cycle-144-articles.test.ts` | updated the same way; the repo-wide article grep is untouched and must stay green for **both** sentences. |
| `tests/unit/cycle-131-standings.test.ts` | updated where it asserts the pioneer line. |
| `tests/unit/cycle-145-founding-kind.test.ts` | **new** — `foundingKind` over the shipping roster, the Saltpan crossing case, and the book fold. |
| `tests/e2e/cycle-145-founding-kind.spec.ts` | **new** — the book on a fresh save. |

### Sequencing

`pioneer.ts` → `founding.ts` → `standings.ts` → the three test updates. Then the structure track.

---

## Structure track — BACKLOG-501 (the reachability register)

### Files

| file | change |
|---|---|
| `game/src/world/reachability.ts` | **new** — `ReachabilityEntry`, `REACHABILITY_REGISTER`, `darkEntries()`. Pure; imports only the pure founding surface (`founding`, `zones`, `frontier`, `resource`, `upkeep`, `clock`, `bank`, `pioneer`, `art/propArt`). |
| `tests/unit/cycle-145-reachability.test.ts` | **new** — walks the register, fails naming `id` + `fact`; plus the shape invariants (unique ids, non-empty prose). |

### The entries

Nine, not eight: the design's table plus one claim **nobody has ever checked**, which is the whole point of the
first walk. Each `holds()` goes through the production function that owns the fact.

1. **486/500 — the cast is spread, not stacked.** `foundingResidents()`: at most one ground wakes empty.
2. **488 — a broken landmark, and somebody to mend it.** `FOUNDING_RUIN`'s ground has residents and a pile
   covering `REPAIR_COST`, read through `pileTotal`.
3. **492/497 — a vote with something to count.** `foundingCouncils()` seats two somewhere.
4. **493 — a day boundary inside a session.** `ACTIVE_SCALE` puts a whole in-game day inside `SESSION_MINUTES`.
5. **503 — one thing that exists on the Ridge and nowhere else.** `ZONE_EXCLUSIVE` names a ground, and that
   ground has residents to fetch it.
6. **505 — a frontier that is actually a frontier.** Exactly one ground reads `isUnsettled` at boot.
7. **512 — the book names a founder for every ground the roster wakes on.** `foundingPioneers()` vs `foundingResidents()`.
8. **516 — and says whether they were born there or walked in.** Both kinds reachable from the founding state.
9. **NEW — every rig the park has drawn is a rig the park can put on the ground.** `PROP_RIGS` against the set
   of keys the shipping world actually places. This is the claim nobody wrote down, and it is the one the
   Structure-smith's condition was aimed at: art authored under the cycle-91 stash rule has no deadline
   attached, so a stashed rig can sit undisplayed for as long as nobody counts. **Expected dark on the first
   walk** — `founder_stake` and `founder_stake_hollowed` were drawn last night and nothing plants them.

### The repair the first walk demands — the founder's stake gets planted

Entry 9 comes up dark, so per the design it **ships fixed in this cycle**. This is also the natural landing for
the lore track: 516 teaches the park to *say* how a ground was founded; this puts the saying on the ground.

| file | change |
|---|---|
| `game/src/world/stake.ts` | **new** — `STAKE_TILE` (one tile on every ground, the `BANK_TILE`/`HATCH_TILE` discipline) and `stakeArtKey(founded, hollowed)` → `founder_stake` / `founder_stake_hollowed` / `null`. Pure. |
| `game/src/scenes/WorldScene.ts` | `syncStakes()` — mirror of `syncWear()`: one sprite for the current ground, texture chosen by `stakeArtKey`, destroyed when the ground has no founder. Called from `applyObjectVisibility()`, which every zone cross, the founding pass and the save restore already come through. Plus a `__stake()` dev hook for the e2e. |
| `tests/unit/cycle-145-stake.test.ts` | **new** — the tile is never water on any ground, is clear of every fixture the park pins, and the key table. |
| `tests/e2e/cycle-145-stake.spec.ts` | **new** — a stake stands on the starting ground on a fresh save; the frontier has none. |

**No save field.** The stake is derived from `pioneers` + the head count, which are already persisted — the
`standings.ts` doctrine, and the reason the repair is small.

### Sequencing

`reachability.ts` + its test (walk it, watch entry 9 go dark) → `stake.ts` → the scene wiring → re-walk green.

---

## Blockers

_(none at plan time)_

---

## Shipped

**Lore track — BACKLOG-516: shipped.**

`pioneer.ts` gained `FoundingKind` and a two-branch `pioneerLine`; the `born` sentence is
`has been in the Grove since the first morning`, the `crossed` sentence is 343's, unchanged. `foundingKind`
went in beside `foundingPioneers()` in `founding.ts` and is the only place the distinction is made.
`standings.ts` carries it on the standing as `via` and hands it to the line builder — `WorldScene` needed
no edit at all, which is 482's fold paying for itself for the fourth time.

Three existing specs updated for the new arity, one new unit spec, one new e2e. The article grep test
(499) passes over both sentences — the `born` wording routes its zone name through `theZone` exactly as the
`crossed` one does.

**Structure track — BACKLOG-501: shipped, and the first walk was not decorative.**

The register went in with nine entries. **Entry 9 came up dark on its first run**, exactly as planned for and
not merely as hoped: `founder_stake` and `founder_stake_hollowed` were drawn on the night of cycle 144 and
nothing in the park placed either of them. The failure message named the item and the fact rather than
printing an assertion diff, which is the whole design of the thing.

So the repair shipped in the same cycle. `stake.ts` puts the mark on tile `(6, 3)` on every ground — checked
not-water on all six through `zoneTileAt`, and clear of the bank, the hatch, the huddle tile, the bowl's plot
and the founding ruin — and `syncStakes()` in `WorldScene` draws it from the live pioneer record: a founded
ground shows the upright post, a hollowed one shows the canted bleached one, and the Saltpan shows nothing at
all, because nobody has founded it. Entry 9 is green now because the park changed, not because the claim did.

**Proof the walk can fail** (design's acceptance criterion, run before the repair rather than asserted after
it): the register was committed to a scratch state in which `worldPlacedProps()` did not yet claim the two
stake keys — which is what was *true* at that moment — and the walk failed with

> The founding park no longer exercises 1 system(s) it claims to:
>   BACKLOG-501 — every rig the studio has drawn is a rig the park can actually put on the ground
>     was reachable because: the cycle-91 stash rule lets a rig be authored ahead of its host; nothing counted the ones still waiting

which is the message the design asked for: the item and the fact, not an assertion diff. The scratch state
is not in the diff — the entry is green because `stake.ts` and `syncStakes()` shipped, not because the claim
was softened.

Gate results are in the QA handoff.
