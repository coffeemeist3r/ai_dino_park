# Cycle 155 — Lore Handoff

**Theme: the bookend.** Milestone 18 has spent five cycles teaching the park to say
something about the keeper's *absence* — what each dino made of it, what it cost a pair,
where you can re-read it, and how many days running you have come back. Every one of those
is about the **return**. One arc is left and it is the only one on the other side of the
door: the park should notice you *leaving*. A cycle that closes a milestone should close it
on the beat the milestone was missing, not on a sixth variation of the beat it already had.

**Cap rule:** social/emergent queue at **198 open ≥ 12** — no new social items seeded this
cycle. Art queue at **1 open < 3** — one `[art]` item seeded, per the split-queue cap.

**Added to BACKLOG:**
- BACKLOG-540 [art] The parting look — the glance mark for BACKLOG-119, seeded because its
  host ships in the same cycle as the seed (the cycle-145 amendment's condition, and the
  same reasoning that let 539 be seeded last cycle while 537 was held).

**Suggested next-up:** **BACKLOG-119 — Goodbye glance.** It is the last unchecked lore arc
of Milestone 18 and the only one that faces outward. Ships the milestone's spine closed.

**One warning the Designer must answer, in writing, before this passes the bar.** The item's
own text names `visibilitychange → hidden` as the trigger, and that is the *one* moment in
this whole feature at which the player is, by definition, no longer looking at the canvas. A
glance drawn on a hidden tab is a glance nobody sees — the reachability bar's failure mode
in its purest form, and this item has carried that flaw in its text since cycle 30 without
anyone reading it out loud. The trigger the player can actually see is the *step before*
hidden: the window losing focus while the canvas is still painted (alt-tab, clicking another
window, the pointer leaving the bowl). Design the glance to fire on the leaving that still
renders, and let the hidden event be the fallback that keeps the state honest — not the
other way round. If the Designer disagrees, say so with a reason; do not ship the version
that fires into the dark.

**Idea Box:** empty (no `[new]` entries under Open).
