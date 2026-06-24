# Cycle 74 — Code Plan

Build order: **315 first**, then **339**. Shared touch points: `saveGame.ts` (two independent
additive fields), `saveGame.test.ts` sample (two `[]` additions). Everything else disjoint.

## Reuse audit (no new primitives)

- Cairn path is the exact template for the shelter: `canCraft`/`craft`/`CRAFT_RECIPE`/`CAIRN_GLYPH`
  (`resource.ts`), `drawCairn`/`placeCairn`/`cairns`/`cairnSprites` + the `checkGather` craft tail +
  `applyObjectVisibility` cairn line + restore loop (`WorldScene.ts`). Mirror each symbol-for-symbol.
- `zoneOf(this.dinoZones, name, BOWL_ID)` already gives a crafter's/migrant's home zone (308/274).
- `remember`/`recall`/`showBubble`/`flashFeed`/`logEvent`/`inView` already imported in WorldScene.
- `firstGroveArrival` reuses `GROVE_ID` from `zones.ts`; `crossDino` already computes `dest`.
- Additive-save validation copies the `cairns` block (array of `{tileX,tileY,zone?}`) and the
  `dinoZones`→string and `roles` patterns; `groveVisited` copies the simplest (string array).

## Structure track — 315

**`game/src/world/resource.ts`** (append after the cairn block, ~line 118):
- `export const SHELTER_RECIPE: Partial<Record<ResourceKind, number>> = { branch: 6, stone: 4 };`
- `export const SHELTER_GLYPH = '🛖';`
- `export const SHELTER_AFTER_CAIRNS = 3;`
- `canBuildShelter(pile)` / `buildShelter(pile)` — copies of `canCraft`/`craft` over `SHELTER_RECIPE`.

**`game/src/scenes/WorldScene.ts`:**
- State (~line 273): `private shelters: { tileX; tileY; zone: string }[] = [];`,
  `private shelterSprites: (Text|Image)[] = [];`.
- Imports: add `SHELTER_GLYPH, SHELTER_AFTER_CAIRNS, canBuildShelter, buildShelter` to the resource import.
- `checkGather` (~line 899, replace the cairn craft tail): after `flashFeed`/`logEvent` pickup lines,
  ```
  const zone = zoneOf(this.dinoZones, taker.name, BOWL_ID);
  const zoneCairns = this.cairns.filter((c) => c.zone === zone).length;
  const hasShelter = this.shelters.some((s) => s.zone === zone);
  if (zoneCairns >= SHELTER_AFTER_CAIRNS && !hasShelter) {
    const spent = buildShelter(this.stockpile);
    if (spent) { this.stockpile = spent; this.placeShelter(this.tileOf(taker), taker); this.refreshPlaque(); }
    // saving for the shelter — no cairn this tick even if affordable
  } else {
    const spent = craft(this.stockpile);
    if (spent) { this.stockpile = spent; this.placeCairn(this.tileOf(taker), taker); this.refreshPlaque(); }
  }
  ```
- `drawShelter(s)` / `placeShelter(tile, crafter)` — copies of `drawCairn`/`placeCairn`, glyph-only
  (no `bakePropArt('shelter')` until 344), memory `'raised a lean-to from gathered branches and stones'`,
  log `🛖 <name> raised a lean-to`.
- `applyObjectVisibility` (~line 2690): add
  `this.shelterSprites.forEach((s,i) => s.setVisible(this.shelters[i]?.zone === this.zoneId));`.
- Restore (~line 3349, beside cairns): `this.shelters = (save.shelters ?? []).map((s)=>({...s, zone: s.zone ?? BOWL_ID})); for (const s of this.shelters) this.drawShelter(s);`.
- `currentSaveData` (~line 3297): add `shelters: this.shelters,`.
- Hooks (~line 623): `(window as any).__shelters = () => this.shelters.map((s)=>({...s}));`; extend
  `__objVisible` with `shelters: this.shelterSprites.map((s)=>s.visible)`.

**`game/src/world/saveGame.ts`:**
- `SaveData`: `shelters?: { tileX: number; tileY: number; zone?: string }[];` (beside `cairns`).
- deserialize: copy the cairns validation block into a `shelters` block (default `[]`); add `shelters`
  to the return object.

## Lore track — 339

**`game/src/world/arrival.ts`** (new):
- `import { GROVE_ID } from './zones';`
- `firstGroveArrival(visited: readonly string[], name: string, destZone: string): boolean`
- `groveArrivalMemory(): string` → `'🌿 first time across — the grove'`
- `groveArrivalLine(): string` → `'🌿 …somewhere new…'`

**`game/src/scenes/WorldScene.ts`:**
- State: `private groveVisited: string[] = [];`, `private arriving = new Set<string>();`.
- Import the three from `../world/arrival`.
- `forceStep` (right after the `migrating` branch, ~line 1721): 
  ```
  if (this.arriving.has(d.name)) { this.arriving.delete(d.name); this.activityById[d.name] = 'wandering'; continue; }
  ```
- `crossDino` (~line 2744, after `setZone` + reposition, before/around the existing logEvent):
  ```
  if (firstGroveArrival(this.groveVisited, d.name, dest)) {
    this.groveVisited.push(d.name);
    this.memory = remember(this.memory, d.name, groveArrivalMemory());
    this.showBubble(d, groveArrivalLine());
    this.arriving.add(d.name);
  }
  ```
- `currentSaveData`: add `groveVisited: this.groveVisited,`.
- Restore: `this.groveVisited = save.groveVisited ?? [];`.
- Hooks: `__groveVisited()` → `[...this.groveVisited]`; `__arriving()` → `[...this.arriving]`.

**`game/src/world/saveGame.ts`:**
- `SaveData`: `groveVisited?: string[];`.
- deserialize: validate a string array (copy `dinoZones` value-type discipline; default `[]`); add to
  return object.

## Test plan

**Unit — `tests/unit/cycle-074-shelter.test.ts`:** `canBuildShelter` true at/above {6,4}, false below;
`buildShelter` spends exactly + returns null when short + does not mutate input; `SHELTER_RECIPE` is
richer than `CRAFT_RECIPE`; `SHELTER_AFTER_CAIRNS === 3`.

**Unit — `tests/unit/cycle-074-arrival.test.ts`:** `firstGroveArrival` truth table (unvisited→grove
true; visited→grove false; any→bowl false); `groveArrivalMemory` distinct & non-empty; `murmurLine`
strips its leading glyph cleanly (cross-check the memory reads as a fragment, not a log line).

**Unit — `saveGame.test.ts`:** sample gains `shelters: []` + `groveVisited: []`; add round-trip +
absent-defaults + malformed-reject cases for both (copy the cairns/dinoZones cases).

**E2E — `tests/e2e/cycle-074-shelter.spec.ts`:** bank 3 cairns in the bowl (the existing `bankOne`
helper), then keep banking; assert no 4th cairn appears while saving, then exactly one shelter once the
pile clears {6,4}; assert `__shelters().length===1`, the pile reduced by the recipe, the shelter in the
exported save, `version===2`, zero console errors.

**E2E — `tests/e2e/cycle-074-arrival.spec.ts`:** put a dino in the bowl, `__startMigration`, step until
`__migrating` empties; assert `__groveVisited` includes it and its memory has the arrival line; assert
`__arriving` held it the step it crossed; cross back (no new memory) and re-cross (no duplicate) → once
ever. Reuse `boot` + `__stepWorld`.

## Blocker section
(none yet)
