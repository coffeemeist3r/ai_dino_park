# Cycle 71 — Code Plan

## Lore track — BACKLOG-318 (Mood lifts the motion)

**Files to create:**
- `tests/unit/cycle-071-relief-flourish.test.ts`
- `tests/e2e/cycle-071-mood-lift.spec.ts`

**Files to modify:**
- `game/src/world/fidget.ts` — add `export function reliefFlourish(p: Personality): string`
  returning `${fidget(p).glyph}✨` (signature motion, brightened).
- `game/src/scenes/WorldScene.ts` —
  1. import `reliefFlourish` (extend the fidget import).
  2. add `private lastMoodLift: string | null = null;` and a helper
     `private liftMood(d: Dino)` → `this.lastMoodLift = reliefFlourish(d.traits); this.flashFeed(d, this.lastMoodLift);`
  3. call `liftMood(dino)` at the three recovery points: the `repairing` branch in
     `recordGreet` (~2908) and `recordTone` (~2881), and in `clearColdFunk` when
     `withBeat` (~2922).
  4. hooks (beside `__moodFidget`): `__lastMoodLift = () => this.lastMoodLift;` and
     `__moodLift = (name) => { const d = this.dinoByName(name); return d ? reliefFlourish(d.traits) : null; };`

**Reuse list:** `fidget()` (fidget.ts) for the base glyph; `flashFeed` (WorldScene:787)
for the transient flash; the existing `pendingRepair`/`clearColdFunk` recovery seams.

**New dependencies:** none.

**Test plan:**
- Unit: `reliefFlourish(p)` starts with `fidget(p).glyph`, ends with `✨`, deterministic.
- E2E (`cycle-071-mood-lift.spec.ts`): boot; `__moodLift(name)` equals the dino's
  `reliefFlourish` (glyph + ✨) through the real build; zero console errors.

**Risks:** the flourish is a second flash beside the existing repair/warm bubble —
must not replace it. Live-fire (sulk repaired) is hard to stage headless; covered by
the pure unit + the passthrough hook (the wiring is a one-line `flashFeed` reuse).

**Estimated touch count:** ~4 files.

---

## Structure track — BACKLOG-314 (Zone-aware resource spawn)

**Files to create:**
- `tests/unit/cycle-071-occupied-zones.test.ts`
- `tests/e2e/cycle-071-zone-spawn.spec.ts`

**Files to modify:**
- `game/src/world/zones.ts` — add pure
  `export function occupiedZones(map, fallback, names): string[]` (unique `zoneOf`
  over the names) — the resident-zone set the spawn loop rolls for.
- `game/src/scenes/WorldScene.ts` — replace the single resource fields with per-zone maps:
  - fields (241-244): `resourceByZone: Record<string, Resource> = {}`,
    `resourceSpriteByZone: Record<string, Text|Image> = {}`,
    `resourceAgeByZone: Record<string, number> = {}` (drop `resource`/`resourceSprite`/`resourceAge`).
  - `residentZones()` → `occupiedZones(this.dinoZones, BOWL_ID, this.dinos.map(d=>d.name))`.
  - `maybeSpawnResource` (800): loop `residentZones()`; for each empty slot that rolls,
    spawn into that zone + age 0; log only when `zone === this.zoneId`.
  - `spawnResource` (811): take a `zone = this.zoneId` arg; store into the per-zone
    maps; `sprite.setVisible(zone === this.zoneId)`.
  - `checkGather` (824): act on `this.resourceByZone[this.zoneId]` (+ that zone's age);
    drop the now-implicit `resource.zone !== zoneId` guard; clear that zone's slot+sprite.
  - age (1601): increment every present zone's age.
  - fetch branch (1643-1660): each dino fetches its **own home-zone** resource
    (`this.resourceByZone[zoneOf(dinoZones,d.name,BOWL_ID)]`).
  - `applyObjectVisibility` (2571): loop sprites, `setVisible(z === this.zoneId)`.
  - hooks: `__resource` → active zone's else any present; `__objVisible.resource` +
    `__resourceIsArt` → active zone's sprite; `__spawnResource(kind,x,y,fresh?,zone=active)`.

**Reuse list:** `zoneOf`/`BOWL_ID` (zones.ts), `rollResource`/`resourceLanding`/
`pickKind`/`bakePropArt`/`resourceFetchable` (unchanged), `flashFeed`/`logEvent`.

**New dependencies:** none.

**Test plan:**
- Unit (`cycle-071-occupied-zones.test.ts`): all-default names → `[bowl]`; a migrated
  name adds its zone; dedupes.
- E2E (`cycle-071-zone-spawn.spec.ts`): boot; spawn a bowl resource, cross to grove,
  spawn a grove resource → both coexist (`__resource()` follows the active zone),
  only the active sprite is visible, crossing swaps which shows; a grove resource
  forced while the keeper's in the bowl is hidden until you cross. Zero console errors.

**Risks:** `__resource()`/`__spawnResource()` MUST stay backward-compatible
(active-preferred-else-any; default zone = active) or cycle-062/064/065/066/069 break.
The stockpile cap (309) + craft (286) path in `checkGather` is shared — keep it intact.

**Estimated touch count:** ~4 files (zones.ts + WorldScene.ts + 2 tests).

---

## Cross-track collision

Disjoint within `WorldScene.ts` (318 → fidget import + recovery methods + flourish
hooks; 314 → resource fields/methods + resource hooks). Different pure modules
(`fidget.ts` vs `zones.ts`). Build either order.
