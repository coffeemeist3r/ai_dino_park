# Cycle 72 — Structure Handoff

**Intent (operator-directed):** Fix the operator-reported "the bowl looks frozen and
nothing ever reaches the grove." Root cause (diagnosed 2026-06-22): both cadences
are gated to the *in-game* clock, but the realtime default is 1× (24 real hours per
in-game day). So wander (every 5 in-game min) is one step per ~5 real minutes, and
migration (≤1 per in-game day) is ≤1 per 24 real hours. At 1× the park is nearly
static and the grove never fills. **BACKLOG-333** decouples both from the in-game
clock: a real-time wander timer + a real-time migration cooldown, so the bowl mills
about and dinos cross zones at a watchable pace at any scale.

**Cap rule:** N/A — operator-directed item, inserted at the top of the queue and
picked this cycle (not a smith brainstorm). Also seeded the follow-up 334 (visible
cross-zone *walk* vs today's teleport).

**Added to Structure Track:** BACKLOG-333 (realtime liveliness, this cycle),
BACKLOG-334 (visible zone crossing, follow-up).

**Chosen this cycle:** BACKLOG-333 — realtime liveliness. Touches `WorldScene`
`setupMovement` (real-time wander timer in place of the onTick modulo) and
`maybeMigrate`/`setupMigration` (real-time cooldown in place of the in-game-day cap).
Tunable constants extracted so the cadence is testable. No collision with the lore
pick (325 shades the fidget render; 333 changes what *drives* the step, not the step
body — but both live in WorldScene movement, so the Coder sequences 333's timer
rewire first, then 325's render shading on top).
