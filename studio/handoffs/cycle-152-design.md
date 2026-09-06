# Cycle 152 — Design

Two tracks. They share one finding and are otherwise independent: neither touches the other's files.

**The finding both tracks land on.** Each track's item, read carefully, turns out to be about a system
this park has shipped for cycles and never once shown a player — the away digest's drift beats need a
whole in-game day at `AWAY_SCALE = 1` (twenty-four real hours), and the upkeep economy needs a second
standing landmark the founding world never places. Both are the CHARTER v7 corollary. Neither is
scope creep: v7 says ship the feature *and* whatever founding change makes it reachable, in the same
cycle, and in both cases that change is small and sits in the item's own module.

---

## Lore track — BACKLOG-113: drift apart while away

### What ships

The offline catch-up stops being all warmth. Today `fastForward` finds every pair bonded at 8 or more,
moves them closer, files them a memory, and prints *"X and Y grew closer."* Everybody else in the bowl —
which is most of the cast — lived through the same absence and the park has them do nothing. So the
absence gets its cold half: a pair that **knows each other and does not keep company** (a bond above
zero but below the companion threshold) comes back a little further apart, files its own memory, and the
digest says so beside the warm lines.

The grading is a fact about the pair, not a die roll:

- **Companions** (bond >= `COMPANION_MIN_BOND`) — unchanged. They drift closer, as they have since 106.
- **Acquaintances** (`0 < bond < COMPANION_MIN_BOND`) — they drift *apart*, by the same shape of rule,
  floored at 0 so a bond never goes negative and a falling-out is never a wound the park cannot heal.
- **Strangers** (bond 0, or no entry at all) — nothing. There is nothing to lose, and a park that
  invents estrangement between two dinos who have never met is inventing drama rather than reporting it.

The middle band is the whole item. It is the pair the player has *started* and not finished — met once,
never followed up — and the news that it went backwards while they were gone is the first thing this
park has ever said that costs the keeper something for being away.

### The reachability half (and why it belongs in this item)

`fastForward` gates every drift beat on `days >= 1`. The saved scale for an offline gap is `AWAY_SCALE = 1`,
so one in-game day is **twenty-four real hours away**. In a fresh save watched for ten minutes — or a
hundred — the digest has never printed anything but *"Barely long enough to notice."* Shipping a
drift-apart beat behind that gate would ship a system the player cannot reach, which is a REWORK by the
bar.

`missed.ts` made exactly this call one cycle ago and wrote down why: `MISSED_MIN_MINUTES = 5`,
deliberately *not* the inherited 360, because a threshold tuned so the shipping park sits under it is the
defect v7's corollary names. The drift beats take the same threshold, from the same constant, imported
rather than re-typed.

So the day gate becomes a **minutes** curve that agrees with today's numbers at every day boundary:

    driftFor(minutes) = min(MAX_DRIFT, ceil(DRIFT_PER_DAY * minutes / MINUTES_PER_DAY))
    apartFor(minutes) = min(MAX_APART, ceil(APART_PER_DAY * minutes / MINUTES_PER_DAY))

At one day that is 2, exactly what `DRIFT_PER_DAY * 1` gives today; at seven days it is capped at 12,
exactly as `Math.min(DRIFT_PER_DAY * days, MAX_DRIFT)` gives today. Every existing assertion made at a
day boundary is arithmetically unchanged. What changes is the *sub-day* case, which is the only case a
player has ever actually been in: a five-minute step away now moves a bond by one point in each
direction and the digest reports both. Specs that assert the sub-day silence will redden, and that is
the fallout this design expects and wants — it is the same measurement 495 was run for.

`APART_PER_DAY` is **1**, half the warm rate, and `MAX_APART` is **6**, half `MAX_DRIFT`. Coming apart is
slower than coming together on purpose: this park is deathless and cozy by charter, and the cold half is
a nudge the keeper can undo in one visit, not a punishment that outruns them.

### Acceptance criteria (lore track)

1. `apartFor(minutes)` is pure, monotone non-decreasing, `0` below `AWAY_BEAT_MIN_MINUTES`, `1` at five
   minutes, `1` at one day, and capped at `MAX_APART`.
2. `driftFor(minutes)` returns exactly today's value at every whole-day input from 1 to 7 — pinned as a
   spec, so the claim "no day-boundary behaviour changed" is asserted rather than asserted in prose.
3. A pair bonded strictly between 0 and `COMPANION_MIN_BOND` loses `apartFor(minutes)` after an absence.
4. A pair at 0, or absent from `Bonds` entirely, is untouched — no entry is created for it.
5. A bond never goes below 0.
6. A companion pair still gains `driftFor(minutes)`; the warm path is unchanged.
7. Both dinos of a drifted pair get a memory, phrased in their own direction, built by one exported
   builder rather than a template literal at the call site (the 483 rule `missed.ts` follows).
8. The digest carries at most two drift-apart lines, chosen by the largest loss, beside the warm lines,
   and reads as a falling-out rather than an error.
