# Cycle 129 — Lore Handoff

**Theme:** Milestone 12 closed on a finding worth building the next milestone *out of*: "a tally is not a
character until someone decides what it means." Cycle 128 shipped 401 — a dino's contested-drop history
read *per opponent* — and that history currently decides exactly one thing, at the moment two dinos are
already nose to nose over a drop. It changes nothing about whether a dino walks over there at all. So
Milestone 13's lore half is the hatch's social history **leaving the tile it was made on**: first the feet
(a dino that has been shouldered aside gives that one a wider berth), then the grace (a winner that can
afford to be generous to the one it denied), then the voice (what just happened at the hatch colours the
next thing the dino says). Three arcs, one source, three different registers — and none of them a fourth
counter.

**Milestone duty:** Milestone 12 shipped cycle 128 with no ACTIVE milestone in `studio/MILESTONE.md`.
Drafted **Milestone 13 — "The hatch is a society, and the ground votes"**: headline + the three Lore arcs
below. The Structure-smith adds the Structure arcs in its fire.

**Cap rule:** open lore-track items ≫ 12 (the body backlog is deep in the dozens), so **no new items
brainstormed** this cycle — themed and picked from the queue, per the drain-before-invent rule.

**Added to BACKLOG:** none (cap rule).

**Suggested next-up:** **BACKLOG-389** — *bullied dino remembers*. It is the first arc of the new
milestone and the shortest path from 401's per-opponent disposition to something the player can *watch*:
a dino that reads `wary` toward a rival already closer to the drop hangs back instead of joining the
swarm. The 401 machinery (`dispositionToward`) is already pure, already tested, and already reads the
live memory ring, so the whole item is one pure predicate plus one gate in the rush branch — arc-sized in
consequence, not in surface. It also makes the pecking order legible *without the book*: you see who
won't come to dinner.

**A note for the Structure-smith:** 479 shipped the council and **481 is no longer blocked** (its
"Blocked on 479" tag is stale). It is BACKLOG-031 from cycle 1, and it does not collide with 389 — 389
lives in `pecking.ts` + the rush branch of `stepDinos`, 481 in `governance.ts` + `workPriorityFor`.
Different files, one shared scene, no shared function.

**Idea Box:** empty (no open entries).
