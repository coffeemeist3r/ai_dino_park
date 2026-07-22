# Cycle 108 — Structure Handoff

**Intent:** Milestone 6 promised that "a fourth zone is a table row, not three new code branches," and this
is the arc that pays it. The park already proved the pattern once: cycle-383 folded the hard-coded
bowl↔grove link out of five helpers into `ZONE_LINKS`, and the third zone (378) then slotted in as two rows.
**Terrain never got that treatment.** A zone's ground is still a hand-written `*TileAt` function per zone
(`groveTileAt` / `fernreachTileAt` / `bowlTileAt`), an `if`-chain dispatcher (`zoneTileAt`), and a *second*
parallel `if`-chain for the named landmark tiles (`zoneWaterTile` → `grovePondTile` / `fernreachCreekTile` /
`bowlPondTile`) — six functions and two dispatchers encoding what is really one fact per zone. Worse, each
landmark helper carries a hand-maintained "kept in sync with the water block in `*TileAt`" comment: the
sync is a *comment*, not a mechanism, and it has been one drift away from a thirsty dino walking to dry
grass since 445. **449 turns a zone's ground into data** — one terrain descriptor per zone hanging off the
existing `ZONES` table, its tile-kind rule plus its named landmarks — and lets the dispatchers read it
generically instead of branching on zone id.

This is deliberately the *unglamorous* pick of the two remaining M6 structure arcs, and it goes first on
purpose: 450 (scarcity moves the herd) reads zone health, not zone ground, so it is unblocked either way,
while every future terrain-reading feature pays the branch tax until this lands. Foundation that unblocks
emergence beats another isolated beat (routine 1.5 bias).

**Constraints for the Designer (hold the chain to these):**

1. **Behavior must be byte-identical.** This is a refactor, not a redesign — 383's own handoff set the bar
   ("behavior is byte-identical while only this one pair exists") and it's the right bar here. Every
   existing tile the three zones report must report the same kind afterward. No new terrain, no retuned
   blocks, no moved ponds. The e2e/vitest suites are the proof.
2. **The landmark must derive from the rule, not sit beside it.** The single largest win available here is
   killing the "kept in sync with" comments: a zone's named water tile should be *findable from its own
   terrain descriptor* rather than separately hand-authored. If a descriptor declares its water region,
   the landmark falls out of it and can never drift. If the Code-planner finds that too invasive for one
   fire, the fallback is an explicit landmark field on the descriptor — still one place per zone instead
   of two — but the derived version is what the item is asking for.
3. **The acceptance test is a fourth zone.** Not shipped as a real zone — a *test-only* fourth descriptor
   proving that adding a row to the table gives it ground, water, and a landmark with zero edits to
   `zoneTileAt` / `zoneWaterTile` / `atWater` / the floor bake. If that test needs a code branch anywhere,
   the refactor isn't done.
4. Keep the `TileKind` union and the "unknown zone id → null → caller bakes plain grass" escape hatch. That
   null path is what has kept the floor whole through three terrain additions.

**Collision check vs. the lore track:** clean. 453 (word of the provider) lives in dialogue/gossip, the role
tags, and the collection book; 449 lives in `game/src/world/zones.ts` and the floor bake in `WorldScene`.
No shared file beyond `WorldScene`'s import line.

**Added to Structure Track:** none — drained from queue (4 open: 449, 450, 454, 455 ≥ X=4).

**Chosen this cycle:** **BACKLOG-449** — one terrain per zone, as data (per-zone terrain descriptor on the
`ZONES` table; `zoneTileAt` / `zoneWaterTile` / landmark lookups read it generically).
