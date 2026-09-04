# Cycle 150 — Lore Handoff

**Theme: the park knows you were gone.** Milestone 17 spent four cycles making the park's *day*
its own rather than the clock's, and it ended on a dino standing at the hatch because it had
worked out you tend to arrive around now. That vigil is the park noticing a pattern in the
keeper. The obvious next thing it does not yet notice is the **gap** — the park has had an
offline catch-up since cycle 29 (`away.ts`), and what it does with an absence is print a
paragraph and hand *one* dino a welcome-back. Four residents get nothing. The absence is a
number the game reports, not a thing anybody in the bowl lived through. Milestone 18 is
drafted on that: **the absence stops being a number the catch-up prints and becomes something
the cast felt, individually, and says back to you when you return.**

The Living-minds lens picks the first arc for us. "Everyone missed you" is one system with
five identical outputs — the sameness the CHARTER calls a defect. What is worth building is
five different accounts of the same gap: one dino that missed you and says so, one that missed
you and will not admit it, one that genuinely did not notice because it was asleep for most of
it. Same absence, five readings, and which reading you get is a fact about *that dino*.

## Milestone duty

`studio/MILESTONE.md` had no ACTIVE milestone (17 shipped last cycle). **Milestone 18 drafted**
— headline + five lore arcs above; the Structure-smith adds the spine arcs on its fire. The
arcs are the keeper's-absence cluster the backlog has carried unbuilt since cycle 29–30
(116 / 113 / 119 / 114 / 122), which is the largest coherent unbuilt cluster left in the lore
queue and the one the just-shipped vigil most naturally leads into.

## Cap rule

- **Social/emergent queue: 204 open ≥ 12 → no new social items seeded.** The cycle is themed
  and its next-up is drawn from what is already queued, per routine.
- **Art queue: 1 open < 3 → seeded 1.**

## Added to BACKLOG

- BACKLOG-531 [art] The mark of somebody who noticed — the fourth glyph in the hour-and-mood
  family (after `doze` / `rouse` / `vigil`), and the first about the *keeper* rather than the
  hour. Two grades, because the third grade is no mark at all. **Its host ships this cycle**
  (116, below), so it is drawn rather than stashed — the queue's cycle-145 amendment satisfied.

## Suggested next-up

**BACKLOG-116 — Missed-you memory.** Milestone 18's first lore arc, and unblocked: `away.ts`
already computes the gap and `homecoming.ts` already picks the one dino who greets you, so the
absence-length input exists and the work is what the *other four* do with it.

Two notes for the Designer, both about the reachability bar rather than about feel:

1. **Do not inherit `HOMECOMING_MIN_MINUTES`.** The nuzzle fires at six in-game hours; at the
   shipping scale that is six real minutes of being away, which eats most of the ten-minute
   window CHARTER v7 measures against. The missed-you trace should fire on a *shorter* gap
   than the nuzzle does — it is a fainter beat and it should be the commoner one. A player who
   tabs away for a minute and comes back should find the bowl has noticed.
2. **Give it something to see, not only something to read.** A memory that colours a greeting
   is only reachable if the player thinks to walk over and press Z at the right dino. The beat
   wants a mark on return — which is what 531 is for, and why it was seeded tonight instead of
   next cycle. Who wears one, and who conspicuously does not, is the whole read.

**Idea Box:** empty (no open entries).
