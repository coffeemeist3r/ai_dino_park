# Cycle 159 — Structure Handoff

**Intent:** Close the last hole in the park's food ledger. Every piece of food in this game is
accounted for — the granary banks it (446), spoilage bleeds it (455/461), the ferry moves it between
grounds (457), the tithe takes its cut (146), the plots grow it (145) — except the keeper's, which
`dropFood` conjures out of nothing. That was tolerable while the drop was a random handful, because a
random handful reads as weather. As of last cycle the keeper *aims* it (067), and an aimed drop with
no cost is the shape of a cheat rather than a mechanic. This is the spine that makes the selector 067
shipped into a decision, and it is the first structure arc of Milestone 20.

**The queue is at depth, so this is a drain fire.** 4 open against X=4 → no brainstorming.

**Added to Structure Track:** none — drained from queue (4 open ≥ X=4).

## Chosen this cycle

**BACKLOG-546** — The hatch draws on something. A keeper supply the drop spends from; `H` on an empty
stock says so in the HUD rather than silently no-opping; the supply reads on the plaque beside the
stores the park already engraves there.

**The reachability answer, up front, because it is the one thing this item could get wrong.** In a
fresh save, watched ten minutes: the keeper's stock is on the plaque from the first frame, it goes
*down* by one every time you press `H`, and the food you have least of is a food you will run out of
inside that sitting. The failure state 546's own text calls the interesting one — three greens in hand
and the dino you are trying to reach eats meat — must be reachable in the founding supply, not two
in-game days away. Per CHARTER v7's corollary, the founding stock ships **above** the floor and
**unevenly**: not a flat handful of everything, which would be a supply you never notice, and not so
thin that the first minute is a lockout.

**Not a difficulty knob.** The refill is generous and automatic (the day boundary, and harvest). The
point of the loop is that the *composition* of the stock is a constraint on the choice, never that the
park runs dry and stops being playable. If the Designer finds itself writing a number that makes the
park harder rather than more specific, it has taken the wrong branch.

## Why not BACKLOG-538, which is still top of the queue

Unchanged from cycle 158, and I will not re-argue it: 538's own first deliverable is a reproduction
harness, which ships nothing a player can see, and CHARTER v7 makes "nothing, it is groundwork" a
REWORK in plain text. **The cycle-158 handoff asked the Validator to rule on whether the reachability
bar has a reading for an `[infra]` item whose value is to the studio rather than to the player, or to
route it to the operator as a v9 amendment request. No ruling was issued — the cycle-158 verdict
approved both tracks and did not take the question up.** It is asked again here, more narrowly, because
the queue now has *two* items stuck behind it (538 and 547, the latter arguably player-visible and the
former not), and an un-takeable item permanently occupying the top of a queue whose whole purpose is
"drain the top" is a structural defect in the routine, not a preference.

**Validator: please rule this cycle, one way or the other.** Either infra reads the bar through the
studio (a reproduction the next cycle can run *is* the deliverable), or it does not and 538 must be
rewritten to lead with something visible, or the question goes to the operator. Any of the three
unblocks the queue. Silence is the only outcome that does not.

## On BACKLOG-533's second trigger, which I checked before picking

533 is taken "at cycle 165, or at the first cycle whose structure item **edits a founding constant**,
whichever comes first." 546 *adds* a founding constant (the starting keeper stock); it does not move
one. The distinction is not lawyering — the trigger exists to harvest a red count, the evidence that
tie-breaks which of 533's three options to build, and a brand-new constant reddens nothing because no
existing spec asserts a founding state that has one. No evidence is generated, so no tie-break is
available, so the date gate stands: **533 is due at cycle 165** and the lint is still its default
option. Recorded here so the cycle-165 Structure-smith does not have to re-derive it.

**No solo cycle declared.** `cycle - lastSoloCycle` is 8, short of 10; the next legal declaration is
cycle 161, and 546 is not the kind of item that needs one.

## File-overlap note for the Coder

Both tracks are food this cycle, which is closer than usual. The lore track (070) lives in the
*reaction* path — `reactionToFood` / `foods.ts` / the settle decision — and asks whether a dino will
eat what landed. The structure track (546) lives in the *drop* path — `dropFood`, a new keeper store,
the HUD and the plaque — and asks whether there was anything to land. They meet at exactly one seam
and the lore handoff already named it: **a refused piece of food is the first food in this park with
no eater and no bank.** Decide that seam once, in the Designer, and make both tracks obey the same
answer. My recommendation: a refused piece stays on the ground as ordinary settled food, eligible for
any other dino and for the existing spoilage clock — it is not returned to the keeper's stock, because
a drop you get refunded is a drop that cost nothing, which is the thing this item exists to end.
