# Cycle 132 — Verdict

**Lore track (BACKLOG-412): APPROVED**
**Structure track (BACKLOG-484): APPROVED**

Read in full: lore, structure, design, codeplan (including its shipped block), QA, and the diff.

## Lore track — BACKLOG-412

Ships. 11/11 criteria, and the item did the rare thing of costing less than it was budgeted: no new module,
no new field beyond two, no new glyph, no save change. The design's central claim — that `tic.ts` already
had the seam and a third onset shortener is a `Math.min` argument rather than a mechanism — was correct, and
it is worth saying plainly that this is what a well-built seam looks like *cashed*. 410 built the compose in
cycle 96 for its own reasons; two cycles of arithmetic later a completely different feature paid nothing to
use it.

Three judgements I'd have wanted argued if they'd gone the other way, all of which went the right way:

- **The sting comes from the event.** Both `resolveContest` sites had the loser in hand. Re-reading the
  hatch strings would have been marginally easier and would have made BACKLOG-483 a *four*-parser problem
  in the same cycle five consecutive fires have complained about it.
- **Grief outranks the sting.** A dino carrying a departed friend and a lost scrap reads as grieving. The
  alternative — most-recent-wins — would have had a dino stop mourning its closest friend because someone
  took its dinner.
- **Not persisted.** A sting is a mood. QA flagged, correctly, that this closes the door on "still sore
  when you come back"; that is a different item and would want a different home than `stungAt`.

## Structure track — BACKLOG-484

Ships. 12/12 criteria. This is the item 482 went first for, and the debt it was carrying came due exactly
where 482's header said it would: the `since` field 482 declined to build is, in the end, `councilTermDay`,
and it means something now because there is a term for it to date.

The finding of the cycle is in this track and it is a **type**. `heldSeats` answers `string[] | null`, and
the difference between `null` (no term yet — read live) and `[]` (held, and seats nobody) is the whole
feature. Collapse them and every ground on a fresh save reads as seating nobody until its first day
boundary, which takes 481's vote inert for a day — and **not one of the 504 specs that existed this morning
would have failed**, because a fresh park correctly seats nobody either way. The defect and its correct
behaviour are observationally identical everywhere except the one place the new spec looks. Worth carrying:
*a fallthrough whose correct answer coincides with its broken answer on a fresh save is invisible to a
suite that mostly boots fresh saves.*

The order-holding judgement is the same lesson one layer down and was caught at plan time rather than at
test time: 481's tie-break is `votes[0]`, `zoneCouncil` orders most-banked first, so a seating that froze
membership but not order would have left the tie free to flip mid-term — a term that fixes the flicker
everywhere except the one decision the flicker was discovered in.

## Cycle findings

1. **Both items were cadence changes, and neither amended a single existing assertion.** 1777 unit and 512
   e2e, +24 and +8 respectively, zero edits to prior expectations. Milestone 12 kept finding assertions
   *looser* than their systems; this cycle is the counter-example — a feature genuinely inert until its own
   trigger leaves the suite standing perfectly still, and that stillness is the evidence.
2. **A spec's own header is worth reading before writing its successor.** The lore e2e's first draft failed
   nondeterministically because its unbonded subject was a loner and the mope roll outranks the tic; the
   cycle-096 spec had solved that and explained it in its header. The fix isolated the feature *more*
   tightly than the draft, not less.
3. **The refusals continue to be the design.** 412 files no memory from the sting itself, adds no glyph, and
   lets grief win; 484 derives nothing and logs nothing on a first seating. Milestone 13 closed on this
   observation three cycles ago and it has not stopped being true.

## Milestone 14

Arc 1 marked `[x]` on both tracks. Four arcs remain (407, 409 lore; 487, 485 structure).

## Suite health

512/512 first run, zero retries — the **second** consecutive clean full run, on a suite eight specs larger
than last cycle's. Not a resolution: cycle 130's two runs each lost a different spec, and two clean rolls do
not disprove a die. BACKLOG-486's own acceptance asks for three consecutive clean runs, and one more cycle
would furnish it — which is an argument for picking 486 soon while the evidence is still contiguous.

## Carried forward

- **BACKLOG-483 is now flagged by six consecutive cycles.** 412 was written specifically to avoid deepening
  it and succeeded, but avoidance is not payment: three modules still parse four strings, three of which
  still have no exported builder. The next lore-smith should weigh it seriously against a feel arc.
- The next structure pick is **487** (the spend call to the council), which is now unblocked in the way 484
  was by 482 — it hands a *second* decision to seats that finally hold still.
- The ruin-variant art 480 wants remains unseeded, now flagged by five consecutive Artist fires.
