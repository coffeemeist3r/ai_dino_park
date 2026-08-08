# Cycle 125 — Structure Handoff

**Intent:** Milestone 12's spine is a *fork* — a fifth ground hanging off the middle of the chain, so the
distance layer M11 built finally meets a graph instead of a line. That work lands on the e2e suite, and the
e2e suite is currently the least trustworthy thing in the repo: BACKLOG-456's flake family surfaced in three
consecutive cycles and cost two full runs last night alone. Adding a fifth ground to a suite that already
fails two specs per run under parallel load is building on sand. So the milestone opens with the seam, not
the fork: **fix the harness, then load it.**

**Milestone duty:** Milestone 11 shipped, so this fire adds the **Structure arcs** to `studio/MILESTONE.md` —
456 (the seam), 478 (the fork), 479 (the council), 480 (upkeep), in that order.

**Cap rule:** the Structure Track carried 4 open items (466, 478, 479, 480) = X, so **no new items
brainstormed**. 456 is *promoted* into the track rather than invented: it already existed in `## Infra` with
full text, and it is structural by the routine's own rule of thumb — a seam every future e2e builds on.

**Off-milestone justification:** not needed — 456 is now structure arc 1 of Milestone 12, deliberately placed
ahead of the fork it protects.

**Added to Structure Track:** none invented — BACKLOG-456 promoted from `## Infra` to the top of the track.

**Chosen this cycle:** **BACKLOG-456** — give the pinned-pile / driven-crossing e2e pattern a proper seam.

**Scope note for the Designer.** The item catalogues *four* nouns, and they are not one bug:

1. `cycle-077-carry` — ambient gather/spawn re-banks into a pinned pile mid-crossing.
2. `cycle-097-carry-pressure` — same, via an auto-crafted cairn draining the pile under the soft cap.
3. `cycle-076-news-pull` — ambient *meetings* mutate `bonds` mid-drive, flipping `pickMigrant` into its
   homesick branch; **also latently nondeterministic** because the homesick pool is picked with
   `Math.random()`. Wants a deterministic pick *as well as* a hold.
4. `cycle-121-work-priority` — `page.reload()` racing the IndexedDB write under load. Not a pile assert at
   all; wants a flush-and-settle helper, a different mechanism from the other three.

431's `__pauseAmbient` is the existing precedent and the shape to extend, not replace. Prefer widening the
existing hold to cover gather/spawn/meetings over inventing a second freeze mechanism, and prefer making the
homesick pick positional (the `richestNeighbor` / `unsettledNeighbor` / `pondCompanion` precedent — every
migration pick shipped since cycle 109 is deterministic on purpose, and this is the last random one left in
a pickable set).

**Collision check with the lore track:** clean. 370 lives in `world/loner.ts` + the mope branch of
`forceStep`; 456 lives in the ambient/migration hold, the homesick pick, and `tests/e2e/`. No shared file.
