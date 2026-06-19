# Cycle 59 — Structure Handoff

**Intent:** Start the bigger-world spine. The bowl has been a single 20×15 enclosure for 58 cycles,
and the path/water art (BACKLOG-033) has sat benched for cycles with "nowhere to render on the
all-grass bowl." A connected zone is the unblock for both the map arc *and* that art. This is the
highest-leverage structural item in the queue, so the Structure-smith pulls it first.

**Cap rule:** 5 open items in the Structure Track ≥ X=4 → **no new structural items brainstormed this
cycle** (drain mode). Picked from the existing queue.

**Added to Structure Track:** none — drained from queue (5 open ≥ X=4).

**Chosen this cycle:** **BACKLOG-143** — Connected zone (spine).

**Scope steer for the Designer (foundation-first, one fire):** ship the *walkable* spine —
- A pure `world/zones.ts` module: a two-zone registry (the existing **bowl** + one adjacent **grove**),
  edge-crossing detection (keeper pixel position → does it cross the designated bowl edge?), the entry
  position on the far side, and a small per-entity occupancy API (`zoneOf`/`setZone`) so "which zone is
  X in" is answerable and testable. Fully Node-unit-tested.
- Thin WorldScene glue: track the keeper's current zone, cross on walking off the designated edge
  (reposition keeper to the entry tile of the other zone), repaint the zone, show a zone name on the
  plaque/HUD, and a `window.__zone` dev hook. Persist the keeper's zone additively in the save.
- **Deliberately deferred to a follow-up (note it in BACKLOG):** *populating* the grove — migrating
  dinos / per-dino occupancy rendering across zones. The occupancy **API** ships and is tested this
  cycle (so "tracks which zone each dino is in" has its spine), but the grove starts **empty** of dinos
  this cycle to keep the WorldScene change low-risk. A connected, walkable, persisted second zone is the
  honest spine; filling it is the next structural beat. This split keeps 143 to one safe Coder fire.

This unblocks BACKLOG-033 (path/water tiles now have a second zone to render in) and the rest of the map arc.
