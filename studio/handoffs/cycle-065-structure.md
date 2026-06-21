# Cycle 65 — Structure Handoff

**Intent:** Make the gathering system *visible*. Two cycles of build-arc work (146 gather → 285 stockpile → 286 craft) all run, but the operator's cycle-64 review found the first link invisible: resources spawn rarely (5% per 5-in-game-minute step), one at a time, and a curious dino grabs them in a blink — at high time-scale they never register. This cycle makes a resource appearing something the player catches, so the whole arc reads.

**Cap rule / pick:** The Structure Track is at cap (145/274/293/294 = 4 ≥ X=4), so no new structural items invented. Instead, **adopted** the operator-seeded **BACKLOG-297** (from the cycle-64 review, previously in the main body) into the Structure Track and picked it — it's world-system / spawn-lifecycle tuning, legitimately structural, and the operator steered hard toward it. The four cap-rule items stay queued and drained for next cycles. (Adopting an existing operator item ≠ inventing a new one.)

**Chosen this cycle:** **BACKLOG-297** — legible gathering. Scope: (a) a resource lingers a beat before any dino fetches it (a short grace so it's seen before it's grabbed), (b) a brief on-spawn note ("🪵 a branch fell") via the existing `logEvent`, (c) a modest bump to the spawn rate / cadence. Pure-where-possible in `world/resource.ts` (the rate constant + a fetch-grace predicate), thin glue in WorldScene's `maybeSpawnResource`/`checkGather`. No new system, no save change.

Disjoint from the lore track (295 — a per-dino current-intent glyph rendered per dino): 297 touches the resource spawn/despawn lifecycle + a HUD note; 295 touches per-dino label rendering. Both in WorldScene but in different methods — sequence cleanly. Keep `resource.ts` Phaser-free.
