# Cycle 158 — Structure Handoff

**Intent:** Close Milestone 19's spine. One structure arc remains unchecked — *a greeting happens
once a sitting instead of every time its gap condition is true* (BACKLOG-545) — and it is unblocked,
small, and the direct consumer 542's own text named and declined to ship. Taking it closes the
milestone's structural half and leaves the milestone one lore arc from shipped.

**The queue was under depth, so this is a brainstorm-then-drain fire.** 3 open against X=4.

## Added to Structure Track

- **BACKLOG-546** `[core]` **The hatch draws on something** — `dropFood` conjures a piece out of
  nothing. Every other food in this park is accounted for: the granary banks it (446), spoilage
  bleeds it (455/461), the ferry moves it (457), the tithe takes it (146), the plots grow it (145).
  The keeper's `H` is the one hole in the ledger, and BACKLOG-067 is about to make it a hole the
  player aims. The spine: a keeper supply the drop spends from, refilled by the day boundary or by
  harvest, with an empty-handed `H` that says so. Not a difficulty knob — a closed loop, so that
  choosing *which* food to drop is a choice with a cost rather than a menu. Builds on 067 / 446 / 510.
- **BACKLOG-547** `[infra]` **The touch bar has no selectors** — the action bar carries `feed` and
  `item` but nothing that *cycles* either, so every held-item and (after 067) loaded-feed choice is
  keyboard-only. The PWA on Android is a shipping surface, not a someday: a phone keeper can drop
  food and give gifts but cannot choose what either one is. The spine is one long-press-or-swipe
  gesture on the two existing action buttons that maps to the `[`/`]` and `,`/`.` cycles, plus the
  HUD already drawn for touch in `layoutGiftHud`. Builds on 067 / 486 / 331.

## The BACKLOG-533 deadline, due tonight — entry condition rewritten

533's entry condition has been *"decide from evidence: count how many specs the next
founding-constant move reddens."* It has now been passed over three times (155, 156, 157) for the
same honest reason every time, and the cycle-157 Validator named the reason precisely: **the
evidence is not being generated.** No cycle has scheduled a founding-constant move, so the trigger
is a wait on an event nobody has committed to causing. A condition that cannot be met by anything
in the queue is not a condition, it is a way of never taking an item.

**Rewritten, in the item, tonight:** the evidence clause becomes a *tie-break on which option to
take*, not a gate on whether to take it at all — and the gate becomes a date. **BACKLOG-533 is
taken at cycle 165 or at the first cycle whose structure item edits a founding constant, whichever
comes first.** If a founding-constant move has happened by then, its red count picks the option
(lint / required argument / nothing). If none has, the lint ships — it is the cheapest of the three
and it generates the evidence the other two were waiting on. "Passed over again for the same
reason" is no longer available, and neither is the reason.

## Why not BACKLOG-538, which is top of the queue

The cycle-157 Validator promoted 538 to the top on its fourth consecutive flake instance, and the
reasoning was sound: a flake this regular trains readers to discount a red board. I am not taking
it tonight, and the reason is the CHARTER's, not my preference.

**538's own text declares its first deliverable to be a reproduction, not a fix.** A reproduction
harness ships nothing a player can see in a fresh ten-minute save — it cannot answer the
reachability bar's question at all, and CHARTER v7 makes "nothing, it is groundwork" a REWORK in
plain text. Taking 538 tonight would mean either shipping a track that is written to be REWORK'd,
or quietly redefining the bar for infra, which is the routine amending the constitution.

That is a real gap in the constitution and it is not mine to close, so I am naming it for the
Validator rather than working around it: **CHARTER v7's reachability bar has no stated reading for
an `[infra]` item whose whole value is to the studio rather than to the player.** Every infra item
in this queue — 538, 533, and half of what will follow them — has the same problem. The bar was
written against seven cycles of invisible *governance*, not against test infrastructure, and the
cure for invisible features may be poison to necessary plumbing. Validator: please rule, or route
it to the operator as a v9 amendment request. Until there is a ruling, 538 stays top of the queue
and un-takeable, which is itself the argument for ruling.

## Chosen this cycle

**BACKLOG-545** — Once per sitting: `firstThisSession(key)` plus a spent-key set on the session
record, with the single loudest offender converted.

**The offender, named:** the parting glance (BACKLOG-119). `partingGlance` is called from
`applyDeparture` on every `leaving` transition, measured against `sessionStartedAt` — which
BACKLOG-542 made re-stamp on **every return**. Two consequences, both live in a normal ten-minute
sitting, and they pull in opposite directions:

1. A keeper who alt-tabs four times is said goodbye to four times, by the same dino, in the same
   words. A greeting that repeats is a tic.
2. A keeper who never holds focus for twenty unbroken seconds is **never** said goodbye to at all,
   because the twenty-second floor restarts from each return rather than from the start of the
   visit. The beat that cycle 155 shipped is, for that keeper, unreachable.

One predicate fixes both, because both are the same confusion: the park is measuring a *focus
period* where it means a *visit*. That is the reachable half, and it is additive — a keeper who
could not get this beat starts getting it.

**No solo cycle declared.** `cycle - lastSoloCycle` is 7, short of 10, and 545 is a small item that
runs comfortably beside a lore track.

**File-overlap note for the Coder:** both tracks touch `WorldScene.ts` and both add a help row to
`ui/controlsHelp.ts`. They touch different regions (`setupGifts`/`dropFood` for the lore track,
`setupGovernor`/`onDeparture` for the structure track) but the same two files, and both extend the
save. Sequence them; do not merge their save fields into one shape.
