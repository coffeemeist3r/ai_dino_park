# Cycle 5 — Design

## Item
BACKLOG-017 [core] Spawn 5 NPCs with distinct species + names + personalities.

## Why this cycle
The park has one dino. Personalities are now free (seeded from name, cycle 4), so populating is cheap: a roster of five names/species/positions, and each gets its own self automatically. This turns the world from a Rex monologue into a neighborhood — the substrate NPC-to-NPC chat, gossip, and huddles will need.

## What ships
A fixed roster of 5 dinos, each with a distinct name, species, spawn tile, and a cheap distinguishing color. On boot all five appear, spread across the 20×15 map, each with its name label. Rex stays (same species, same spawn area) so existing save/personality behavior is unchanged. Walking up to any dino and pressing Z greets the *nearest* one — so different dinos are reachable from different spots. No movement, no NPC-to-NPC interaction this cycle.

Dev hooks (mirror `__clockNow`): `window.__dinoCount()` → 5; `window.__dinoNames()` → the five names.

## Acceptance criteria
- [ ] The roster has exactly 5 entries with 5 distinct names and 5 distinct species (unit).
- [ ] All 5 spawn tiles are distinct and inside the map bounds (0 ≤ col < 20, 0 ≤ row < 15), and none is the player's start tile (3,3) (unit).
- [ ] `seededPersonality` over the 5 names yields personalities that are not all identical — every pair differs on at least one axis (unit).
- [ ] Rex is in the roster (continuity) (unit).
- [ ] On boot, `window.__dinoCount()` returns 5 (e2e).
- [ ] `window.__dinoNames()` returns 5 unique names (e2e).
- [ ] Greeting the nearest dino still opens a reply (no regression to the Z-dialog flow) (e2e).
- [ ] Existing save / day-night / personality / clock behavior unchanged — `__dinoTraits()` (dinos[0]) is still Rex's traits (e2e + the cycle-3/4 suites stay green).
- [ ] `npm run build` clean; vitest + playwright green.

## Out of scope
- NPC movement / wandering.
- NPC-to-NPC interaction or dialog (BACKLOG-018).
- Real sprite art — color rectangles only; sprites are the Artist's items (033–036).
- Persisting the roster in the save (it's static config, re-created each boot; dino positions don't change yet).
- More than 5, or procedurally generated dinos.

## Constraints
- Reuse the existing `Dino` class and its name-seeded `traits` (cycle 4) — do not re-implement personality. The roster supplies only name/species/position/color.
- Keep Rex as an anchor entry so the cycle-3 save tests and cycle-4 `__dinoTraits` (dinos[0]) keep passing — Rex must remain `dinos[0]`.
- The roster should live in a pure, Node-testable module (no Phaser), like the other `world`/`ai` data modules.
- No new npm dependencies. TypeScript strict; `any` only via the documented dev-hook pattern.
- Don't break the `nearestDino` greet flow or the day/night overlay depth ordering.
