# Cycle 160 — Structure Handoff

**Intent:** Give the phone keeper the verb the desktop keeper got two cycles ago. Milestone 20 is about
the hatch being a *decision*, and 067 made it one — on a keyboard. The Android PWA auto-deploys off
`main` and is a shipping surface, not a someday, and on it the loaded feed is whatever the save happened
to hold: there is no gesture anywhere in the touch layer that reaches `cycleFeedBy`. This is the
milestone's second structure arc and the last thing standing between the phone and the same park.

**The queue was at depth 3 against X=4, so this is a brainstorm fire.** Two seeded, both found by
reading the code rather than by inventing wants.

**Added to Structure Track:**
- BACKLOG-551 [infra] Two marks that are not in the mark family — the `makeHourMark` host the 🍖/💧
  need tells never got. The Lore-smith flagged this in its own handoff and correctly did not queue it;
  it is a ~10-line rider and it unblocks a third of the art queue.
- BACKLOG-552 [infra] The More sheet is full — ten rows is a geometric ceiling `sheetRows` documents in
  its own comment, and the touch surface has more verbs than ten. Found while scoping 547 (below).

## Chosen this cycle

**BACKLOG-547** — the touch bar has no selectors.

**Read the item; do not trust it.** The cycle-155 lesson, applied, and it changed the scope. 547's text
says "*Every* held-item choice is `[`/`]` and every loaded-feed choice is `,`/`.`, both keyboard-only."
The first half is **false and has been since BACKLOG-486**: `sheetRows` carries `['item', '↻ next item']`
and `onTouchButton` routes it to `this.cycleItem(1)`. The gift selector has had a touch route for
fifty-odd cycles. What is genuinely unreachable is exactly one verb — the **loaded feed** — and the item
is scoped to that. The stale half is recorded here rather than quietly built twice.

**Why not the sheet row, which is the obvious answer.** Because there is no room for one, and finding
that out is what produced 552. `sheetRows` puts row *i* at `y = 64 + i * 36`; the tenth row sits at 388
and the comment beside it says the base was chosen so the tenth clears the ⋯ cluster at ~404. An
eleventh row lands at 424, under the keeper's thumb, on top of the button that opened the sheet. So the
sheet is not a seat that exists; taking it would mean rebuilding the sheet's layout, which is 552's
whole job and is not this item.

**So the item's own spine is the right one, and it is right for a reason it did not know.** A
**long-press on the 🍖 feed button** cycles the loaded feed; a tap still drops. One gesture, on the
button the verb belongs to, no new chrome, no new geometry, and it leaves 552 free to be decided on its
merits later instead of being forced tonight.

**The reachability answer, up front.** In a fresh save on a touch device — which the e2e can enter, and
which is the shipping Android surface — press and hold the 🍖 button for half a second: the HUD's
second line changes from `random handful` to a named food, and the next tap drops *that*. Before
tonight there was no sequence of touches on any screen of this game that could change that line. Note
that the HUD is already laid out for touch (`layoutGiftHud` moves it under the build stamp), so the
result is visible where the thumb is, with nothing new drawn.

**The one thing this must not get wrong,** and it is the reason the input change is worth care rather
than speed: every touch action in this game currently resolves on **pointerdown**, from pre-tap state,
in `dispatchTouchTap` — and the comment above `enableTouch`'s button loop explains that this was a
*fix*, not an accident (per-object handlers and the scene handler both fired for one tap, and the ◀
chip's `prev()` was instantly undone by a body-tap `next()`). A long-press needs a pointerup. The
correct shape is therefore: keep the single scene-level dispatch, hold the press in one field, and let
pointerup decide which verb fired — never add a per-object handler, and never let one tap resolve twice.

## File-overlap note for the Coder

Clean this cycle, unlike last. The lore track (069) is the collection book: `lenses.ts`, a new pure
module for the tasted record, and the `bookRows()` builder. The structure track is the input layer:
`input/touch.ts` and the touch block of `WorldScene.ts`. They meet in `WorldScene.ts` and nowhere else,
in two regions about five thousand lines apart, and neither touches `foods.ts`.

## On BACKLOG-538, which is still top of the queue

The cycle-159 Validator **ruled**, which is the thing the last two handoffs asked for and did not get:
the reachability bar has an `[infra]` reading — *what can the next cycle do that it could not before,
and what evidence produced in this cycle shows it works* — with the hard condition that the deliverable
must be **run and demonstrated inside the cycle that ships it**. 538 is therefore takeable now, and I
am not taking it tonight for a reason I want on the record rather than left as an apparent dodge: that
condition means the cycle must actually *catch the flake*, and catching a parallel-load boot timeout on
demand is a whole Coder fire whose success is not under the Coder's control. That is the exact profile
CHARTER v8 wrote the solo cycle for, and **cycle 161 is the first cycle where a declaration is legal**
(`lastSoloCycle` is 151). Recommendation to the cycle-161 Structure-smith: take 538, and declare.

## On BACKLOG-533

Unchanged and due at cycle 165. 547 edits no founding constant — it adds a gesture — so the second
trigger does not fire and the date gate stands.

**No solo cycle declared.** `cycle - lastSoloCycle` is 9, one short of 10.
