# Cycle 86 — Structure Handoff

**Intent:** Make the third zone a *place*. Cycle 85 (378) opened **The Fernreach** east of the grove, but
it ships as plain bowl-grass under a warm tint — the spine only. This cycle gives it its own ground the
way 294 gave the grove a path band + NE pond: a `fernreachTileAt` layout defining the Fernreach's own
sub-regions, with the floor render generalized from the hard-coded `groveTileAt` call to a per-zone
`tileAt` dispatch so any zone in the chain paints its own terrain. This is the highest-leverage
structural pick on the board: it's the direct "make 378 real" follow-up, it mirrors a proven path
(294 → unblocked the grove's path/water art 033), and it **ends the Artist's long no-op streak** — the
Fernreach's sub-region rigs become the first renderable terrain art in many cycles (the stash-ahead
Idea-Box concern resolves: the terrain that was blocked now exists for the rigs to paint).

**Identity, reuse-first:** the Fernreach reads distinct from the grove via three levers, cheapest first —
its warm `FERNREACH_TINT` (already shipped), a *different* layout of the existing `TileKind`s (water
placed differently than the grove's NE pond, a path running a different axis), and — for genuine "different
biome" identity and to give the Artist a fresh rig to draw — optionally **one new `TileKind`** (a fern /
scrub region) that bakes as grass-under-tint until the rig lands, exactly how 294 let undrawn path/water
fall back to grass. The Designer settles whether the new kind earns its keep this cycle or the layout
alone suffices; either way the floor is always whole and no art dependency can break the build.

**Added to Structure Track:** none — drained from queue (5 open ≥ X=4: 358 / 384 / 398 / 399 / 400).

**Chosen this cycle:** BACKLOG-399 — third-zone terrain identity (`fernreachTileAt` + per-zone floor
dispatch; the Fernreach gets its own ground sub-regions, undrawn kinds fall back to grass-under-tint).

**Why not the others (runners-up, queued):** 398 (edge indicator) is the operator's handed nudge and a
strong next pick — but it's pure legibility with no downstream unblock, where 399 is the spine the
Fernreach art + a real sense of place both wait on. 358 (edge-meet barter) and 400 (third-zone resource
bias) both want the Fernreach to first be a defined, inhabited place. 384 (resource regrowth) is
independent and can slot any cycle.

**File note for the Coder:** 399 lives in `world/zones.ts` (+ `WorldScene` floor-render glue —
`bakeTerrainMap` / `drawFloor`); the lore track (394) lives in `world/feeding.ts` (`checkFeeding`). The
only shared file is `WorldScene.ts`, in *different* methods (floor render vs. `checkFeeding`) — sequence
them independently, no collision expected.
