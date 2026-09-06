# Cycle 152 — Code Plan

Two tracks, disjoint file sets. Lore touches `world/away.ts` + its two specs; structure touches
`world/reachability.ts` + `world/founding.ts` + `WorldScene.seedFounding`. The only shared file is
`WorldScene.ts` and they land in different methods (`setupSave`'s away branch vs `seedFounding`).

---

## Lore track — BACKLOG-113

### Files

| File | Change |
|---|---|
| `game/src/world/away.ts` | new exports `AWAY_BEAT_MIN_MINUTES`, `APART_PER_DAY`, `MAX_APART`, `driftFor`, `apartFor`, `driftingPairs`, `apartMemory`, `apartLine`; `fastForward` rewritten off minutes instead of `days >= 1` |
| `game/src/world/cycle-152-drift.test.ts` | new — the curve, the bands, the floor, the day-boundary equivalence pin |
| `tests/unit/away.test.ts` | repair — sub-day expectations move; day-boundary ones must not |
| `tests/e2e/cycle-029-away.spec.ts` | repair if it asserts the sub-day digest |
| `tests/e2e/cycle-152-drift-apart.spec.ts` | new — the reachability spec (criterion 10) |

No new module. `away.ts` already owns the company logic and is already pure; a `drift.ts` beside it
would be one more file holding four constants and would split one rule across two headers. Rung 2 of
the ladder: the thing that owns this is already here.

### Shape

```
AWAY_BEAT_MIN_MINUTES = MISSED_MIN_MINUTES   // imported, not re-typed (the 495 rule)
APART_PER_DAY = 1                            // half DRIFT_PER_DAY
MAX_APART     = 6                            // half MAX_DRIFT

perMinute(rate, cap, minutes) =
  minutes < AWAY_BEAT_MIN_MINUTES ? 0
  : min(cap, ceil(rate * minutes / MINUTES_PER_DAY))

driftFor(m) = perMinute(DRIFT_PER_DAY, MAX_DRIFT, m)
apartFor(m) = perMinute(APART_PER_DAY, MAX_APART, m)
```

One helper, two call sites. `ceil` is the whole reachability fix: it is what turns five minutes into one
point instead of zero, and at every whole-day input it lands on the same integer `rate * days` gives
today (integer times integer, ceiling of an integer, no drift) up to the cap — which is criterion 2 and
must be pinned as a spec, not argued here.

`driftingPairs(bonds)` — the complement band. `bondedPairs` already returns every key with
`points >= minPts` sorted descending, so this is `bondedPairs(bonds, 1).filter(p => p.points <
COMPANION_MIN_BOND)`. Reuse, not a second traversal of `Bonds`.

`fastForward` becomes: compute `minutes`; if `driftFor(minutes) === 0 && apartFor(minutes) === 0` keep
the existing "Barely long enough to notice." line; otherwise run the warm loop (unchanged, with
`driftFor(minutes)` in place of `Math.min(DRIFT_PER_DAY * days, MAX_DRIFT)`) and then the cold loop.

The cold loop uses `strengthen(bonds, a, b, -apart)` — `strengthen` already clamps at `MAX_BOND`; check
it also floors at 0, and if it does not, floor at the call site rather than changing a function eleven
other callers depend on. **Verify this before writing the loop.** Criterion 5 is not optional.

Digest ordering: warm lines first (unchanged), then at most two cold lines. Cold lines are picked by
largest loss, which after a uniform `apartFor` is a tie for everybody, so break it the way the warm
side does — by the pair's own bond, ascending (the furthest-apart pair leads), taken off the same
sorted array `bondedPairs` already returns. Deterministic, no rng.

`days` stays on `AwayResult` — `WorldScene` passes it to `applyAwaySpoilage(away.days)` and
`runUpkeepPass(away.days)` and neither should change behaviour this cycle. Do not repurpose it.

### Fallout, and the order to repair it

Expect `tests/unit/away.test.ts` red on any sub-day case. Repair priority, written down before the
fallout exists (the 495 discipline):

1. A spec whose subject **is** the sub-day silence — update the expectation and write the reasoning into
   the file, naming BACKLOG-113.
2. A spec that steps away sub-day for some **other** reason and incidentally asserts the digest — give
   it an explicit minutes value that keeps its own subject intact.
3. Never re-flatten `AWAY_BEAT_MIN_MINUTES` or drop `ceil` to make a spec green. That is the defect the
   item exists to fix, wearing the fix's uniform.

---

## Structure track — BACKLOG-528

### Files

| File | Change |
|---|---|
| `game/src/world/reachability.ts` | `ReachabilityEntry.played?`; `afterOneSession()`; three played claims; `darkEntries()` reports the frame |
| `game/src/world/founding.ts` | `FOUNDING_LANDMARKS` — the Grove's standing lean-to |
| `game/src/scenes/WorldScene.ts` | `seedFounding` places it |
| `game/src/world/cycle-152-played.test.ts` | new — the stepped helper, the three claims, the tile assertions |
| `game/src/world/cycle-145-reachability.test.ts` | extend the walk to the played predicate |
| `tests/e2e/cycle-152-founding-skyline.spec.ts` | new — the reachability spec (criterion 9) |

### The stepped helper

```ts
export interface PlayedPark {
  piles: Record<string, Stockpile>;
  standing: Record<string, number>;
  derelict: Record<string, number>;
}
export function afterOneSession(): PlayedPark
```

Pure. Starts from `FOUNDING_PILES` and `FOUNDING_LANDMARKS` + `FOUNDING_RUIN`, then:

1. **The mend.** The ruin's ground spends `REPAIR_COST` off its own pile; the ruin becomes standing.
   Route the spend through the same function `runUpkeep` uses to take a unit off a pile — do not
   subtract inline. If that function is module-private in `upkeep.ts`, export it rather than writing a
   second one; a spend implemented twice is 495's thesis with resources in it.
2. **One in-game day of upkeep.** `runUpkeep(pile, standing, 0)` per ground — the live form, `derelict = 0`,
   matching what `runUpkeepPass` actually calls on a watched park (`WorldScene.ts:7847`). Using the
   away form here would model a park nobody is in, which is the opposite of the frame this item is for.

`SESSION_MINUTES = 30` and a day is `MINUTES_PER_DAY / ACTIVE_SCALE = 24` real minutes, so exactly one
day fits — the register's existing `BACKLOG-493` entry already asserts that, so `afterOneSession` may
rely on it rather than re-deriving it, and should say so in a comment naming the entry.

### The three claims

Attach each `played` to the entry that already owns the founded half of the same subject, so the two
frames of one claim read together:

- on `BACKLOG-488` — `played.system`: *"and the heap it was mended out of drops a step while you watch"*;
  `holds`: `bankStep(after.piles[GROVE]) < bankStep(FOUNDING_PILES[GROVE])`.
- on `BACKLOG-488` (second entry, or a second claim on the same subject) — the skyline: the ruin's
  ground has a standing landmark after the session and had none before.
- a **new** entry `BACKLOG-480` — founded half: *"a skyline that owes something"*, `holds`:
  `upkeepDue(standing after the mend) >= 1` for some ground. Played half: some ground's pile is strictly
  smaller after the session than after the mend — the bill actually landed.

If a founded/played pair does not fit one entry cleanly, prefer two entries over one entry with a
contorted predicate. The register is a list of claims, not a normalised table.

### `darkEntries()`

Return `{ entry, frame: 'founded' | 'played' }[]` and update the walk in
`cycle-145-reachability.test.ts` to print the frame in its failure message. Both call sites are in the
suite; grep before changing the signature.

### The founding change

```ts
/** BACKLOG-528: the Grove's lean-to. See the design handoff — with the founding ruin mended this is the
 *  second standing landmark on that ground, which is the first skyline in this park's history that owes
 *  `upkeepDue` anything on a fresh save. Grass by `groveTileAt(9, 3, 20, 15)`, clear of the NE pond
 *  (x>=15), the trail (y in {6,7}), FOUNDING_RUIN (4,10) and BANK_TILE (16,11). */
export const FOUNDING_LANDMARKS = [{ zone: GROVE_ID, tileX: 9, tileY: 3, kind: 'shelter' }] as const;
```

`seedFounding` pushes it into `this.shelters` and calls `drawShelter`, inside the existing
`if (this.cairns.length) return` one-shot guard, so a restored save never gains it (criterion 8).

Check `landmarkRecords` order before committing: cairns come before shelters, and the **newest standing
lapses first** via `.pop()`, so the lean-to falls before the founding cairn. That is the ordering the
method's own comment promises and it must still be true with two founding landmarks — assert it.

### Test plan

Unit (`vitest`, Node, no Phaser):

- `cycle-152-drift.test.ts` — criteria 1–9 of the lore track, with the day-boundary equivalence table
  written out for days 1..7.
- `cycle-152-played.test.ts` — `afterOneSession` purity (calling it twice gives equal output), the three
  claims, `upkeepDue >= 1`, `FOUNDING_PILE_STEPS` unchanged, the lean-to tile grass and clear of all four
  fixtures, the lapse order.
- `cycle-145-reachability.test.ts` — the extended walk; every entry green on both frames.

E2E (`playwright`):

- `cycle-152-drift-apart.spec.ts` — found a park with a known bond in the middle band via the founding
  fixture seam (`foundingState`), save, step the clock back five minutes, reload, read the digest, assert
  a warm line and a cold line. Use the fixture rather than a bare hook — that is what 495 built.
- `cycle-152-founding-skyline.spec.ts` — fresh park, walk east, two landmarks on the Grove, upkeep bill
  non-zero off `__runUpkeep`.

### Blockers

None known at plan time. Two things to verify **before** writing code, both of which change the plan if
they come out the other way:

1. Does `strengthen` floor at 0? (Lore criterion 5.)
2. Is the pile-spend helper in `upkeep.ts` exportable, or does the mend already have a pure owner in
   `mending.ts` / `repair.ts`? Prefer whichever already exists. `repair.ts` and `mending.ts` are both in
   the tree and neither was read at plan time — read them first.
