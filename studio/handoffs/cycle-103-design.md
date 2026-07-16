# Cycle 103 — Design

Milestone 5 opener. Two tracks, independent verdicts.

---

## Lore track — BACKLOG-373 · Shared meal

**Reshape (per the lore handoff):** a hatch drop is a single piece eaten by a single dino, so "eat from the
same hatch drop" is realized as **two different dinos eating within a short wall-clock window** — successive
rushes to sequential drops read as one communal meal. This is the cleanest true-to-intent form and matches
the existing time-window idioms in the scene (`liftedUntil`, etc.).

**Spec**
- New pure helper in `world/feeding.ts`:
  - `SHARED_MEAL_MS = 4000` — eat within this many ms of another dino → "ate together". (A few seconds:
    long enough to span two rushes, short enough that unrelated meals don't pair.)
  - `SHARED_MEAL_BOND = 3` — the communal-feeding bond bump. Deliberately small: **less** than a meet, less
    than the 375 yield's `GENEROUS_BOND_BUMP` (5) — a shared meal is a gentle tie, not a grand kindness.
  - `sharedMeal(prev: { name: string; at: number } | null, name: string, at: number, windowMs = SHARED_MEAL_MS): boolean`
    → `true` iff `prev` exists, `prev.name !== name` (no self-pairing), and `at - prev.at <= windowMs`.
- `WorldScene` holds `private lastMeal: { name: string; at: number } | null = null` (transient — not
  persisted; a shared meal is a live moment, not saved state).
- In `eatFood(d)`, **before** overwriting `lastMeal`: if `sharedMeal(this.lastMeal, d.name, now)` →
  - `this.bonds = strengthen(this.bonds, this.lastMeal.name, d.name, SHARED_MEAL_BOND)` (symmetric; deepens the tie)
  - each dino files an "ate together with <other>" memory (`remember`), matching pair
  - flash `🍽` on the eater; `logEvent("🍽 <a> and <b> ate together")`
  - Then set `this.lastMeal = { name: d.name, at: now }` regardless (every meal becomes the new anchor).
- Debug hook: `__lastMeal = () => this.lastMeal` (for the e2e to assert the pairing).

**Acceptance criteria**
- **L1** Two *different* dinos eating within `SHARED_MEAL_MS` → both gain `SHARED_MEAL_BOND` bond (one
  symmetric `strengthen`), each files an "ate together" memory, a 🍽 flashes, a ticker line logs.
- **L2** The *same* dino eating twice inside the window does **not** self-bond (`prev.name === name` → false).
- **L3** Two dinos eating **more than** `SHARED_MEAL_MS` apart → no bond change, no memory (window gate).
- **L4** `sharedMeal` unit-tested for all three (pair / self / stale) + the null-prev first-meal case.
- **L5** build + tsc clean; vitest green; one e2e drives two feeds and asserts the shared-meal beat.

---

## Structure track — BACKLOG-446 · A zone banks its harvest

**Spec**
- New pure module `world/foodstore.ts` — the food twin of `resource.ts`'s Stockpile:
  - `type FoodPile = Partial<Record<string, number>>` (FOODS id → count)
  - `FOOD_STOCKPILE_CAP = 6` — per-food-id cap (banking at cap stalls, mirrors `STOCKPILE_CAP`)
  - `foodAtCap(pile, id): boolean`
  - `bankFood(pile, id): FoodPile` — pure, non-mutating; `+1` clamped at cap (at cap → pile unchanged)
  - `foodPileTotal(pile): number`
  - `foodPileLine(pile): string` — glyph readout `🍓 2 · 🥬 1` from `FOODS` emoji, only ids with `>0`,
    in `FOODS` order; `''` when empty. (Imports `FOODS` from `./foods` for the glyph map.)
  - one `foodstore.test.ts` covering bank/cap/line.
- `WorldScene`:
  - `private foodPileByZone: Record<string, FoodPile> = {}` + `private foodStoreFor(zone) { return (this.foodPileByZone[zone] ??= {}); }`
  - in `harvest(zone)`, after `harvestedByZone` bumps: `this.foodPileByZone[zone] = bankFood(this.foodStoreFor(zone), crop.food);`
    (the existing `dropFood` into the feeding loop is **unchanged** — the bank is the *stored share*, additive)
  - save: add `foodPileByZone: this.foodPileByZone` to the payload; restore `this.foodPileByZone = save.foodPileByZone ?? {}`
  - debug hook: `__zoneFoodPile = (z: string) => ({ ...this.foodStoreFor(z) })`
- `ui/lenses.ts`:
  - `ZoneMapEntry` gains `banked: string` (the `foodPileLine`, `''` when empty)
  - `zoneMapModel(..., foodPiles: Record<string, FoodPile> = {})` — computes `banked` per zone (absent → `''`,
    so older callers/tests stay valid)
  - `drawZoneMap` appends a `\n<banked>` line when non-empty; bump `boxH` to fit the (now up to) fifth line.
  - `lenses.test.ts` extends for the banked line.
- `world/saveGame.ts`: add `foodPileByZone?: Record<string, Record<string, number>>` to `SaveData` (additive-optional).

**Acceptance criteria**
- **S1** Harvesting a ripe plot banks **one** unit of that zone's crop food into its food pile; the food drop
  into the feeding loop is unchanged (feeding still works).
- **S2** Banked food reads on the zone-map lens for that zone (`🍓N`); a zone with an empty pile shows no banked line.
- **S3** `bankFood` clamps at `FOOD_STOCKPILE_CAP` (banking at cap is a no-op) and never mutates its input — unit-tested.
- **S4** Save round-trips `foodPileByZone` (additive; a pre-446 save without it loads to `{}` and behaves).
- **S5** build + tsc clean; vitest green; one e2e harvests and asserts the bank + lens read.

---

## Cross-track safety
- 373 touches `world/feeding.ts` (+ `eatFood`); 446 touches new `world/foodstore.ts`, `harvest`, `ui/lenses.ts`,
  `world/saveGame.ts`. Both touch `WorldScene` but **different methods** (`eatFood` vs. `harvest`/`drawZoneMap`).
- Both add a field to the save payload — different lines, no clobber.
- `@mlc-ai/web-llm` untouched (boundary intact). Save changes additive only.
