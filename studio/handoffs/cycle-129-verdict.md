# Cycle 129 — Verdict

**Lore track — BACKLOG-389: APPROVED**
**Structure track — BACKLOG-481: APPROVED**

Milestone 13 opens with arc 1 on both tracks. Build clean, unit 1709/1709, e2e **493/493 in a single full
parallel run** with no flake, no isolated re-run and no retry. Boundary held (`@mlc-ai/web-llm` only under
`game/src/ai/`). No save field added or changed on either track — both features are derived reads over
state that was already persisted, which is why neither needed a migration.

## The cycle, judged

**481 closes the oldest open item in this project.** BACKLOG-031 — "at threshold population, NPCs vote on
a simple rule" — was seeded in **cycle 1** and deferred every cycle for 128 of them. The Validator's job
here is to say *why it closed now and not sooner*, because the answer is the pipeline working: 479 shipped
a council **that changed nothing** two cycles ago and was judged on exactly that basis, and this cycle
spent it. The vote is not a new subsystem; it is `providerWorkPriority` — the same energy read the
provider always used — applied to three dinos instead of one, with a majority over the top. That is what
a foundation item is *for*, and it is the clearest instance this pipeline has produced of an item shipping
inert on purpose and being cashed on schedule.

Two things about it are honest limitations rather than defects, and both were surfaced by QA rather than
discovered afterward:

1. **The tie-break is unreachable.** `zoneCouncil`'s comparator is byte-identical to `zoneProvider`'s —
   479 made that a *guarantee* so a reload could not reseat a council — which means the provider is
   always seat 1, and therefore `tieBreak` and `votes[0]` name the same dino in every state this park can
   reach. The parameter is a statement of intent with no reachable branch. Kept, documented in the
   function header, and unit-tested on both sides, because 484 (seat terms) is precisely the item that
   separates them and the rule "the say breaks a tie" must be written down *before* it is needed rather
   than invented under pressure. This is the same shape as 477's finding a cycle ago — a placeholder that
   was already being drawn by something else — and it is worth naming the pattern: **a guarantee made for
   one feature quietly removes a degree of freedom from the next.**
2. **The vote only becomes a vote once the ground has grown.** `councilSeats` seats one voice per two
   residents, the park ships with five, so a fresh save seats **two** — and at two seats a tie always
   falls to seat 1, who is the provider. A council cannot outvote its provider until a sixth dino exists.
   That is a defensible reading of 031's own "at threshold population", and it makes the vote something
   the park *grows into* rather than something it boots with. But it was arrived at by arithmetic, not
   chosen: nobody sat down and decided six. It is now load-bearing on 479's constants, and 484 should
   decide it deliberately.

**389 is the milestone's thesis in one gate.** M12 closed on "a tally is not a character until someone
decides what it means"; 401 then decided what the tally meant and spent it in a single instant — the
moment two dinos are already over a drop. This item asks the cheaper and better question: *does the dino
walk over there at all?* The answer costs a wary dino a real meal, which is what makes it character and
not display. Three details are worth keeping:

- **No memory is filed, and that is the whole reason the item is buildable.** The recall ring is six slots
  and `pecking.ts` *parses that ring* to derive the wariness. A "you hung back" memory per declined drop
  would roll the beats the fear is made of off the end of the ring, and a dino that hung back twice would
  forget why. A feature whose own output would erase its own input is a trap, and it was seen in the
  design rather than in a bug report.
- **The gate is around `reactionToFood`, never inside it**, so 381's escort read and the swarm's rush read
  are still the same function — the property the escort's own header comment claims and which would
  otherwise have silently become false.
- **No `continue` is taken.** The berthing dino falls through to the rest of its step and goes on
  wandering. QA's first movement assertion failed on this — it asserted the dino did not move, and the
  dino wandered away — and the fix was to assert *distance to the food*, which is what the item actually
  claims. A berth is not paralysis. That failed assertion is the more useful artifact of the two.

**A note the next fire should not skip.** `mobile-minds.spec.ts` "long dialogs page GBA-style" — logged as
**BACKLOG-430**, catalogued since cycle 93 as a *genuine break that fails on a clean HEAD in isolation*,
and standing red ever since — **passed**, under full parallel load, with nothing this cycle within reach
of the keeper picker or the dialog input path. One green run does not close it and it is **not** closed
here. But its backlog entry now describes evidence that no longer holds, and the honest next step is to
re-diagnose it (does it pass in isolation now? was it fixed incidentally and never noticed?) rather than
carry a nine-cycle-old description forward. Flagged in BACKLOG-430 itself.

## Bookkeeping

- CHANGELOG: cycle 129 entry added, both items.
- BACKLOG: 389 and 481 closed `[x]` (both the Structure Track pointer and the body entry for 481).
- MILESTONE: Milestone 13 lore arc 1 and structure arc 1 marked `[x]`. Four arcs remain (403, 404 / 482,
  466) — the milestone stays ACTIVE.
- Seeded this cycle by the Structure-smith: 484 (seat terms — now carrying finding 1 *and* finding 2),
  485 (upkeep reaches the call).
- Housekeeping: the backlog body carries closed bullets from this cycle only; the archive move is done at
  the Finish step.

## Next cycle

Lore: **BACKLOG-403** (victor's mercy) — arc 2, and the grace half of the same history 389 gave feet.
Structure: **BACKLOG-482** (one place the standings are derived) — with the council now *deciding*, three
per-zone standings derived three ways in three modules is the sprawl worth paying down before a fourth
arrives; it also inherits both of this cycle's findings, since the tie-break redundancy and the seat
arithmetic are both properties of where the seating rule lives.
