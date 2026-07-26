# Cycle 112 — Verdict

## Structure track — BACKLOG-460 (The draining zone)

**Verdict:** APPROVED
**Item:** BACKLOG-460

**Rationale:** All 7 acceptance criteria PASS. This is the arc Milestone 7 was one short of. 450 moved
mouths toward plenty and emptied the poorest zone first, but the migration bias re-read prosperity
*fresh every roll* — a thinning zone never gained momentum and an exodus never read *as* one. 460 gives
the hollowing a read and a pull, three deathless pieces on one clean seam: a per-zone population
high-water mark (`bumpPeak`, transient like a peak-of-run) means a zone below its peak reads
**declining** (a ⬇ on the map lens beside the tier); a *settled* resident of a declining zone resists
the ambient wander at `DECLINING_MIGRATE_DAMP` (0.3) instead of `SETTLED_MIGRATE_DAMP` (0.6), so a
draining zone holds its people more weakly and the exodus compounds; and a **floor**
(`heads <= ZONE_FLOOR` → the roll is consumed but no one leaves) means a zone thins all the way to one
and holds there, never a ghost town — mortality stays an operator call. The engineering is the right
kind of lazy: new pure `world/decline.ts` (fold + read, 10 unit cases), a single **optional** `damp`
param on `resistsMigration` (every existing caller byte-identical), and the lens `zoneMapModel` seam
457/446/454 already extended. `__maybeMigrate` (the test path) is untouched, so 450/459's migrant-pick
pins stay byte-identical — verified by a fully green full suite. No save-shape change.

## Lore track — BACKLOG-464 (Last one standing)

**Verdict:** APPROVED
**Item:** BACKLOG-464

**Rationale:** All 5 acceptance criteria PASS. 460 mechanizes an exodus and caps it with a floor; 464 is
that floor's *human* read — the dino it keeps behind. When a zone has hollowed to its final resident
(`isDeclining` **and** `heads === 1`), that dino sounds a wistful 🍂 "gone quiet around here…" beat and
files a `you're the last one left in <zone>` memory that rides recall into its next greeting. It reuses
460's declining read wholesale (`isZoneDeclining` + the peak map) and is deduped against the dino's own
memory ring, so it reads as a moment, not a tic — a zone that repopulates and drains again can sound it
afresh (pinned by the e2e's second-scan assertion). New pure `world/lastone.ts` (deterministic strings);
NPCBrain boundary intact (the memory colours the LLM line where a device allows, exactly as 457/459's
traces do); no new save field. Off the M7 lore checklist (which closed at 459) but riding the exact
theme M7 ships on — the human cost of the mouths-move-toward-plenty economy — a fitting pairing for the
milestone-closing structure arc rather than an unrelated thread opened a cycle before M7 lands.

## Suite health
- build clean · vitest **1329/1329** · e2e **386/386** — a fully green run, no reds this cycle.
- Both catalogued flakes (`cycle-077-carry` BACKLOG-456, `mobile-minds.spec.ts:79` BACKLOG-430) passed
  this run; both new specs green in the full parallel suite, not only isolated.

## Milestone bookkeeping (Milestone 7 — "The economy has weight")
- Structure arc "The draining zone" (460) → **[x]**.
- Lore beat "Last one standing" (464) → **[x]** (off-checklist companion, folded into the M7 close-out).
- **All Milestone 7 arcs now closed → Milestone 7 declared SHIPPED** (opened cycle 109, shipped cycle
  112). Moved to `MILESTONE.md`'s Shipped section with the headline write-up; the current milestone is
  now empty. **Next cycle's smiths draft Milestone 8** before picking items (CHARTER v6).
