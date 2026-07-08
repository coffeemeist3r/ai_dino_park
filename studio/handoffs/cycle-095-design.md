# Cycle 95 — Design

## Lore track — BACKLOG-340: Homesick for a friend

### Feel
A dino settles into a zone (341) and stops drifting. But if the one dino it's closest to lives
a zone away, that peace curdles into homesickness: after residing a while, it gets up and crosses
back to be near its friend. Company overrules scenery — a settled-but-lonely dino *leaves* its
home to rejoin its bond. Two mutual friends split by the ambient wander quietly reunite. The
action-mirror of the 414 grief tic: same `closestFriend` (013) read, same `griefEdge` chain
direction, now driving migration instead of a still ritual.

### Mechanic (pure — `game/src/world/homesick.ts`)
- Reuse `closestFriend(name, bonds, others, GRIEF_BOND_FLOOR)` — the same 013 pick + floor (8)
  the grief tic uses, so a dino only aches for a *real* friend, and 414/340 read the same friend.
- A dino is **homesick** when: it has resided in its current zone at least `HOMESICK_ROLLS`
  migration rolls (it's had time to feel the absence), AND its closest friend lives in a
  *different* zone. `HOMESICK_ROLLS = 2` (< SETTLE_ROLLS = 4): the ache can bite before a dino
  even fully settles, and certainly overrides settling once it has.
- **Direction:** step one zone toward the friend along the west→east chain via `griefEdge`
  (already chain-aware) → `neighborThrough`. A friend two zones away is reached in two homesick
  hops (bowl→grove→fernreach), one per roll — no teleport.
- `homesickDest(name, myZone, bonds, others, zoneOf, rolls)` returns `{ dest, friend } | null`.
- `homesickMemory(friend)` — the one-time memory it files, naming the friend, so the ache is
  legible in later talk (mirrors `griefTicMemory`).

### Wiring (`WorldScene.ts`, thin glue)
- `homesickOf(d)`: gathers the scene args and calls `homesickDest`.
- `tryHomesick(d): boolean`: if homesick → `startMigration(d, dest)` toward the friend, file
  `homesickMemory`, log `🧭 <name> misses <friend> — drifts back toward <destZone>`, return true.
  Shared by `maybeMigrate` and the dev hook (production/hook DRY).
- `maybeMigrate`: after `pickMigrant`, call `tryHomesick(d)`; if it fires, the homesick branch is
  done (it already started the crossing) — **skip the settle-resist gate** (company overrides
  341's `resistsMigration`). Otherwise the existing ambient path (settle-resist + random neighbour).
- `pickMigrant`: prefer homesick candidates above the grove-pull tiers — a dino aching for a
  friend is the first the wander picks up. No homesick dino → existing grove-pull/uniform behavior
  byte-identical.
- Dev hook `__homesickMigrate(name)` → runs `tryHomesick` deterministically, returns dest|null.

### Acceptance criteria (lore)
1. `homesickDest` returns `{dest,friend}` when the closest friend (≥ floor 8) is in another zone
   and `rolls ≥ HOMESICK_ROLLS`; the `dest` is the neighbour one step toward the friend on the chain.
2. Returns `null` when: friend shares the zone; no friend clears the floor; or `rolls < HOMESICK_ROLLS`.
3. A friend two zones away yields the *intermediate* neighbour (bowl dino, fernreach friend → grove).
4. In-world: a dino in the grove whose closest friend is a bowl dino, once its tenure ≥ 2, is picked
   and starts a crossing back toward the bowl (dev hook), files the homesick memory, logs the beat.
5. The homesick pull overrides the settle-resist: a *settled* (tenure ≥ 4) friendless-zone dino
   still leaves toward its friend.
6. No-homesick worlds are unchanged: with every dino's closest friend in its own zone (or no bonds),
   `pickMigrant` + `maybeMigrate` behave exactly as before (ambient random migration).

### Reuse / no new deps
`closestFriend`+`GRIEF_BOND_FLOOR` (social/bonds, world/tic), `griefEdge` (world/tic),
`neighborThrough`/`zoneOf` (world/zones), `bumpTenure`/`tenureOf` (world/belonging), `remember`
(ai/memory), `startMigration` (WorldScene). No WebLLM, no NPCBrain breach, no save change (tenure
+ bonds + zones already persist).

---

## Structure track — BACKLOG-418: Per-zone crop identity

### Feel
The plot grows the same 🍓 in every zone. Give each zone its own crop so farming reads as separate
places, the way three skylines (417) and diverging piles (348) already do. Bowl = berries
(unchanged), grove = leafy greens with a 🥬 ripe marker.

### Mechanic (pure — `game/src/world/plot.ts`)
- Keep `CROP_FOOD_ID = 'berries'` exported (the bowl default; cycle-066 test still green).
- Add a per-zone crop map:
  - `CROP_BY_ZONE: Record<string, { food: string; ripe: string }>` — `bowl → {berries,🍓}`,
    `grove → {greens,🥬}`. A zone absent → the bowl default (`cropOf`).
  - `cropOf(zone) → { food, ripe }` (fallback bowl).
  - `stageGlyph(zone, stage)` → the ripe stage returns `cropOf(zone).ripe`; seed/sprout/empty
    return the shared `STAGE_GLYPH[stage]`. So the marker diverges only at ripeness.
- `🥬` chosen for grove-ripe so it is distinct from the 🌿 *sprout* glyph AND the greens food's own
  🌿 emoji — the plot never reads ambiguously.

### Wiring (`WorldScene.ts`)
- `drawPlotSprite(zone, stage)`: bake the pixel prop for seed/sprout always (shared soil mound), and
  for ripe **only when `cropOf(zone).food === 'berries'`** (the berry-bush rig 317 is berry-specific);
  otherwise the glyph via `stageGlyph(zone, stage)`. Bowl ripe → bush prop (unchanged); grove ripe →
  🥬 glyph until an [art] fire draws a greens rig.
- `harvest(zone)`: drop `cropOf(zone).food` (not the constant), log with `cropOf(zone).ripe`.
- `refreshPlot` ripen note + `handlePlot` growing note: use `cropOf(z).ripe` in the message.
- Plot maps (`plotByZone`, `plotStageShownByZone`): unchanged (still bowl+grove); no Fernreach plot.
- The plot dirty-check `if (this.plotByZone[BOWL_ID] || this.plotByZone[GROVE_ID])` unchanged.

### Save
No schema change. Grove plot already persists (`grovePlot`); its harvest just yields greens now.
Additive-safe — an old save with a mid-grow grove plot ripens into greens, breaking nothing.

### Acceptance criteria (structure)
1. `cropOf('bowl')` = `{food:'berries', ripe:'🍓'}`; `cropOf('grove')` = `{food:'greens', ripe:'🥬'}`;
   `cropOf('fernreach')` (no entry) falls back to the bowl berry.
2. `stageGlyph(zone,'seed'|'sprout'|'empty')` = the shared `STAGE_GLYPH`; `stageGlyph(zone,'ripe')`
   = that zone's crop ripe marker. Grove ripe (🥬) ≠ sprout (🌿).
3. Every `CROP_BY_ZONE` food id is a real FOODS entry (harvests into the feeding loop).
4. In-world: planting + ripening + harvesting the **grove** plot drops `greens` (not berries) into
   the feeding loop; the ripe grove marker reads 🥬.
5. The **bowl** plot is byte-identical: berries food, 🍓 ripe marker, berry-bush pixel prop.
6. Build clean, save round-trips (grove plot restores and harvests greens), no version bump.

### Reuse / no new deps
`FOODS` (world/foods) for the crop-is-a-real-food invariant, `STAGE_GLYPH`/`cropStage`/
`PLOT_TILE_BY_ZONE` (world/plot), `bakePropArt('crop_ripe')` (art) for the bowl bush. No WebLLM,
no NPCBrain, no save version bump.

## No cross-track collision
Lore touches migration (`maybeMigrate`/`pickMigrant`/new `homesick.ts`); structure touches the
plot (`plot.ts`/`drawPlotSprite`/`harvest`). Disjoint files and disjoint WorldScene methods.