9. When the cast has warm pairs and no drifting pairs, the digest is exactly what it prints today.
10. **Reachable:** a save stepped away for five real minutes and returned to prints both a warm line and
    a cold line in the homecoming digest. Pinned by an e2e spec that does this, not by a unit test.

---

## Structure track — BACKLOG-528: the register can only see the first frame

### What ships

`ReachabilityEntry` gains an optional second predicate — a `played` claim carrying its own `system`
string and its own `holds()`. The founded `holds()` is untouched. The existing twelve entries are
untouched. `darkEntries()` grows to walk both predicates and to name which frame went dark, because
"the park no longer ships X" and "the park ships X and then nothing happens to it" are different bugs
and a failure that cannot tell them apart is half a register.

The stepped park is **one pure helper**, not a Phaser world: `afterOneSession()` advances the founding
state through the beats a player would actually watch inside `SESSION_MINUTES` — the founding ruin
mended out of its ground's bank, then one in-game day of upkeep billed against the resulting skyline.
Both route through the production functions that own them (`REPAIR_COST`, the upkeep pass), per the
register's own rule 1: an entry that restates a constant is a second copy and it will be the wrong one.

### The three claims, and the one that is expected to be dark

1. **BACKLOG-488/504 — the heap on a ground changes while you watch it.** The Grove ships `{stone: 2}`,
   step 2; the mend costs 1; so the heap drops to step 1 in the same minute Bramble puts the cairn back
   up. `bank.ts` states this in its own header as the reason `PILE_STEPS` was chosen, and nothing pins
   it. Expected green — the register learning to hold a claim it always should have.
2. **BACKLOG-488 — the skyline changes while you watch it.** After the session the Grove has a standing
   landmark where it booted with a ruin. Expected green.
3. **BACKLOG-480 — somebody is billed for the park they keep.** After the session, at least one ground
   owes upkeep. **Expected dark**, and this is the cycle's finding.

### The finding, and the founding change that answers it

`upkeepDue(standing) = floor(standing / 2)`. The founding world places exactly one landmark, the Grove's
fallen cairn, and a derelict landmark is not standing, so the founding park owes `0` everywhere and owes
`0` still after the mend. The entire upkeep economy of BACKLOG-480 — the daily bill, the lapse, the
disrepair state four Artist fires have drawn ruins for, the granary's cap lift reading past it, the
prosperity index reading past it — has been dormant on every fresh save in this park's history.

It is dormant **by calibration**, and `upkeep.ts` says so in its own header, in the CHARTER's own words:
*"a ground with a single landmark owes nothing, so a fresh park is inert."* That sentence is the
`TILES_PER_HEAD` sentence with a different constant in it, and v7's corollary makes it a defect rather
than a virtue.

So the founding park gains a **second standing landmark on the Grove** — a `FOUNDING_LANDMARKS` table in
`founding.ts` beside `FOUNDING_RUIN`, which is where the fixture seam 495 built says a founding fact
belongs. With the ruin mended that is two standing, which owes one unit a day. The Grove's bank after the
mend is 1. So a player who walks one edge east and watches sees: the cairn go back up, the heap drop a
step, and one in-game day later the heap spend its last unit on the upkeep bill. The day after that the
ground cannot pay and a landmark goes over — the first time the park's own economy has ever done
anything to a fresh save.

That is the reachable half, it is one table in one module, and the register claim that demanded it stays
in the tree afterwards so a later tuning pass that re-flattens the skyline reddens the build naming this
item.

### Constraints

- The new landmark's tile must be grass by the Grove's tile function and clear of every fixture the
  Grove pins — the NE pond, the mid trail, `FOUNDING_RUIN` at (4,10), and `BANK_TILE` at (16,11).
  Assert that, the way `cycle-141-bank.test.ts` asserts the bank tile, rather than eyeballing the map.
- `FOUNDING_PILE_STEPS` is unchanged, so the `BACKLOG-495/504` entry stays green by construction.
- Save format additive only: the new landmark seeds on the `!save` branch beside the ruin and rides the
  existing landmark array, so an old save restores with exactly the skyline it was written with.

### Acceptance criteria (structure track)

1. `ReachabilityEntry.played` is optional; the twelve existing entries compile and pass unchanged.
2. `afterOneSession()` is pure (no Phaser, no `Date`, no randomness) and routes through `REPAIR_COST`
   and the upkeep production functions rather than restating their values.
3. `darkEntries()` reports which frame — founded or played — a dark claim failed on.
4. The three played claims above are in the register and all three hold.
5. The founding Grove ships a second landmark, standing, on a tile asserted grass and asserted clear of
   the ruin, the bank tile and the pond.
6. The upkeep due for the Grove's post-mend skyline is at least 1 — the claim that was dark, now green.
7. Every existing register entry still holds, `FOUNDING_PILE_STEPS` unchanged.
8. An old save (with a landmark array written before this cycle) loads with its own skyline and gains
   nothing.
9. **Reachable:** an e2e spec boots a fresh park, walks to the Grove, and reads two landmarks where the
   suite has only ever seen one — and reads the upkeep bill as non-zero off the production hook.
10. The prediction in the structure handoff is answered explicitly in the QA report, whichever way it
    came out.
