# Cycle 142 — Lore Handoff

**Theme:** A cycle about *ground*. Milestone 16 asked where any of this park's work actually happens, and
cycle 141 answered half of it — the pile got a place, and a heap now stands on it. What is still true is
that the most per-dino behaviour in the game, the tic, has left the grass exactly as it found it for
137 cycles. The rigs to fix that were drawn four cycles ago and nothing in the world blits them. This
cycle lays them down.

**Cycle number:** 142 (cycle 141 closed both tracks APPROVED, so the number bumps).

**Cap rule:**
- Social/emergent queue: **211 open** ≥ cap 12 → **no new social items brainstormed.**
- Art queue (`## Art`): **2 open** < cap 3 → **one `[art]` item seeded** (508). The section now sits at 3, at cap.

**Added to BACKLOG:**
- BACKLOG-507 [emergent] The ritual's mark, laid on the ground — the world wiring that lays a `tic_<kind>`
  worn patch under a dino's haunt (421) and lets it drift into a little path.
- BACKLOG-508 [art] The black glass and the thing built from it — the `obsidian` shard and the `beacon`
  rigs, so the Ridge's new exclusive resource and its landmark stop shipping as bare emoji.

**A note on seeding past the cap.** 507 is not an invention and is not a thirteenth social item in
spirit. Milestone 16's second lore arc reads *"the `fuss` patch drawn, **and a worn mark actually laid
under a tic anchor in the world**"* — and the whole arc is filed inside BACKLOG-496, which is tagged
`[art]`. Routine 2 forbids the Designer from picking `[art]` items; routine 7 (the Artist) does not touch
`WorldScene`. So the arc's second clause had **no item any stage of the chain was allowed to build**, and
would have sat unbuildable for the rest of the milestone while its own checklist line stared at us. 507
splits it at that seam. The CHARTER v6 milestone duty ("your seeding and your suggested next-up should
advance its unchecked lore arcs first") is what the cap rule exists to serve, not to block.

**Idea Box:** empty — no `[new]` entries under Open.

**Suggested next-up:** **BACKLOG-507.** It closes the buildable half of Milestone 16's ritual-mark arc,
it is reachable in the plainest possible sense (a dino invents a tic after twenty solitary steps and the
ground under it changes), and it needs no new persistence — `ticHaunts` has been saving the exact tile
the mark wants since cycle 138. It also hands the Artist a live host for the `fuss` patch, which is the
one piece of 496 still undrawn, so the arc can close in this same night's Artist fire.

**Noted for the Structure-smith (not queued here — structural):** the Ridge branch item (503) is the
top milestone-advancing structure pick and does not collide with 507's files (507 is `tic.ts` + the
sprite layer of `WorldScene`; 503 is `resource.ts` + the migration/spawn layer).
