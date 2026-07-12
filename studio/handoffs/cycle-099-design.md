# Cycle 099 — Design

Two file-disjoint tracks. Lore = the food web's first hunt (367, folding the 435 diet split as its data
spine). Structure = per-zone harvest reads on its own on the map lens (433).

---

## Lore track — BACKLOG-367 (+ 435) — The food web wakes

### 435 data spine (pure, no behavior change of its own)

**`world/diet.ts`** (new pure module):
- `export type Diet = 'carnivore' | 'herbivore';`
- `export type FoodKind = 'plant' | 'meat';`
- Species → diet by a realistic paleo table, deterministic; unknown/bred species fall back to a stable
  name+species hash so *every* dino (present or future-bred) resolves to a diet:
  ```
  SPECIES_DIET = { triceratops: herbivore, stegosaurus: herbivore, brontosaurus: herbivore,
                   parasaurolophus: herbivore, compsognathus: carnivore }
  ```
  → in the current roster **Twitch (compsognathus) is the sole carnivore**; Rex/Mossback/Sunny/Glade are
  herbivores. *(The BACKLOG-367 text guessed "Glade"; Glade is a parasaurolophus — a herbivore. We seed
  diet by species/paleobiology, not by the backlog's placeholder name. Twitch the jittery compy being the
  bowl's lone hunter is a deliberate, species-correct subversion.)*
- `dietOf(species: string, name?: string): Diet` — table hit, else deterministic hash → herbivore-biased
  fallback (most dinos herbivores).
- `isCarnivore(species, name?): boolean`, `isHerbivore(...)`.
- `eats(diet: Diet, kind: FoodKind): boolean` — carnivore↔meat, herbivore↔plant. **A pure read only; not
  wired into the feeding loop this cycle** (herbivores still eat any hatch drop — 435 is data-only).

**`world/foods.ts`**: `Food` interface gains `kind: FoodKind`. Tag the five foods:
meat→`meat`, fish→`meat`, greens→`plant`, berries→`plant`, roots→`plant`. Additive; nothing reads it yet
except tests + (later) 437.

### 367 the hunt (pure math + thin WorldScene glue)

**`world/foodweb.ts`** (new pure module):
- `STALK_RANGE = 6` (tiles a hungry carnivore notices prey within).
- `nearestPrey(hunter: Tile, prey: ReadonlyArray<{name; tile: Tile}>, range=STALK_RANGE): string | null`
  — nearest herbivore within range (Chebyshev), deterministic (nearest wins, ties by supplied order),
  null if none in range.
- `fleeStep(from: Tile, hunter: Tile, cols, rows): Tile` — one tile **away** from the hunter along the
  dominant axis, clamped (mirror of `stepToward`; when boxed against a wall it slides along the other axis).
- `huntCaught(hunter: Tile, prey: Tile): boolean` — Chebyshev ≤ 1 (the stalker closed the gap).

**`scenes/WorldScene.ts`** glue (in `forceStep`, computed once per step before the per-dino loop):
- Build `stalkTargets: Record<hunterName, preyName>`: for each dino that `isCarnivore(species)` **and**
  has a pressing **hunger** need (`pressingNeed(...) === 'hunger'`) **and** is not on hunt-cooldown, pick
  `nearestPrey` among the **in-view, same-visible-zone** herbivores. Reverse into `fleeFrom:
  Record<preyName, hunterName>`.
- **Priority in the per-dino ladder:** insert *just below* the real-food-drop rush (a dropped meal still
  wins — a hunt yields to a sure thing) and *above* social/wander. Two branches:
  - hunter (`stalkTargets[d.name]`): step `stepToward(cur, preyTile)`, activity `'stalking'`, 🎯 mark, `continue`.
  - prey (`fleeFrom[d.name]`): step `fleeStep(cur, hunterTile)`, activity `'fleeing'`, 💨 mark, `continue`.
- **Deathless resolution:** if `huntCaught(hunterTile, preyTile)` this step, the hunt **comes up empty** —
  the quarry escapes: float a 💨 over the prey + a "🦖 the hunt came up empty" event line, put the hunter
  on a real-time **hunt cooldown** (`HUNT_COOLDOWN_MS`, ~30s, mirroring the migration cooldown) so it's a
  discrete *hunt*, not a permanent leash, and file each side a memory (`escaped <hunter>'s hunt` /
  `<prey> slipped away`). The hunter's hunger is **not** relieved (no catch-kill; meat-from-a-take is 437).
- Marks: reuse the existing per-dino mark layer used for needs/activity (a transient 🎯/💨 flash via the
  same `flashFeed`-style bubble, cleared next step). No new persistent glyph channel needed.
- Dev hooks: `__stalkTargets()` → the live `{hunter: prey}` map; `__diet(species)` → diet. Both for e2e.

**No save field.** Diet is derived from species (pure); the hunt cooldown + memories are session/`memory`
state (the memory is the durable trace, mirroring 375/405). Additive-save rule trivially satisfied.

### Acceptance criteria — lore
1. `dietOf` is deterministic and species-correct: compsognathus→carnivore, the other four roster
   species→herbivore; an unknown species resolves to a stable diet (same input → same output).
2. `FOODS` each carry a `kind`; meat+fish are `meat`, greens+berries+roots are `plant`. `eats(carnivore,
   meat)`=true, `eats(herbivore,meat)`=false, and vice-versa.
3. `nearestPrey` returns the nearest in-range herbivore (ties by order) and null when none is within
   `STALK_RANGE`; `fleeStep` moves strictly away from the hunter (or slides along a wall), always clamped
   in-bounds; `huntCaught` is Chebyshev ≤ 1.
4. In-game: force Twitch's hunger over threshold with a herbivore nearby in view → `__stalkTargets()` maps
   `Twitch → <thatHerbivore>`; on the next steps Twitch closes distance (activity `stalking`) and the prey
   flees (activity `fleeing`). A well-fed Twitch (hunger below threshold) stalks no one.
5. Deathless: when Twitch reaches the prey, no dino is removed (roster length unchanged), a "hunt came up
   empty" event fires, Twitch goes on cooldown (stops stalking for the window), and both dinos gain the
   escape/slip memory. Twitch's hunger is unchanged by the chase.
6. A real dropped food still wins: with a meat drop on the ground in range, a hungry Twitch rushes the
   drop rather than stalking (the food-rush branch pre-empts the stalk).
7. `eats` is **not** consumed by the feeding path — an herbivore fed a meat drop still eats it exactly as
   before (435 is data-only; no feeding regression). Build clean, WebLLM still under `ai/` only.

---

## Structure track — BACKLOG-433 — Per-zone harvest reads on its own

### Spec
- **`ui/lenses.ts`**: `ZoneMapEntry` gains `harvested: number`. `zoneMapModel(chain, populations,
  keeperZone, tiers = {}, harvests: Record<string, number> = {})` — new **last** param, default `{}`, so
  every existing 3/4-arg caller and test stays byte-valid; `entry.harvested = harvests[id] ?? 0`.
- **`scenes/WorldScene.ts`**: `zoneMapEntries()` passes `this.harvestedByZone` as the new arg;
  `drawZoneMap` appends `🌾{e.harvested}` to the badge line (`${prosperityBadge(e.tier)}  🌾${e.harvested}`).
  Box is 118px wide — the short read fits on the existing third line; no layout/height change.
- `__zoneMap()` already returns `zoneMapEntries()`, so the hook now carries `harvested` for free.

### Acceptance criteria — structure
1. `zoneMapModel` called with a `harvests` map sets each entry's `harvested`; omitting the arg (old
   callers) yields `harvested: 0` everywhere — the cycle-96 3/4-arg callers stay valid.
2. In-game: harvest the bowl's ripe plot → `__zoneMap()` shows the bowl entry `harvested: 1`, grove +
   fernreach `0`. Harvest a grove plot → grove bumps to `1`, bowl stays `1`, fernreach `0` (each zone on
   its own).
3. The map lens box renders `🌾1` / `🌾0` on the badge line beside the ○/◐/● tier; no tier regression
   (the prosperity badge still folds harvest in as before).
4. The per-zone read survives save→reload (rides the existing additive `harvestedByZone` save field); a
   fresh save reads `🌾0` in every zone.

Both tracks: pure logic unit-tested; one e2e per track. Build + full vitest + full e2e green before QA
signs. WebLLM import boundary (`ai/` only) unchanged. Saves additive.
