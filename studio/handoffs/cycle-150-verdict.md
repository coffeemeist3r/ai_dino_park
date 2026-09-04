# Cycle 150 — Verdict

**Gates:** build clean, **2440 unit green** across 234 files, **659/659 e2e** on a fresh full run.
**Milestone 18 opened this cycle** and closes two of its seven arcs on its first fire.

---

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-116 — Missed-you memory

**Rationale.** The item as filed is four words long — *a faint memory that can color the very next
greeting* — and the cheapest reading of it was one string filed on every dino and read back by the
greeting path. That version would have passed every gate, and it would have been the defect this
studio has spent three amendments learning to name: one system with five identical outputs, in the
cycle whose whole subject is that five different minds lived through the same thing. What shipped
grades the absence on **two independent axes**, and the second axis is the one that earns the item.
A single warmth score collapses *did not care* and *cared and will not say* into the same dino, and
those are the two most different residents in the bowl. Splitting them means Twitch — the warmest
personality on the roster, agreeableness 0.93 — is **unmoved**, because it was never looking at you
in the first place; and Rex, at 0.02, is aloof rather than absent, because it was. Neither of those
reads is available to a one-axis grade, and both are true about those dinos in every other system
they appear in.

**The third grade wears nothing, and that is the feature.** `missedYou` omits `unmoved` residents
from its map rather than returning them with a value, which is a small decision with a large
consequence: there is no path by which a consumer accidentally renders the absence. What the player
sees on the first frame after a five-minute step-away is two Bowl residents standing there with a
thought over their heads and two standing there without one — and the empty air is legible only
because the marked ones are beside it.

**The threshold was set, not inherited, and that is the reachability answer.** `HOMECOMING_MIN_MINUTES`
is 360, and the catch-up runs at `AWAY_SCALE`, so the existing nuzzle needs **six real hours** away.
Inheriting it would have shipped a beat no ten-minute session could reach — CHARTER v7's corollary
exactly, in the one cycle where the corollary was most likely to be waved through as "well, absences
are long". At `MISSED_MIN_MINUTES = 5` the beat is common, faint, and inside the bar's window: play a
minute so an autosave lands, close the tab, come back five minutes later.

**The bars were fitted rather than picked, and the first draft was rejected on a number.** A notice
bar of 0.50 left a founding resident 0.023 from the line, which means a founding dino's grade hanging
on any unrelated trait tweak anywhere in the park. At 0.52 every one of the ten clears or misses by
at least 0.034, and the Bowl splits three-noticing / two-not — which is what puts all three grades in
the founding five. `chronotype.ts` fitted `OWL_BAR` the same way for the same reason, and the unit
suite pins the margin rather than the outcome, so a roster change re-earns the spread instead of
silently losing it.

**One criterion met differently from how it was written, recorded rather than narrowed.** The design
asked for a visible mark on *every* graded dino. That is false by construction and the codeplan said
so in advance: the missed mark sits at the bottom of the hour-mark precedence order, so a graded dino
that is also asleep, up-at-night, or keeping the vigil wears the higher mark and no thought. What is
asserted instead is the claim in both directions with no false half — every visible mark belongs to a
graded dino, and no ungraded dino wears one. That precedence rule is also the first thing in this park
to make the marks' ordering **testable**: `__missedMarks()` reads the sprites, not the model.

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-529 — The keeper's own clock is not the park's

**Rationale.** The available dodge here was a one-line helper wrapping `getHours()`, and the item
would have looked closed. What it actually asked for was the three answers, and the reason to build
it this cycle rather than next is that **each of the three had a caller arriving behind it**. The
answers are now written once, in the module that owns the reading, and each is pinned: DST fall-back
records both sightings deliberately, because the visit history is hours *as the keeper lived them*
and de-duplicating would be the park telling the player they were not where they were; spring-forward
needs no special case and the test proves the skipped hour is never returned; and a keeper who changes
timezone is believed within `VISIT_HISTORY_MAX` by the same mechanism that believes a changed habit —
the alternative, pinning the save's original zone, was considered and rejected in writing, because a
keeper who moves house is a keeper whose hour changed.

**The DST tests find their own boundary and skip loudly when there is none.** They scan the test
machine's real zone for a transition rather than hardcoding one, and on a zone without DST they warn
and return instead of passing. That branch did not fire on this run — both transitions were found and
exercised — but it is the difference between coverage and the appearance of it, and this suite has
been bitten by the appearance of it before.

**And the seam immediately paid for itself in the suite.** `cycle-149-vigil`'s third test derived its
"far" hour from `new Date().getHours()` **in the spec** — the same coin flip the seam exists to
remove, one cycle old, asserting a negative against whatever hour CI happened to be at. It now *puts*
the keeper at an hour and asserts both directions: no vigil twelve hours off the learned hour, a vigil
back on it. That second half did not exist before, because there was no way to write it.

**`keeperDay` ships with no consumer.** Under ordinary rules that is scaffolding and would be cut. It
survives because BACKLOG-122 is the next arc of the milestone this cycle opened, the plan named that
consumer by number before the code was written, and a day-of-the-player's-life derived per caller is
the precise defect this item was filed on. If 122 slips past cycle 152, the next Structure-smith should
delete it rather than let it sit.

---

## Milestone 18

Two arcs closed on the milestone's opening fire: the lore arc *each dino keeps its own account of the
absence* (116) and the structure arc *the keeper's own hour is a seam the park owns* (529). Five arcs
remain — 113, 119, 114, 122 — with 122 now unblocked by tonight's structure track, which is the shape
a milestone is supposed to have.

## Filed this cycle

- **BACKLOG-531** [art] — the missed-you thought-mark, seeded by the Lore-smith **with its host shipping
  the same night**, so it is drawn rather than stashed. Second consecutive cycle an art item has been
  filed and hosted inside one fire; the queue's cycle-145 amendment is working as intended.

## Raised for the operator — BACKLOG-495, passed over a fifth time

The Structure-smith flagged this and it is now the Validator's to state plainly, because the studio has
deferred it four times for a reason it cannot itself act on.

495 (the declared founding fixture) has been top of the Structure Track since cycle 136. Every fire has
passed it over, and every fire has given the same honest reason: its scope is a fixture seam across ~550
specs, which is not one Coder fire alongside a lore track. Meanwhile it has been paid for in instalments —
`gatherToBowl`, `emptyGrounds`, `__seedGranaryReady`, and by cycle 146's count nine more — and two of those
instalments were about *time* rather than founding state, a use the item did not anticipate.

**The routine cannot fix this, because the CHARTER's cycle shape is two tracks.** What 495 needs is a cycle
where it is the only thing in flight, and granting itself a single-track cycle is not something a routine
should do on its own authority. Two options for the operator, neither taken here:

1. Amend the CHARTER to permit an occasional **single-track cycle** when the Structure-smith declares an
   item too large to run beside a lore track, capped (say) at one in ten.
2. Rule that 495 ships as a **rider** across several cycles — the shape BACKLOG-515 closed in, which worked
   and is precedent — accepting that a rider gets an hour rather than a cycle.

Until one of those, expect a sixth pass-over next cycle with the same paragraph attached.

## Not raised as a CHARTER amendment

Nothing in the work itself wants a constitution change. Worth recording that v7's corollary was the
binding constraint on the lore track's single most consequential number, and that the cheap version of
this item — inherit the nuzzle's threshold — would have passed every gate the studio had before v7 existed.
