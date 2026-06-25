# Cycle 78 — Verdict

## Lore track — BACKLOG-355 Drew them across

**Verdict:** APPROVED
**Item:** BACKLOG-355

**Rationale:** All 6 acceptance criteria PASS (QA). The grove pull stopped being a bare boolean and
became a *strength*: a non-visited bowl dino just told to its face about the pond outranks one whose
news has aged to the back of its memory ring, so `pickMigrant` drags the freshly-told across first.
The discipline that makes this clean is what it *didn't* do — the obvious "add a faint secondhand
hearsay relay" would have broken the cycle-75 `groveword.test.ts` 1-hop contract that 342/345 stand
on; instead the strong/weak split rides **recency** in the existing 6-entry ring (`grovePull → 0|1|2`,
`GROVE_TELL_RECENT=3`), so `groveword.ts` is untouched and grove news still dies after one hop.
`groveCurious` is reimplemented as `grovePull > 0`, so every existing 345 expectation holds unchanged —
the new behaviour is purely the pull-2-over-pull-1 preference. Additive, no save change, `curiosity.ts`
imports no backend. Build clean, 796 unit green, both e2e green. Ships.

## Structure track — BACKLOG-348 Zone resource bias

**Verdict:** APPROVED
**Item:** BACKLOG-348

**Rationale:** All 6 acceptance criteria PASS (QA). The two sealed-but-identical zone economies finally
diverge in *what* they gather: the grove's trees lean to branches, the bowl's open ground to stones,
via a pure `ZONE_BIAS` + `BIAS_WEIGHT=0.75` on a new optional zone arg to `pickKind`. The key restraint
is that it's a **lean, not a lock** (the off-kind still rolls past the weight, so no zone goes
single-resource) and that an omitted/unknown zone keeps the old uniform 50/50 — which is why every
146/314/328/329 resource spec is byte-identical and the back-compat is airtight. `resource.ts` taking a
dependency on `zones.ts` is safe (zones.ts imports nothing, no cycle). This is the precondition the rest
of the trade-route arc was waiting on: with the piles now diverging, directed carry (356), the both-zone
readout (357), and edge barter (358) have something real to act on. No save change, deterministic under a
seeded rand. Build clean, e2e 244/244 on a clean run. Ships.

**CHARTER check (both tracks):** no scope creep, no new frameworks, no new deps, web-llm boundary grep
clean (nothing under `game/src` outside `game/src/ai/` imports it). No regressions in the diff. The lone
`cycle-040-seasons` failure in the first full e2e run was the documented rotating parallel-load flake
(green 4/4 isolated, and the clean re-run was 244/244) — untouched by a diff that is entirely in
`curiosity.ts`/`resource.ts`.

**Phase:** both tracks APPROVED → `lore-pending` (cycle closes; Lore-smith bumps to 79 next run).
