# Cycle 162 — Structure Handoff

**Intent:** End an Artist no-op by building the host, not by drawing something else. The art queue has
produced **two consecutive no-op fires** and the cycle-161 Artist did the work of proving why: it swept
the whole surface, found every placeable key already rigged, and reported that all three open `[art]`
items are blocked on the same thing — *somewhere to hang*. One of those three blockers is ten lines of
scene glue on this queue, and it has been sitting second. Tonight it is taken, and the Artist fires at
the end of this same session onto a host that exists.

**Added to Structure Track:** none — drained from queue (4 open ≥ X=4).

**Chosen this cycle:** **BACKLOG-551** — *Two marks that are not in the mark family.*

## Why not 533 (which is top)

533's entry condition, rewritten at cycle 158, names its own trigger: *"Taken at cycle 165, or at the
first cycle whose structure item edits a founding constant, whichever comes first."* This is cycle 162
and 551 edits no founding constant — it edits a mark's construction — so 533 is not yet due by the
queue's own text and stays top. It is taken in three cycles at the latest.

## Why 551 over 552 and 553

- **552** (the More sheet's geometric ceiling) is real and will bite every future keeper verb, but nothing
  is standing on it tonight: the eleventh row has no occupant queued.
- **553** (the boot that hangs) is the most interesting item on this queue and it is a *diagnosis*, which
  is exactly the shape that wants a whole fire and possibly a moved ceiling. It is the better solo-cycle
  candidate and should not be started as a side-dish beside a lore track.
- **551** is the only item on this queue whose completion ends an Artist no-op. BACKLOG-550 (the need
  marks) is, by the cycle-160 Artist's own reading, the most-seen un-drawn thing in the park: every dino
  carries a need, needs build on every tick, and the 🍖/💧 tell is up long before anything else in the
  mark family fires. The fix is not a new pattern either — `refreshMissedMarks` already swaps two rigs
  onto one sprite (`missed` / `missed_aloof`), which is precisely the shape wanted here.

## Solo cycle — not declared

`cycle - lastSoloCycle` is 11, so a declaration is mechanically legal for the first time since cycle 151.
It is not made. 551 is ten lines of glue and a register entry; CHARTER v8 exists for an item the queue has
*proved it cannot drain*, and this one has never been passed over for scope. **BACKLOG-553 remains the
candidate**, for the reason the cycle-161 Validator recorded: fixing a hang may mean moving the ceiling,
the worker count and the fixture seam together, and that is genuinely unsplittable at a playable seam.

## Collision check with the lore track

Both tracks land in `WorldScene.ts`, in different rooms: 126 works the feeding tail (`eatFood`) and the
greet path (`recordGreet` / `recordTone`); 551 works the mark plumbing (`makeHourMark` at ~3651/3950 and
`refreshNeedMarks` at ~4241) plus `worldPlacedProps()`. No shared function. Clean two-track fire.

## Milestone

Off-milestone, and necessarily so: Milestone 20's structure lane closed at cycle 160 with both arcs
checked. The justification is the one above — it is the cheapest unblock on the board and it hands the
Artist a subject in the same session.
