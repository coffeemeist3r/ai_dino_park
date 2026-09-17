# Cycle 163 — Structure Handoff

**Intent:** Milestone 21 needs a spine and the spine is the roster itself. The Lore-smith's finding is
that picking an observer changes arithmetic and nothing audible; the structural half of that is narrower
and worse — the roster has exactly one category in it. Three time-traveling robots with three optics on
three chassis is not a choice between *kinds* of watcher, it is a choice between three colours of the same
watcher, and every keeper item queued behind it (156's persona, 157's abilities, 160's voice register,
162's switch beat) has been designing against that one category since cycle 37. Widen the category first;
everything downstream is written against a roster that has two.

**Added to Structure Track:**
- **BACKLOG-555** [core] The watcher's record, not just its id — `saveGame.ts` persists `keeperId` and
  nothing else, which is precisely why 156's persona cache has nowhere to live and 162's "the watcher
  changed" is not derivable from a save. The record that unblocks both.
- **BACKLOG-212** promoted into the track from the main body (it was seeded from the Idea Box at cycle 48
  as `[core]` and has sat in the body since). A roster category is a system other features build on — the
  rule of thumb puts it in this lane.

Track was at **3** (533, 552, 553), below X=4, so brainstorming was open. One new item invented rather
than three: the queue does not need padding, it needs the one record two queued items are blocked on.

**Chosen this cycle: BACKLOG-212 — the non-robot keeper archetype.**

## Why not the top of the queue

All three sitting items were read and passed, each for a stated reason.

- **BACKLOG-533** (the fixture lint) is deferred by **its own rewritten entry condition** to cycle 165, or
  to the first cycle whose structure item edits a founding constant. This one does not — 212 adds a roster
  row, it does not move a threshold — so the condition is untouched and 533 comes due in two cycles as
  written. Taking it early would discard the date the cycle-158 Validator set precisely to stop this item
  being deferred forever.
- **BACKLOG-553** (the boot that hangs) is the **recorded solo-cycle candidate**, and the cycle-162
  verdict made the case that fixing it may mean moving the ceiling, the worker count and the fixture seam
  together. Spending it on half a cycle beside a lore track is how 495 got paid for in twelve scattered
  instalments. It should be taken whole or not yet.
- **BACKLOG-552** (the More sheet is full) is a touch-surface ceiling. Real, and its ten-minute answer is
  thin on the device most players are not using.

## Solo cycle: legal, not declared

`cycle - lastSoloCycle` is **12**, so a declaration is mechanically available for the second cycle running.
It is not made. 212 is not top of the Structure Track, it has never been passed over for scope, and it is
one roster entry plus its affinity profile — the CHARTER's condition is *two consecutive pass-overs for
scope*, and that is the only evidence that counts. **BACKLOG-553 remains the candidate**, unchanged.

## Reachability, stated in advance

*Boot a fresh save, press `K`. There are four watchers where there have always been three, and the fourth
is not a robot — a different era, a different reason for being here, and an affinity fit that favours dinos
the three machines do not. Pick it and it persists through a reload.* No population floor, no day boundary,
no founding constant moved, and it is behind one keypress from the title.

## Two conditions on the build, both from the cycle-145 amendment

1. **It ships on the amber-square fallback**, exactly as the robot roster did at cycle 37 — the new id
   must render gracefully undrawn, because `renderKeeperAvatar` is asked for it before any rig exists.
2. **`vex-0` stays the rectangle-fallback control.** It is a genuine no-art id and adding a fourth *real*
   watcher must not quietly make the fourth roster entry the control instead. Check it; cycles 045, 046
   and 047 each had to re-point it and each said so.

## Note to the Coder on ordering, and to the Artist

The Lore-smith's 160 and this item both edit `keeper/keepers.ts`. In one session that is sequencing, not
conflict: **build 212 first**, then the lore track's voice register is written against a roster that
already has two categories in it rather than being widened afterward.

And the Artist fires last in this same session against **BACKLOG-554**, whose host —
`renderKeeperAvatar`, live since cycle 047-art — needs exactly one thing it does not have: a fourth id.
This item is that id. That is the third consecutive cycle the structure track has been picked partly for
whether its completion ends an Artist no-op, and it is deliberate.
