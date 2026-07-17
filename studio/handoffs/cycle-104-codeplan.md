# Cycle 104 — Code Plan

**Build order is not optional.** `game/src/world/needs.ts` is the one file both tracks touch. Do the
**Structure track's `needs.ts` edit first** (add `STARVING` + `isStarving`), then everything else in
either order. See Risks.

---

## Structure track — BACKLOG-444 — A carrier feeds the hungry

*(Planned first because it owns the shared constant.)*

**Item:** BACKLOG-444 [core] — a zone's banked food (446) is spent to resolve a starving resident's hunger
when no keeper drop comes.

**Files to create:** none. Both pure homes already exist (`needs.ts`, `foodstore.ts`) and `foodstore.ts`
is explicitly documented as the structural twin of `resource.ts`'s Stockpile — this is the twin's spend.

**Files to modify:**

| File | Change |
|---|---|
| `game/src/world/needs.ts` | Add `export const STARVING = 0.9` (below `NEED_THRESHOLD`, with a comment naming the 0.6–0.9 band as 376's) + `export function isStarving(n: Need \| undefined): boolean` → `(n?.hunger ?? 0) >= STARVING`. **Do not touch `NEED_THRESHOLD` or `pressingNeed`.** |
| `game/src/world/foodstore.ts` | Add `takeFood(pile, id): FoodPile` — twin of `resource.ts` `takeResource` (floors at 0, absent/0 id returns pile unchanged, never mutates). Add `pickFoodToSpend(pile, favoriteId?): string \| null` — the favorite when banked (>0), else the most-stocked id, FOODS order as the tiebreak (mirror `pickCarry`'s stable-sort discipline), `null` on an empty pile. |
| `game/src/scenes/WorldScene.ts` | (1) extend the `needs`/`foodstore` imports (`isStarving`; `takeFood`, `pickFoodToSpend`). (2) New `private feedFromStores(): void` — the spend. (3) Call it from `checkNeeds()` **after** `advanceNeeds`/the pond drink and **before** `refreshNeedMarks()`, so a fed dino's 🍖 clears in the same tick. (4) New dev hook `__setZoneFoodPile(zone, pile)` beside the existing `__zoneFoodPile` read (line ~876), mirroring `__setZonePile`. |

**`feedFromStores()` shape** (WorldScene glue stays thin — every decision is a pure call):

```
if (this.food) return;                       // a keeper drop is in play → the store is the last resort
for (const d of this.dinos) {
  if (!isStarving(this.needs[d.name])) continue;
  const zone = zoneOf(this.dinoZones, d.name, BOWL_ID);   // HOME zone, not this.zoneId
  const pile = this.foodStoreFor(zone);
  const id = pickFoodToSpend(pile, favoriteFood(d.traits, this.currentSeason()).id);
  if (!id) continue;                          // zone has nothing banked → it stays starving
  this.foodPileByZone[zone] = takeFood(pile, id);
  this.needs = satisfy(this.needs, d.name, 'hunger');
  this.flashFeed(d, <FOODS emoji for id>);
  this.memory = remember(this.memory, d.name, storesFedMemory(<zone name>));
  this.logEvent(`<emoji> the <zone name>'s stores fed ${d.name}`);
  void this.saveGame();
}
```

`storesFedMemory` + the ticker wording live in `foodstore.ts` as pure fns (`storesFedMemory(zoneName)`,
`storesFedLine(zoneName, name, emoji)`) so the strings are unit-pinnable — same pattern as
`comfort.ts`'s `comfortLine`/`comfortMemory`.

**Reuse list (MUST use, do not reinvent):**

- `game/src/world/resource.ts` — `takeResource` (lines ~316) and `pickCarry` (~185) are the **exact shape**
  to mirror for `takeFood`/`pickFoodToSpend`. Read them before writing.
- `game/src/world/needs.ts` — `satisfy(needs, name, 'hunger')` is the reset. Do **not** hand-roll it.
- `game/src/world/foods.ts` — `favoriteFood(traits, season)` for the favorite preference; `FOODS` for the
  emoji lookup + the order tiebreak.
- `game/src/world/zones.ts` — `zoneOf(this.dinoZones, name, BOWL_ID)` for the home zone; `zoneById(id).name`
  for the ticker's zone name.
- WorldScene: `this.foodStoreFor(zone)` (~402), `flashFeed` (~1268), `logEvent`, `remember`, `saveGame`.
- `game/src/world/foodstore.ts` — `foodAtCap`/`bankFood` already establish the file's conventions.

**New dependencies:** none.

**Test plan:**

- Unit — `tests/unit/cycle-104-stores-feed.test.ts`:
  - `isStarving`: 0.899 → false, 0.9 → true, 1 → true, `undefined` → false. **Plus a guard test that
    `STARVING > NEED_THRESHOLD`** — the band is load-bearing; pin it so no future tuning silently closes it.
  - `takeFood`: `{berries:2}` → `{berries:1}`; `{berries:0}`/absent id → unchanged; input object not mutated.
  - `pickFoodToSpend`: favorite banked → favorite even when a non-favorite is more stocked; no favorite
    banked → most-stocked; count tie → FOODS order; `{}` → null; favorite arg omitted → most-stocked.
- E2E — `tests/e2e/cycle-104-stores-feed.spec.ts`:
  1. Seed the bowl's food pile (`__setZoneFoodPile('bowl', {berries: 2})`), `__setNeed(name,'hunger',0.95)`,
     `__checkNeeds()` → `__needs()[name].hunger === 0`, `__zoneFoodPile('bowl')` is `{berries: 1}`, and
     `__events()` has a line naming the bowl and the dino.
  2. **Band guard:** `__setNeed(name,'hunger',0.7)` with a stocked pile → `__checkNeeds()` leaves the pile
     untouched and hunger still ≥ 0.7 (it climbed, it wasn't reset).
  3. Empty pile + hunger 0.95 → no spend, no line, hunger not reset.
  4. `__dropFood()` in play + hunger 0.95 → no spend; the pile is untouched.

**Risks:**

- **`checkNeeds()` is called every forceStep and by the `__checkNeeds` hook.** The `void this.saveGame()`
  inside the loop only runs on an actual spend (rare — a dino must climb back to 0.9), so it won't thrash
  IndexedDB. Don't lift the save above the `continue`s.
- `this.food` is nulled by `eatFood` *before* the next tick, so criterion 4's "once the drop is gone, the
  next tick feeds it" falls out for free — no extra state.
- Don't gate on `inView` — a starving dino in an off-screen zone is exactly who this is for.

**Estimated touch count:** ~5 files.

---

## Lore track — BACKLOG-376 — Woke hungry

**Item:** BACKLOG-376 [emergent] — a dino over the hunger threshold at the dawn boundary plays a visible
wake-hungry beat.

**Files to create:**

- `game/src/world/wake.ts` — pure (no Phaser, no `ai/` import), module-doc'd in the house style:
  - `wokeHungry(n: Need | undefined): boolean` → `(n?.hunger ?? 0) >= NEED_THRESHOLD`. **Reads
    `n.hunger` directly — NOT `pressingNeed()`** (a hungry-and-thirstier dino must still get its beat; see
    the design's Constraints).
  - `wakeHungryLine(name: string, traits?: Personality): string` — the temperament-shaded ticker line.
    Deterministic, no RNG. Shape: pick a shaded tail by traits, e.g. prickly (`agreeableness < 0.35`) →
    `— and in no mood about it`; high-energy (`energy > 0.65`) → `— already casting about for the hatch`;
    else → `— and looked to the hatch`. Return `🍖 ${name} woke hungry${tail}`. Order the branches so the
    fn is total and a `traits`-less dino gets the neutral tail.
  - `wakeHungryMemory(): string` → `'you woke hungry — the night was long and nothing came'`.

**Files to modify:**

| File | Change |
|---|---|
| `game/src/scenes/WorldScene.ts` | (1) import `wokeHungry, wakeHungryLine, wakeHungryMemory` from `../world/wake`. (2) `private lastWokeHungry: string[] = []` beside the existing `lastDawnDay`/`dawnCount` (~296). (3) New `private checkWakeHungry(): void` — loops the cast, `wokeHungry(this.needs[d.name])` → `flashFeed(d, NEED_GLYPH.hunger)`, `remember`, `logEvent(wakeHungryLine(d.name, d.traits))`; records the names into `lastWokeHungry`. (4) Call it from the **tail of `checkDawnChorus`** (~4495), after the chirp loop — inheriting the `lastDawnDay` once-per-day + live-only guards rather than duplicating them. (5) Dev hook `(window as any).__wokeHungry = () => [...this.lastWokeHungry]` beside `__dawnCount` (~4428). |

**Reuse list (MUST use):**

- `game/src/world/needs.ts` — `NEED_THRESHOLD` (**consume, never redefine**) and `NEED_GLYPH.hunger` for
  the 🍖 (don't hard-code the emoji).
- `game/src/scenes/WorldScene.ts` — `checkDawnChorus` (~4481) for the boundary + its guards; `flashFeed`
  (~1268) for the visible stir; `logEvent`; `remember` from `ai/memory`.
- `game/src/world/comfort.ts` — the `comfortLine`/`comfortMemory` pattern is the house shape for a
  pure line+memory pair. Match it.
- `game/src/ai/personality.ts` — `Personality` type only (this is a type import; no brain call).

**New dependencies:** none.

**Test plan:**

- Unit — `tests/unit/cycle-104-wake.test.ts`:
  - `wokeHungry`: 0.599 → false, 0.6 → true (pinned to `NEED_THRESHOLD`, not the literal), `undefined` →
    false, and **hunger 0.7 with thirst 0.9 → true** (the `pressingNeed` trap, pinned).
  - `wakeHungryLine`: contains the name and 🍖; deterministic (same input twice → identical); a prickly
    dino's line ≠ a warm dino's line; a `traits`-less call returns the neutral form and doesn't throw.
  - `wakeHungryMemory`: non-empty, mentions hungry.
- E2E — `tests/e2e/cycle-104-wake-hungry.spec.ts` (stage off the cycle-045 chorus harness —
  `__setClock`/`__advanceWall`, and copy its `HALF_DAY_MS` note about the catch-up cap):
  1. `__setNeed(a,'hunger',0.9)` on one dino, `0.1` on another; `__setClock(d,6,59)`; `__advanceWall(120_000)`
     → `__wokeHungry()` contains the first and not the second; `__events()` has one `woke hungry` line
     naming the first; `__memory()[first]` contains the memory.
  2. **No chorus regression:** the same crossing still bumps `__dawnCount` to 1 and logs 🌅.
  3. Once per day: a second `__advanceWall` within the same in-game day adds no further `woke hungry` lines.
  4. Live-only: a bare `__setClock(d,7,0)` (restore sync) produces no wake-hungry line.

**Risks:**

- **`checkDawnChorus` fires `chirpFor` through `time.delayedCall`** (staggered). `checkWakeHungry` must run
  **synchronously** at the tail, not inside a delayed callback — the e2e reads `__wokeHungry()` right after
  the crossing, and a delayed beat would race it.
- `lastWokeHungry` is transient (like `lastChorus`/`lastStalk`) — **do not persist it**, do not add a save
  field. This track touches no save code at all.
- The whole cast can wake hungry at once → N ticker lines in one tick. That's the intended read (the
  morning tells you the bowl is hungry), and `logEvent` already ring-buffers. No bubbles (design).

**Estimated touch count:** ~4 files.

---

## Cross-track collisions

| File | Both tracks? | Order + why |
|---|---|---|
| `game/src/world/needs.ts` | **YES** | **Structure first** — it *adds* `STARVING`/`isStarving`; the lore track only *reads* the existing `NEED_THRESHOLD`. Neither may edit the other's symbol. If a merge ever eats `STARVING`, the unit guard `STARVING > NEED_THRESHOLD` fails loudly. |
| `game/src/scenes/WorldScene.ts` | YES (unavoidable — one scene) | Different methods, no shared lines: 444 → `checkNeeds()` (~1969) + a hook at ~876. 376 → `checkDawnChorus()` tail (~4495) + a hook at ~4428. Land 444's first. |
| `game/src/world/foodstore.ts` | structure only | — |
| `game/src/world/wake.ts` | lore only (new) | — |

**Combined estimated touch count:** ~9 files (2 pure modules + 1 new module + WorldScene + 4 test files).
Within the v6 arc budget (~15).

---

## Shipped

**Build:** ✅ clean (`npm --prefix game run build`, built in 8.96s).
**Unit:** ✅ 1187/1187 across 132 files (was 1164 — +23: 9 wake, 14 stores-feed).
**New e2e:** ✅ 9/9 green serially (`cycle-104-wake-hungry.spec.ts` 4, `cycle-104-stores-feed.spec.ts` 5).
**Boundary:** ✅ `@mlc-ai/web-llm` still imported only under `game/src/ai/` (webllm.worker.ts, webllmBrain.ts).
**Dev server:** ✅ `http://localhost:5173/` → 200.

### Files touched (9)

Structure track — BACKLOG-444:
- `game/src/world/needs.ts` — added `STARVING = 0.9` + `isStarving()`. `NEED_THRESHOLD`/`pressingNeed` untouched.
- `game/src/world/foodstore.ts` — added `takeFood`, `pickFoodToSpend`, `storesFedLine`, `storesFedMemory`.
- `game/src/scenes/WorldScene.ts` — `feedFromStores()` called from `checkNeeds()` (after the pond drink,
  before `refreshNeedMarks` so a fed dino's 🍖 clears the same tick); `__setZoneFoodPile` seeder hook.
- `tests/unit/cycle-104-stores-feed.test.ts` (new, 14 tests)
- `tests/e2e/cycle-104-stores-feed.spec.ts` (new, 5 specs)

Lore track — BACKLOG-376:
- `game/src/world/wake.ts` (new) — `wokeHungry`, `wakeHungryLine`, `wakeHungryMemory`.
- `game/src/scenes/WorldScene.ts` — `lastWokeHungry` transient + `checkWakeHungry()` at the synchronous
  tail of `checkDawnChorus`; `__wokeHungry` hook.
- `tests/unit/cycle-104-wake.test.ts` (new, 9 tests)
- `tests/e2e/cycle-104-wake-hungry.spec.ts` (new, 4 specs)

### Deviations from the plan

1. **`storesFedLine`/`storesFedMemory` dropped the leading article** — the plan's wording
   (`the ${zoneName}'s stores`) renders as **"the The Grove's stores"**: two of the three `ZONES` display
   names already carry their own article ('Pocket Cretaceous', 'The Grove', 'The Fernreach'). Now
   `${zoneName}'s stores fed ${name}` → "The Grove's stores fed Rex". Caught by the first e2e run; pinned
   with a unit test asserting no `the The` for an article-carrying zone name. (The same latent awkwardness
   exists in the cycle-358 barter line at WorldScene ~2844, `at the ${zoneById(zoneB).name} edge` → "at the
   The Grove edge". Out of scope for this diff — not filing a backlog item over one ticker string, but
   noting it for whoever next touches that line.)
2. **The wake e2e seeds Rex at hunger 0.7, not 0.9** as loosely implied by the plan's sketch — 0.7 is over
   376's bar and under 444's, which makes the spec a live demonstration of the protected band rather than a
   test that would fight the other track's feature if the bowl ever had stores at boot.

### Notes for QA

- **Both new specs must be run serially or in a warm run.** The first parallel run failed 6/9 at
  `boot()`'s `__ready` wait (30s timeout) — the catalogued cold-boot flake (memory: `e2e-boot-flake`), not
  these diffs: the same specs pass 9/9 with `--workers=1`, and the two failures that *weren't* boot timeouts
  were the wording bug above, now fixed.
- No save changes at all. `foodPileByZone` (446) was already persisted and additive; `lastWokeHungry` is
  transient by design.
