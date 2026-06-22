# Cycle 71 — Structure Handoff

**Intent:** Give the grove its own gathering. Resources live in a single global slot
that only ever rolls in the keeper's zone (308 stamps the zone, but there's one slot
and the spawn follows the keeper), so the now-inhabited grove (274) never accrues
anything while you're in the bowl. 314 makes the resource **per zone**: each zone
holds its own slot and rolls on its own cadence, so the grove grows resources even
while you're away and they're waiting (already gatherable, grace elapsed) when you
cross over. The spine for a real two-zone economy.

**Cap rule:** 3 open in the Structure Track (314 / 315 / 316) < X=4 → brainstorm.
Added two foundation follow-ups (per-zone stockpile, carry-between-zones), then
picked the top unblocked item.

**Added to Structure Track:**
- BACKLOG-328 [emergent] Per-zone stockpile — split the shared pile (285/309) per zone.
- BACKLOG-329 [core] Carry between zones — a dino ferries one banked resource across a crossing.

**Chosen this cycle:** BACKLOG-314 — zone-aware resource spawn (per-zone resource
slots + per-zone roll). Top unblocked (146/274/308 all shipped). Touches
`world/resource.ts` (a resident-zones helper) + `WorldScene` (the single
`resource`/`resourceAge`/`resourceSprite` fields become per-zone maps; spawn loops
resident zones; gather/fetch read the active zone's slot). No collision with the
lore pick (318 is a flourish at the repair/thaw sites — `fidget.ts` + the greet/cold
recovery methods, nowhere near the resource path).
