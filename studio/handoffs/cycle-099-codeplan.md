# Cycle 099 — Code plan

## Lore track — BACKLOG-367 (+435)

### New pure modules
- **`game/src/world/diet.ts`**
  - `type Diet='carnivore'|'herbivore'`, `type FoodKind='plant'|'meat'`.
  - `SPECIES_DIET` table (compsognathus→carnivore, the other 4 roster species→herbivore).
  - `dietOf(species, name?)`: lowercased table hit; else deterministic FNV-ish hash over `species+':'+name`
    → herbivore unless the hash lands in a small carnivore slice (bias herbivore, so bred/unknown mostly graze).
  - `isCarnivore`/`isHerbivore` wrap `dietOf`. `eats(diet, kind)` = `(diet==='carnivore') === (kind==='meat')`.
- **`game/src/world/foodweb.ts`**
  - `STALK_RANGE=6`.
  - `nearestPrey(hunter, prey[], range=STALK_RANGE)`: min-Chebyshev in range, ties by order, else null.
  - `fleeStep(from, hunter, cols, rows)`: dominant-axis step *away*; if that axis is wall-blocked, slide the
    other axis; clamp. Reuse `clamp` pattern from movement.ts (inline; movement's clamp isn't exported).
  - `huntCaught(hunter, prey)`: Chebyshev ≤ 1.

### Edits
- **`game/src/world/foods.ts`**: `Food` gains `kind: FoodKind` (import from diet.ts); tag all 5
  (meat/fish→meat, greens/berries/roots→plant).
- **`game/src/world/activity.ts`**: `Activity` union += `'stalking' | 'fleeing'`; `ACTIVITY_GLYPH` +=
  `stalking:'🎯', fleeing:'💨'`. (Set directly by the forceStep branches like inspecting/responding —
  NOT added to `ActivityFlags`/resolver, which only covers the non-preempt tail.)
- **`game/src/scenes/WorldScene.ts`**:
  - imports: `dietOf, isCarnivore` from diet; `nearestPrey, fleeStep, huntCaught, STALK_RANGE` from foodweb.
  - `private huntCooldownUntil: Record<string, number> = {}` + `HUNT_COOLDOWN_MS = 30_000`.
  - In `forceStep`, before the per-dino loop: build `stalkTargets`/`fleeFrom`. A carnivore d qualifies when
    `isCarnivore(d.species)`, `pressingNeed(this.needs[d.name])==='hunger'`, `Date.now() >=
    huntCooldownUntil[d.name]`, and `this.inView(d)`. Candidates = herbivores with `this.inView` &&
    `this.visibleZoneOf === d`'s zone (same on-screen zone — reuse how food-rush stays in-zone; dinos not
    in the current `zoneId` aren't drawn, so `inView` already gates that). `nearestPrey(tileOf(d),
    herbivores)` → target.
  - Insert the two branches in the ladder **immediately after** the food-rush `if (this.food ...)` block
    (line ~2469), before `const other = this.nearestOther(d)`:
    - hunter: `stepToward(cur, tileOf(prey))`; `activityById[d.name]='stalking'`; on `huntCaught` →
      `flashFeed(prey,'💨')`, `logEvent('🦖 the hunt came up empty — '+preyName+' slipped away')`,
      `huntCooldownUntil[d.name]=Date.now()+HUNT_COOLDOWN_MS`, `remember(memory, d.name, 'your hunt for '+preyName+' came up empty')`,
      `remember(memory, preyName, 'you slipped '+d.name+"'s hunt")`; `continue`.
    - prey (`fleeFrom[d.name]`): `fleeStep(cur, tileOf(hunter))`; `activityById[d.name]='fleeing'`; `continue`.
  - Guard: the stalk pass must run **after** sky/migration/inspection/response/food branches already
    `continue` for those dinos — put the branch at the stated position so those pre-empts still win, and a
    stalker/prey that is also migrating/inspecting/etc. keeps that higher priority.
  - Dev hooks: `__stalkTargets = () => ({...stalkTargets})` (store the last-built map on the instance:
    `private lastStalk: Record<string,string> = {}`, set each forceStep), `__diet = (sp:string) => dietOf(sp)`.

### Tests
- `game/test/diet.test.ts` (unit): AC 1–2 (species-correct diet, determinism, `eats`, food kinds).
- `game/test/foodweb.test.ts` (unit): AC 3 (`nearestPrey` range+ties+null, `fleeStep` moves away + wall
  slide + clamp, `huntCaught`).
- `game/tests/cycle-099-foodweb.spec.ts` (e2e): AC 4–6 — set Twitch hunger high via `__setNeed`, place a
  herbivore in view, assert `__stalkTargets()` maps Twitch→prey; step; assert Twitch closes / prey activity
  `fleeing`; drive to catch → roster length unchanged + hunt-empty event + Twitch drops off `__stalkTargets`
  (cooldown); well-fed Twitch stalks no one; a meat drop in range → Twitch feeds not stalks.

## Structure track — BACKLOG-433

### Edits
- **`game/src/ui/lenses.ts`**: `ZoneMapEntry.harvested: number`; `zoneMapModel(..., tiers={}, harvests:
  Record<string,number>={})` sets `harvested: harvests[id] ?? 0`.
- **`game/src/scenes/WorldScene.ts`**: `zoneMapEntries()` passes `this.harvestedByZone`; `drawZoneMap`
  badge line → `` `${prosperityBadge(e.tier)}  🌾${e.harvested}` ``.

### Tests
- `game/test/lenses.test.ts` (extend): AC 1 — `zoneMapModel` with/without `harvests`.
- `game/tests/cycle-099-harvest-lens.spec.ts` (e2e): AC 2–4 — harvest bowl plot (reuse the plot test
  helpers: plant via `__plant`/P, force ripe via clock hook, harvest), assert `__zoneMap()` bowl
  `harvested:1` / others `0`; harvest across a zone bumps only that zone; survives reload.

## Reuse / boundary
- `stepToward` (movement), `flashFeed`, `remember`, `pressingNeed`, `this.inView`, `harvestedByZone`,
  `prosperityBadge`, plot/clock e2e hooks — all existing. No new deps. WebLLM untouched (`ai/` only).
- No save-schema change (diet derived from species; hunt cooldown + memories are session/`memory`).

phase -> coder-pending.
