# Cycle 95 — Code Plan

## Lore track — BACKLOG-340 (homesick)

### New file: `game/src/world/homesick.ts` (pure)
- `export const HOMESICK_ROLLS = 2`
- `export function homesickDest(name, myZone, bonds, others, zoneOf: (n)=>string, rolls): { dest: string; friend: string } | null`
  - `rolls < HOMESICK_ROLLS` → null
  - `friend = closestFriend(name, bonds, others, GRIEF_BOND_FLOOR)`; null → null
  - `edge = griefEdge(myZone, zoneOf(friend))`; null (same zone / off-chain) → null
  - `dest = neighborThrough(myZone, edge)`; null → null; else `{ dest, friend }`
- `export function homesickMemory(friend): string` → `you miss ${friend} — the zone feels lonely without them, so you drift back to find them`
- imports: `closestFriend, type Bonds` from `../social/bonds`; `GRIEF_BOND_FLOOR, griefEdge` from `./tic`; `neighborThrough` from `./zones`.

### `game/src/scenes/WorldScene.ts`
- import `homesickDest, homesickMemory` from `../world/homesick`.
- `private homesickOf(d: Dino)`: `homesickDest(d.name, zoneOf(this.dinoZones,d.name,BOWL_ID), this.bonds, this.dinoNames(), (n)=>zoneOf(this.dinoZones,n,BOWL_ID), tenureOf(this.tenure,d.name))`.
- `private tryHomesick(d: Dino): boolean`: `const h = this.homesickOf(d); if(!h) return false; this.startMigration(d, h.dest); this.memory = remember(this.memory, d.name, homesickMemory(h.friend)); this.logEvent(\`🧭 ${d.name} misses ${h.friend} — drifts back toward ${zoneById(h.dest).name}\`); return true;`
- `maybeMigrate` (line ~3597): after `const d = this.pickMigrant(); if(!d) return;` insert `if (this.tryHomesick(d)) { this.lastMigrationMs = Date.now(); return; }` BEFORE the settle-resist gate (so homesick overrides resist). Leave the rest (settle-resist + random dest) unchanged.
- `pickMigrant` (line ~3616): after building `candidates`, prepend `const homesick = candidates.filter((d)=>this.homesickOf(d)); if (homesick.length) return homesick[Math.floor(Math.random()*homesick.length)];` then existing grove-pull tiers.
- dev hook (near `__maybeMigrate`, ~3572): `(window as any).__homesickMigrate = (name: string) => { const d = this.dinos.find((x)=>x.name===name); return d && this.tryHomesick(d) ? this.migrationCross[name]?.dest ?? null : null; };`

### Unit test: `tests/unit/cycle-095-homesick.test.ts`
- `homesickDest`: friend elsewhere + rolls≥2 → `{dest,friend}`, dest = step toward friend; same-zone friend → null; sub-floor bond → null; rolls<2 → null; 2-zones-away friend → intermediate neighbour; pure (bonds untouched). Set up a small `zoneOf` map + `Bonds`.
- `homesickMemory`: names the friend.

### E2E: `tests/e2e/cycle-095-homesick.spec.ts`
- boot; two dinos A,B; `__bondPair(A,B,20)` (≥ floor 8); `__migrate(A,'grove')` (A now grove, B bowl, tenure reset 0); `__settleTick()` ×2 (A tenure 2); `__homesickMigrate(A.name)` → expect dest `'bowl'`; A now migrating; drive `__stepWorld`/forceStep until A crosses (or assert `__migrating` contains A + memory). Assert homesick memory via `__memory`/book if exposed; assert zero console errors.
- settled-override case: `__settleTick` ×5 (A settled), `__homesickMigrate` still returns `'bowl'`.

## Structure track — BACKLOG-418 (per-zone crops)

