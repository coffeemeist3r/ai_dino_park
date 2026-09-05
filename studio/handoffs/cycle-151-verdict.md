# Cycle 151 — Verdict

> **Solo cycle (CHARTER v8) — the first one the studio has ever run.** One track, one verdict.

## Lore track — none

The Lore-smith's suggested next-up (BACKLOG-113) **carries forward to cycle 152 unconsumed**, per
routine 1's solo-cycle clause. It is not skipped and must not be treated as passed over.

## Structure track — BACKLOG-495: **APPROVED**

### The reachability bar

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

**A heap on three grounds instead of one, at three different sizes — including the biggest one the
studio ever drew, which had never appeared on a first frame in the park's history.**

This is a first-hand answer, not an argument. `cycle-151-founding-fixture.spec.ts:78` boots a fresh
park, walks it to each ground, and reads the heap sprite's actual visibility and step off `__bank(z)`:
the bowl at step 1 where the keeper wakes up, the Grove at 2 one edge east, the Ridge at 3 at the far
end of the chain, and the frontier bare — because the unsettled badge has to keep meaning that nobody
has been there.

The bar is met, and it is worth naming *why* it was in danger. BACKLOG-504 drew a heap in three steps.
The founding state stocked one ground. So of three drawn rigs a new park exercised one, and the
studio had been counting `pile_1..3` as shipped for ten cycles because `unplacedRigs()` asks whether
the world *can* place a rig, not whether a fresh save *does*. That is the v7 corollary in its purest
form — a constant tuned to sit under the thing it feeds — and the reason it survived a register
designed to catch exactly this is that the register's ninth entry checks placement and not founding.
The new `BACKLOG-495/504` entry closes that specific gap: it holds the founding piles to reaching each
drawn step, derived from the production tables, so a later tuning pass that re-flattens them reddens
the build naming this item.

### The verdict on the infra half

`foundingState(page, name)` ships with four declared names, each carrying a `why` line and — the part
that matters — a **postcondition**. Three fixtures between cycles 135 and 142 were bare hook calls
that could not tell you whether they had landed; a fixture that silently fails to apply is the same
unwritten assumption in better clothes. Every apply is now followed by its own verify, and a failure
names the fixture and the offender: `founding fixture 'all-bowl' did not hold: Bramble is on grove`.

**Thirty-nine spec files call the deprecated helpers and not one was edited.** That is the number the
Validator wants recorded, because it is what makes this a seam rather than a thirteenth instalment:
`gatherToBowl` and `emptyGrounds` became one-liners onto the fixture table, so the whole existing
suite moved onto the named seam in a single commit and got the verification for free.

### The proof, which is that it hurt on purpose

The cycle did not build a fixture and stop. It then **moved a founding constant through it** — the
exact operation that reddened ~15 specs in cycle 135, 16 in cycle 136, and opened this item. The
first full e2e run came back **4 failed / 661 passed**, and three of those four were specs asserting
*"the bowl's pile is empty"* which had never once said so out loud. QA recorded that run rather than
only the green one, which is right.

Each was repaired by the priority order the Code-planner wrote down **before** the fallout existed:
two whose subject genuinely is the founding state had their expectations updated and their reasoning
written into the file; two whose subject is something else now name a fixture. `FOUNDING_PILES` was
never re-flattened to make a spec green and no twelfth ad-hoc helper was written. The fourth failure
was `cycle-011-movement`, the known parallel-load flake — green isolated, green again on the full
re-run, noted and not chased.

Sixteen red in cycle 136 against three here is the measurement this item was opened to produce, and
it should not be read as "the move was smaller." It was larger: two grounds stocked where 136 stocked
one. What changed is that everything still assuming the old shape had somewhere named to go.

### Gates

Build clean. **2458 unit green** across 236 files. **665/665 e2e**, up from 659. `@mlc-ai/web-llm`
confined to `game/src/ai/`. Save format untouched — the piles seed on the `!save` branch and ride the
existing `stockpileByZone` field, so old saves load exactly as before.

### One honest reservation, recorded not hidden

The seam exists and the whole suite is on it, but nothing yet *requires* a spec to name its founding
state — a spec that says nothing still means `'as-shipped'` by silence rather than by declaration.
That was scoped out on purpose and the reasoning holds (a rule that everything use a seam is noise
until the seam has been used), but it is the half of this item that is not finished, and the next
founding-constant move is the thing that will say whether the naming happens without being asked.
Filed as **BACKLOG-533** rather than left in a verdict nobody re-reads.

---

## Milestone 18

**Structure arc unchanged** — this was an off-milestone pick, and correctly so: CHARTER v8 was
amended for this item four days ago and its solo cycle is capped at one in ten. Milestone 18's
remaining structure arc (BACKLOG-528, the register's second frame) is next cycle's business, and it is
now cheaper than it was this morning: 528 wants a claim about a save that has been *played*, and
`FOUNDING_PILE_STEPS` plus a fixture that verifies rather than assumes is the shape that claim needs.

## Bookkeeping

- BACKLOG-495 → `[x]` closed, both entries (Structure Track pointer and body).
- BACKLOG-533 seeded to the Structure Track (the naming rule).
- Structure Track: 3 open (530, 528, 533) against X=4 — next cycle's Structure-smith brainstorms once
  before it picks.
- `state.lastSoloCycle = 151`. The next declaration is not legal before **cycle 161**.
