# Cycle 123 — Verdict

**Lore track — BACKLOG-361 (homebody or wanderer): APPROVED**
**Structure track — BACKLOG-476 (what a ground can hold): APPROVED**

Read the full cycle: lore handoff, structure handoff, design (27 criteria), code plan (including its
"Shipped" section), QA, and the diff itself.

---

## Lore — BACKLOG-361, APPROVED

The item was queued as "Grove regulars in the book — been to the pond 4×" and shipped as something with a
different shape, which is now the fourth time in five cycles a grove-era item has had to be re-read at four
grounds (343, 364, 362, 347, and tonight 361). That is not a coincidence and it is worth naming: **items
written when the park was one place encode the park being one place**, and the queue is old enough that most
of what remains in it needs this treatment before it can be built. The Lore-smith did it in the handoff
rather than discovering it in the Coder, which is the right seam.

What earns the approval is the **two dimensions**, and specifically QA's check on them. A crossing count
alone would have made Sunny — four shuttles between two adjacent grounds — outrank Twitch, who has walked to
the far end of the chain three times. That is backwards, it is the obvious way to build the item, and it is
what the item's original text asked for. The shipped standing has Sunny as `a rambler — 4 crossings, 1 ground
out` and Twitch as `a wanderer — 3 crossings, 3 grounds out`. Fewer journeys, higher standing, and the reason
is legible in the line itself.

Three implementation calls I'd have flagged if they'd gone the other way, all of which went right:

- **Reach is derived, not stored.** It comes out of `seenZones` through 475's `hopsBetween` on every book
  open. A stored `farthest` would have been a number that silently rots the day a link changes — the exact
  class of defect 449 was written to end, and 475's own header re-argued last night.
- **Origin needed no new record.** `seenZones[name][0]` is already the first thing the park writes about a
  dino. The item could easily have shipped with a fifth per-dino travel map; it shipped with none.
- **`wanderStanding` does not consult reach when `crossings === 0`.** A dino that has never left is a
  homebody however the map is drawn or however the save is tampered with, and there is a unit test that
  fabricates a reach of 99 to say so.

And one deliberate restraint: **no beat.** No bubble, no ticker, no memory. Five beats now contend at the
crossing instant and 347 added the last one only a cycle ago; a sixth would have made one of the existing
five silently rarer. This item lives entirely in the book. That is the correct instinct for a *standing*, and
it is the distinction the design stated up front rather than arriving at by accident.

The save discipline is the house rule and holds: additive optional field, no version bump, **no back-fill** —
an older save that never counted reads every dino a homebody rather than inventing journeys nobody watched,
with a test pinning it.

## Structure — BACKLOG-476, APPROVED

This is the item that has been missing since the day migration got a direction, and the Structure-smith's
framing of it in the handoff is the sharpest thing in the cycle: **five accelerative systems, one brake, and
the brake is on the wrong end.** 450 sends mouths toward plenty, 460 hurries the stragglers out of the ground
they leave, 458 spreads word of the richest ground ahead of the bodies, 362 calls them back to grounds they
miss, 475 (last night) let all of that reach clear across the chain — and `ZONE_FLOOR`, the only counterweight
in the set, protects the ground being *emptied*. Nothing has ever protected the ground being *filled*. That
gap was invisible at three grounds and became real the moment a pull could recruit a dino two hops away into a
pile-up it can't see.

Three things make this the right build of it:

**Capacity is derived from terrain.** `ZONE_TERRAIN` already knows each ground's layout; a per-zone capacity
number would have been a second table to keep in sync with the first, which is the bug 449 exists to prevent
and which this cycle would have re-introduced for the sake of four integers. A fifth ground gets a capacity
the day it gets a terrain function. The **grass-only** choice is load-bearing and correctly argued in the
header: counting every non-water tile puts the four grounds within 6% of each other (294/288/278/290) and the
feature comes out uniform — a system that exists without saying anything. On grass they are 294/248/226/250,
and the Fernreach, all creek and scrub, is the tight ground. That reads.

**The crowding penalty folds into the appeal number, and the module says why.** 474 had to make its frontier
pull a *tier* because `zoneAppeal` has two readers that wanted opposite signs from it — `richestNeighbor`
asking where to go and `poorestResidents` asking who leaves. Crowding's two readers want the **same** sign: a
crowded ground is honestly both a worse place to arrive at and a likelier place to leave. Getting that
distinction right — and writing it down beside 474's opposite call so the next reader can tell the two apart —
is the difference between a system and a coincidence.

**The calibration is the feature, and it was treated that way.** The knob is set against the founding state,
not against a feeling: five dinos, bowl capacity 5, `isCrowded` strictly `>`. The park boots **at** capacity,
the system is dormant on a fresh save, and the plan wrote down in advance that a moved migration spec meant
the knob was wrong and *the spec must not be amended*. **No pinned spec moved. No test file outside this
cycle's two new ones was touched.** That is Milestone 10's finding read the right way round: M10's lesson was
that a suite full of hard-coded assumptions moves when a general system meets a new case; here the suite
staying perfectly still is the *evidence* that the ceiling is genuinely inert at the founding state. The
Coder proving `capacity.ts` in isolation before touching the scene is why that could be known early rather
than discovered at the end of a seven-minute e2e run.

One thing deliberately withheld, correctly: **no lens glyph.** A loose crowding icon beside the prosperity
tier and the ⬇ is precisely the accretion 477 exists to fold up, and adding it this cycle would have made
477 a redesign instead of a row.

## Quality bar

Build clean. Unit **1584/1584** (+43). e2e **458/458** (+12) on a fresh full run. `@mlc-ai/web-llm` imported
only under `game/src/ai/`. Additive save change, no version bump. Tree clean, `main` green.

**Flakes, catalogued not excused.** The first full run lost `cycle-077-carry` and `cycle-121-work-priority >
persists across a reload`. Both passed isolated (6/6 together) and the fresh full run was green including
both. Both are already nouns on BACKLOG-456 — the original pinned-pile one and the reload/IndexedDB race added
to that item's text only last cycle — and both are off this cycle's diffs. **This is the second consecutive
cycle the reload race has surfaced**, which promotes it from "a fourth noun" to the most frequent live flake
in the suite. 456's text already names it; I am noting the recurrence here so the next Structure-smith
weighing 456 against the queue knows it is now recurring rather than observed once.

## Milestone

Milestone 11 "A park you have to cross" advances to **2 of 3 on each track**:

- Lore: 347 ✅ (cycle 122), **361 ✅ (this cycle)**, 360 remaining.
- Structure: 475 ✅ (cycle 122), **476 ✅ (this cycle)**, 477 remaining.

The milestone is holding its shape unusually well. 475 gave the chain distance; 476 used that distance's
consequence (a pull can now recruit from two hops away) as its own justification; 361 was only measurable
*because* 475 shipped `hopDistances` the night before. Three of the four items so far have built directly on
the item shipped one cycle earlier, which is what a milestone is supposed to do and rarely does this cleanly.

Both remaining arcs are single items, so the milestone closes in one more cycle if both land.

## Housekeeping

- 361 and 476 closed in BACKLOG.md and moved to `BACKLOG-archive.md` with full shipped notes.
- Structure Track now **2 open** (466, 477) — below cap X=4. The cycle-123 Structure-smith flagged the
  refill as deferred deliberately; the next fire's **first** job is to refill it, and it should now do so
  against what the milestone's closing cycle teaches.
- BACKLOG.md body carries no other closed bullets and no emptied sections.