### `game/src/world/plot.ts`
- keep `CROP_FOOD_ID = 'berries'` (bowl default; cycle-066 green).
- add `import { FOODS } from './foods'` (for a test-side invariant only if needed — actually the invariant is tested in the test file; plot.ts need not import FOODS). Skip the import; keep plot.ts dependency-free.
- `export interface ZoneCrop { food: string; ripe: string }`
- `export const CROP_BY_ZONE: Record<string, ZoneCrop> = { [BOWL_ID]: { food: 'berries', ripe: '🍓' }, [GROVE_ID]: { food: 'greens', ripe: '🥬' } }`
- `export function cropOf(zone: string): ZoneCrop { return CROP_BY_ZONE[zone] ?? CROP_BY_ZONE[BOWL_ID] }`
- `export function stageGlyph(zone: string, stage: CropStage | 'empty'): string { return stage === 'ripe' ? cropOf(zone).ripe : STAGE_GLYPH[stage] }`

### `game/src/scenes/WorldScene.ts`
- import `cropOf, stageGlyph` from `../world/plot`.
- `drawPlotSprite` (~955): `const wantsProp = stage !== 'empty' && (stage !== 'ripe' || cropOf(zone).food === 'berries'); const tex = wantsProp ? bakePropArt(this, \`crop_${stage}\`) : null;` and the text fallback uses `stageGlyph(zone, stage)`.
- `harvest` (~994): `this.dropFood(PLOT_TILE_BY_ZONE[zone].tileX, cropOf(zone).food);` and log `\`${cropOf(zone).ripe} you harvested the crop\``.
- `refreshPlot` ripen note (~1011): `\`${cropOf(z).ripe} the crop ripened — press P beside the plot to harvest\``.
- `handlePlot` growing-note branch (line ~973, the `else` that notes a growing plot): if it references 🍓, use `cropOf(z).ripe`. (Verify the exact string during coding.)

### Unit test: `tests/unit/cycle-095-crops.test.ts`
- `cropOf`: bowl→berries/🍓, grove→greens/🥬, unknown/fernreach→bowl fallback.
- `stageGlyph`: seed/sprout/empty = STAGE_GLYPH; ripe = zone crop ripe; grove ripe (🥬) ≠ STAGE_GLYPH.sprout (🌿) ≠ greens food emoji collision guard.
- invariant: every `CROP_BY_ZONE[*].food` is a real `FOODS` id.

### E2E: `tests/e2e/cycle-095-crops.spec.ts`
- boot; `__setZone('grove')`; plant + ripen the grove plot (reuse the plot test pattern: `__plantPlot('grove')`, advance clock to ripe — check how cycle-079/plot e2e ripens, likely a clock-advance hook `__advanceWall`/`__setDay`); `__plotArt('grove')`/`__plot('grove')` reads stage 'ripe'; assert the grove ripe marker is 🥬 (via the sprite text or a glyph hook); `__harvestPlot('grove')` drops greens — assert the dropped food is greens (a `__droppedFood`/feed hook if present, else assert harvested tally bumped and no error). Bowl plot unchanged (🍓). Zero console errors.
- (During coding, confirm the exact ripen mechanism + which read hooks exist — `__plot`, `__plotArt`, `__harvestPlot`, `__harvested` are present; find the clock-advance hook used by the existing plot specs.)

## No collision
homesick.ts + plot.ts are new/disjoint; the WorldScene edits touch migration methods vs plot
methods — no shared lines. Both tracks: `npm run build` + `npx vitest run` before commit; e2e is QA's gate.

---

## SHIPPED (coder)

- **340:** new `game/src/world/homesick.ts` (`homesickDest`/`homesickMemory`/`HOMESICK_ROLLS`, reusing `closestFriend`+`GRIEF_BOND_FLOOR`+`griefEdge`+`neighborThrough`). `WorldScene`: `homesickOf`/`tryHomesick`, `pickMigrant` homesick-preferred, `maybeMigrate` homesick-before-settle-resist, `__homesickMigrate` hook.
- **418:** `plot.ts` `CROP_BY_ZONE`/`cropOf`/`stageGlyph`/`ZoneCrop` (bowl berries/🍓, grove greens/🥬). `WorldScene`: `drawPlotSprite` bakes the bush only for berry-ripe, `harvest` drops `cropOf(zone).food`, ripen/harvest logs read the crop marker, `__plotGlyph` hook. Kept `CROP_FOOD_ID` (bowl default) so cycle-066 stays green.
- Build clean. 1042/1042 unit (+13: 7 homesick + 6 crops). No save version bump (grove plot already persisted; its harvest just yields greens now). web-llm boundary untouched. E2E is QA's gate.
