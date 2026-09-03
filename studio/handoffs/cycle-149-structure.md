# Cycle 149 — Structure Handoff

**Intent:** Milestone 17's structure arcs all closed at cycle 148, so tonight's pick is off-milestone by the
checklist and dead-centre by the subject. **Justification:** the milestone is *A day in the park*, and
BACKLOG-523 is the one remaining thing about the park's day that nobody has looked at — **the hour the day
starts on.** The milestone spent five cycles building reads that are all measured from 08:00, and 08:00 is a
literal in a field initialiser, written once, derived from nothing, pinned by nothing. Closing the milestone
tonight without this would close it with its own origin unexamined. The lore track is closing the last lore
arc in the same fire; this closes the thing under all of them.

**Added to Structure Track:** BACKLOG-528, BACKLOG-529 (queue was at **2** open against X=4, so it brainstorms
before it picks — the first time it has been under its cap since cycle 143).

- **BACKLOG-528 [infra] The register can only see the first frame.** Every one of 501's ten entries is a
  claim about `founding*()` — a save that has just been created. The park's second-commonest state is a save
  that has been *played*, and the register cannot express a single claim about it, so a tuning pass that
  leaves the park interesting for ninety seconds and empty afterwards passes the bar clean. 501's thesis
  applied to the axis 501 could not see from where it stood.
- **BACKLOG-529 [core] The keeper's own clock is not the park's.** Tonight's vigil is the first system to
  read the *wall clock's hour* as world-facing state, through a bare `new Date()`. An hour-of-day is not a
  duration: it is local, it moves under DST, and it is now load-bearing for a register-pinned beat. One
  injectable seam owning the keeper's local hour, the way `WorldClock` owns the park's.

**Chosen this cycle:** **BACKLOG-523** — the hour a save opens on.

Why it, and why not 495. 495 is still the deepest item here and it was passed over for the third time for
the same honest reason it was passed over for the second: its scope is ~550 specs and that is not one Coder
fire, least of all a two-track one. It wants a cycle where it is the only thing in flight, and it says so.
523 is the opposite shape — one constant, one register entry, a bounded blast radius — and it is the item
whose absence gets more expensive every cycle the milestone ships another read measured from it.

**What "derive it" has to mean here, because the item can be dodged.** Renaming `8` to `FOUNDING_HOUR` and
exporting it is *not* the work; that is 519's move, and 519 was about a number copied twice. This number is
written exactly once. The defect is that nothing anywhere states **what the park is claiming to show at that
hour**, so the constant can be moved four hours in either direction, the whole milestone's frame-one read can
go dark, and every gate in this studio stays green. The deliverable is the claim: a reachability entry of
501's shape saying *the save opens inside the window where the cast is split — somebody up, somebody down* —
routed through `chronotypeOf`/`atRest` over the shipping roster, restating neither 08:00 nor any hour. And
the founding hour lands beside `ACTIVE_SCALE` in `clock.ts`, because *when a session starts* and *how fast it
runs* are the two halves of one sentence and have never been read in the same place.

**Collision check with the lore track.** Both tracks touch `reachability.ts` (each adds one entry to the same
array) and both read `chronotype.ts` (neither edits it). No shared function is modified by both. The Coder
takes the structure track first: 523's entry is the shorter one, and the lore track's entry wants the founding
hour to already have a name.
