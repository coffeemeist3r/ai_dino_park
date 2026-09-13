# Cycle 159 — Code Plan

Build order: **structure track first** (it changes `dropFood`, which every lore-track spec drives),
then the lore track on top, then one combined `reachability.ts` edit.

## Prior art found (reuse, do not re-invent)

| Need | Already exists | Where |
|---|---|---|
| food id → count pile, capped | `FoodPile`, `bankFood`, `foodAtCap`, `FOOD_STOCKPILE_CAP` | `world/foodstore.ts` |
| glyph readout of a pile | `foodPileLine` | `world/foodstore.ts` |
| day-boundary pass with jump-safe arming | `checkSpoilage` + `lastSpoilDay`, armed in boot **and** `syncSeason` | `WorldScene.ts:8147,8192` |
| optional plaque line | `PlaqueStats` optional fields, absent-means-nothing | `ui/plaque.ts:75` |
| "explicit foodId bypasses the selector" | `feedKind` | `WorldScene.ts:2471` |
| prickly cutoff | `PRICKLY_MAX = 0.4` (`ai/brain.ts` — **do not import**, boundary) | `ai/brain.ts:148` |
| hunger bar for a contested drop | `GOBBLE_HUNGER = 0.5` | `world/feeding.ts` |
| favorite read | `foodReaction(food, traits, season).favorite` | `world/foods.ts:90` |
| pile save validation shape to copy | `foodPileByZone` validator | `world/saveGame.ts:438` |

## Structure track — BACKLOG-546

### New: `game/src/world/satchel.ts` (pure)

```
FOUNDING_SATCHEL: FoodPile   = { greens: 4, berries: 3, meat: 2, fish: 1 }
SATCHEL_STAPLES              = keys of FOUNDING_SATCHEL
satchelCount(pile, id)       -> number
spendFromSatchel(pile, id)   -> FoodPile | null      (null = none of that id)
refillSatchel(pile)          -> FoodPile             (staples topped to founding; crops untouched)
bankToSatchel(pile, id)      -> FoodPile             (harvest; clamped at FOOD_STOCKPILE_CAP)
rollFromSatchel(pile, rand)  -> string | null        (uniform over ids with count > 0, FOODS order)
satchelEmpty(pile)           -> boolean
```

### `WorldScene.ts`

1. Field `private satchel: FoodPile = { ...FOUNDING_SATCHEL }` + `private lastSatchelDay = 0`.
2. `dropFood(col?, foodId?)` — the **explicit-`foodId`** path is untouched (harvest + `__dropFood`).
   On the keeper path only:
   - resolve the id first (`feedKind`'s logic split into `keeperFeedId()` returning `string | null`,
     which consults `rollFromSatchel` for `FEED_AUTO`),
   - `null` → `logEvent` the out-of-stock line, refresh the HUD, return the current (absent) food and
     spawn nothing,
   - else `spendFromSatchel`, then proceed exactly as today.
   To keep the "no food spawned" path honest, `dropFood` gains a `null` return on the empty case and
   the two callers (`H` handler, `__dropFood`) tolerate it.
3. `feedKind(foodId?)` keeps its signature for the explicit path; the roll branch now takes the id
   `keeperFeedId()` produced, so the selector and the satchel can never disagree.
4. `refreshGiftHud` — `feedLine(label)` becomes `feedLine(label, count)`; `ui/controlsHelp.ts`'s
   `feedLine` gains an optional second arg appending ` ×N` (absent → byte-identical old output).
   `FEED_AUTO` shows the satchel total.
5. `plaqueStats()` gains `satchel: foodPileLine(this.satchel)`; `ui/plaque.ts` gains the optional
   `satchel?: string` field and pushes `Satchel · …` after `Stores`.
6. `clock.onHour((t) => this.checkSatchel(t))` beside the spoilage/upkeep listeners; `checkSatchel`
   copies `checkSpoilage`'s day-guard shape. Arm `lastSatchelDay` in boot and in `syncSeason`.
7. Harvest (`WorldScene.ts:2123` region) also `bankToSatchel(this.satchel, crop.food)`.
8. Save: `satchel: this.satchel` in the snapshot; restore `this.satchel = { ...FOUNDING_SATCHEL, ...save.satchel }`
   — absent → founding. `saveGame.ts`: `satchel?: Record<string, number>` + a validator copied from
   `foodPileByZone`'s (object of finite non-negative numbers, else reject).
9. Hooks: `__satchel()` returns a deep copy; `__setSatchel(pile)` sets it (specs need to zero a food).

### Tests

- `game/src/world/satchel.test.ts` — the six pure functions, immutability, the seeded roll.
- `tests/e2e/cycle-159-satchel.spec.ts` — founding stock, the countdown, the empty-handed drop, the
  plaque line, the HUD count, `FEED_AUTO` rolling only stocked ids, `__dropFood` not spending.

## Lore track — BACKLOG-070

### `game/src/world/feeding.ts`

```
PICKY_AGREE  = 0.4   // pinned to ai/brain.ts PRICKLY_MAX — see the test
PICKY_HUNGER = GOBBLE_HUNGER  // a hungry dino eats what it is given; this is what
                              // makes refuser and gobbler disjoint by arithmetic
refusesFood(agreeableness, isFavorite, hunger) -> boolean
refusedMemory(label) -> string      // builder, per BACKLOG-483's rule
```

### `WorldScene.ts`

1. Field `private refusedThisDrop = new Set<string>()` (transient, never saved) +
   `private lastRefusal: { name: string; foodId: string } | null = null`.
2. `checkFeeding`: the eater `find` excludes `this.refusedThisDrop`. Immediately after the eater is
   found and **before** `yieldFoodTo`, evaluate `refusesFood`. On a refusal: add to the set, set
   `lastRefusal`, `remember(refusedMemory(label))`, `flashFeed(d, '😑')`, `logEvent`, `return` —
   the food is left untouched.
3. `dropFood` and `eatFood` clear `refusedThisDrop`.
4. Hook `__refused()`.

### Tests

- `game/src/world/feeding.test.ts` — extend: the three conditions, the favorite-never-refused sweep
  over the founding roster × FOODS × seasons, the disjointness property vs `gobblesFood`, and the
  `PICKY_AGREE === PRICKLY_MAX` pin.
- `tests/e2e/cycle-159-refusal.spec.ts` — the refusal, the second dino eating the same piece, no
  double-refusal over ten steps, the memory line.

## Both — `world/reachability.ts`

Two register entries added in one edit:

- `BACKLOG-070` — founding fact: at least one founding roster dino satisfies
  `refusesFood(agreeableness, false, 0)`.
- `BACKLOG-546` — founding fact: `FOUNDING_SATCHEL` is non-empty and holds at least one id at ≤ 2.

## Risks

- **The suite drives food through `__dropFood` (25 files) and presses `H` in exactly one place.**
  Because the explicit-`foodId` path bypasses the satchel, the blast radius is that one place plus any
  spec that asserts a plaque or HUD literal. Grep both before committing.
- `dropFood` returning `null` changes a signature two call sites read. Both are in `WorldScene`.
- The refusal `return` sits in the hottest function in the scene; it must come after the
  `inView`/`reachedFood` filter so the cost is unchanged on the no-food path.

---

## Shipped

Both tracks landed. `npm run build` clean, **2729 unit** green (257 files, 3 skipped), **743 e2e** green.

**One design change during the build, and it is worth reading.** The plan put the refusal check ahead of
`yieldFoodTo`, on the reasoning that a dino which will not eat is not a winner. That was wrong, and the
suite said so immediately: three specs across `cycle-083-generous` and `cycle-098-provision` went red
because **every yield candidate is well-fed, and well-fed is most of what makes a dino fussy** — so a
refusal placed first shadowed the entire generous-feeder arc (375/385/386) for any prickly dino.

The branch now sits **after** the yield and the mercy and **before** the contest, and the seam is where
the beats actually differ: generosity and grace are about *giving the meal away*, and a dino that does
not want it is the most willing giver in the park; the contest is about *keeping* it, which a refuser has
no stake in. Two of the three specs went green on the move alone.

**One spec was edited, deliberately.** `cycle-083-generous`'s passthrough case ("no qualifying friend →
the winner eats") staged a well-fed winner and asserted it eats. That is no longer unconditionally true —
which is the entire point of BACKLOG-070 — so the winner is now forced warm, with a comment naming the
branch the test is actually about. No assertion was weakened; a case was named.

**Files:** `world/satchel.ts` (new), `world/feeding.ts`, `world/reachability.ts`, `world/saveGame.ts`,
`ui/plaque.ts`, `ui/controlsHelp.ts`, `scenes/WorldScene.ts`, plus two unit suites and two e2e suites,
and the one spec edit above. Thirteen files, inside the arc cap.
