# Cycle 130 — Code Plan

Two tracks. Both terminate in `WorldScene.ts` but in different methods (`checkFeeding` vs `checkNeeds`)
and different imports; **no shared function, no shared line**. Do the lore track first (it is the one with a
branch-ordering constraint), then the structure track, then run the gates once over both.

---

## Lore track — BACKLOG-403 — Victor's mercy

**Item:** BACKLOG-403 [emergent] Victor's mercy — a well-fed dino that faced a rival down at the hatch,
meeting it still hungry, lets it have the next scrap.

### Files to create

- `tests/e2e/cycle-130-mercy.spec.ts`

### Files to modify

- `game/src/world/pecking.ts`
  - add `MERCY_AGREE` (0.55) — agreeableness at/above which a victor is magnanimous. Above the neutral
    midpoint on purpose: mercy is a positive trait read, not the default.
  - add `showsMercyTo(memories, winnerHunger, winnerAgreeableness, candidates)` → `string | null`.
    Candidates are `{name, hunger}`. Gates in order: `winnerHunger > WELL_FED` → null;
    `winnerAgreeableness < MERCY_AGREE` → null; then filter candidates to
    `dispositionToward(memories, name) === 'confident' && hunger >= GOBBLE_HUNGER && name !== winner`;
    sort by `peckingScore` desc, then `hunger` desc, then `localeCompare`; return `[0]?.name ?? null`.
  - add `mercyMemory(rival)` → `` `you let ${rival} have the scrap this time` `` and
    `sparedMemory(victor)` → `` `${victor} let you have the scrap this time` `` — exported builders, per
    BACKLOG-483. Both are deliberately outside every `WEIGHTS` regex.
  - add `mercyLine(victor, rival)` → the ticker string, reusing `becauseOf('confident', rival)` for the
    because-clause so the two branches can never word the same fact differently.
  - imports grow by `WELL_FED, GOBBLE_HUNGER` from `./feeding` (it already imports `standsGround` from
    there — same module, no new edge in the graph).
- `game/src/world/pecking.test.ts` — the unit block below.
- `game/src/scenes/WorldScene.ts`
  - `checkFeeding`: after the 375 `friendName` branch returns and after `this.lastYield/lastNuzzle` are
    nulled, and **before** `gobblerAmong`, insert the mercy branch. It reuses the already-built
    `candidates` array (which carries `name`/`hunger`) and `eaterHunger` — no second scan of the swarm.
    On a hit: set `this.lastMercy = { victor, rival }`, null `lastStand`/`lastGobble`, `remember` both
    builders, `flashFeed(eater, '🤲')`, `flashFeed(rival, '🍖')`… **no** — flash the rival nothing; it
    simply eats, and `eatFood` already flashes its own reaction glyph. Then `logEvent(mercyLine(...))`
    and `this.eatFood(rivalDino); return;`.
  - null `this.lastMercy` on the paths that don't take it (the 375 branch and the fall-through), the same
    bookkeeping `lastYield`/`lastGobble`/`lastStand` already get.
  - add the field `private lastMercy: { victor: string; rival: string } | null = null;` beside `lastStand`.
  - add the dev hook `(window as any).__mercy = () => (this.lastMercy ? { ...this.lastMercy } : null);`
    beside `__berth`/`__disposition`.

### Reuse list

- `game/src/world/pecking.ts` — `dispositionToward`, `peckingScore`, `becauseOf`, `PECKING_MIN_BEATS`
  (via `dispositionToward`). The confidence read is 401's, unchanged and un-restated.
- `game/src/world/feeding.ts` — `WELL_FED` (the "doesn't need this meal" bar, shared with the 375 yield)
  and `GOBBLE_HUNGER` (the "hungry enough to have grabbed" bar, shared with 387). **Do not invent new
  hunger constants**; the whole point is that the mercy is calibrated against the same bars the beats it
  reads were calibrated against.
- `WorldScene.checkFeeding`'s existing `candidates` array (swarm within `SWARM_RADIUS`) and `eaterHunger`.
- `WorldScene.flashFeed`, `logEvent`, `remember`, `recall`, `eatFood` — all existing.
- Spec helpers: `tests/e2e/helpers.ts` `boot`, plus the `__remember` / `__setTrait` / `__setNeed` /
  `__placeDino` / `__dropFood` / `__ticker` hook family that cycle-128/129's specs already drive.

### New dependencies

none.

### Test plan

**Unit — `game/src/world/pecking.test.ts` (append a `showsMercyTo` describe):**

1. a confident-toward, hungry rival in the swarm is returned (the happy path, ring built from
   `slunkOffMemory`-shaped strings so the disposition is derived, not asserted).
2. `null` when the winner's hunger is above `WELL_FED`.
3. `null` when the winner's agreeableness is below `MERCY_AGREE`.
4. `null` when the rival's hunger is below `GOBBLE_HUNGER`.
5. `null` when the disposition toward the rival is `wary`, and `null` when it is absent.
6. `null` on a single contested beat (`PECKING_MIN_BEATS`) even though the score alone would clear
   `PECKING_BAR` — the 389/401 discipline.
7. the winner is never returned as its own candidate.
8. two qualifying rivals → the higher `peckingScore` wins; equal scores → hungrier; equal both →
   lexicographic.
9. `mercyMemory` / `sparedMemory` added to a ring leave `peckingRead` byte-identical for both dinos — the
   pin that a mercy cannot rewrite the history it was granted from.
10. `mercyLine` contains both names and the `becauseOf('confident', rival)` clause.

**E2E — `tests/e2e/cycle-130-mercy.spec.ts`:**

1. *the victor steps off the scrap* — stage two `you stood your ground and kept your food from <rival>`
   memories on the victor (built the way 129's spec builds the 394 string: the production wording, matched
   through the module), assert `__disposition(victor, rival) === 'confident'`, set the victor's
   agreeableness ≥ `MERCY_AGREE` and hunger 0, the rival's hunger 0.9, place both at the drop, step, then
   assert `__mercy()` is `{victor, rival}`, the ticker carries `mercyLine`, and the **rival's** hunger is
   the one that reset to 0.
2. *a petty victor takes it* — the same staging with the victor's agreeableness below `MERCY_AGREE`:
   `__mercy()` is null and the drop resolves through the existing contest path (`__forceContest`-shaped
   assertions: one of `__stand`/`__gobble` is set, or the victor simply eats).
3. *a fresh park is inert* — boot, drop food with no staged memories, step: `__mercy()` stays null.
4. zero console errors in every test (the standing convention).

### Risks

- **Branch ordering.** The mercy must sit after the 375 yield and before `gobblerAmong`. Putting it after
  the gobble check would make it unreachable whenever the rival *is* this drop's gobbler — which is the
  common staging — and would leave `resolveContest` deciding first.
- **`eatFood` on the rival, not the winner.** `eatFood` clears the food sprite and sates *its argument's*
  hunger; passing the wrong dino silently inverts the whole feature and no type error catches it. The e2e
  asserting *which* hunger reset is the guard.
- **The `candidates` array carries `bond` and `agreeableness` too.** `showsMercyTo` must take only what it
  reads (`name`, `hunger`) so the unit tests can construct minimal fixtures; the structural-typing pass
  from `checkFeeding` is then free.
- **Glyph.** 🤲 is unused across `game/src` (checked). Do not reach for 🤝 (375's yield), 😠/😖/😤 (the
  contest trio) or 😬 (389's berth) — the cycle-129 artist finding.
- **`lastMercy` bookkeeping.** Every branch of `checkFeeding` must set it (to null or a value), or a stale
  mercy from a previous drop reads as a fresh one — exactly the shape of bug `lastStand`/`lastGobble` are
  nulled defensively against.

### Estimated touch count

~4 files.

---

## Structure track — BACKLOG-466 — The dry season

**Item:** BACKLOG-466 [core] The dry season — one pure seasonal thirst/water modifier the needs and
waterhole hooks read.

### Files to create

- `game/src/world/dry-season.test.ts` (the unit block; `seasons.ts`'s existing tests are split per feature
  in this repo — `lean-season.test.ts`, `migrating-warmth.test.ts` — so follow that convention rather than
  growing one omnibus file)
- `tests/e2e/cycle-130-dry-season.spec.ts`

### Files to modify

- `game/src/world/seasons.ts`
  - `SEASON_THIRST: Record<Season, number>` = spring 1, summer **1.5**, fall 1, winter **0.7**; exported
    accessor `seasonThirst(season)`. Spring/fall exactly 1 — the year's hinges, and the reason a fresh
    clock stays byte-identical (the 461/178/171 discipline, stated in the doc comment).
  - `SUMMER_SLAKE_FLOOR = 0.15` and `slakeFloor(season)` → the floor a drink resets thirst to (summer the
    constant, every other season 0).
  - `seasonThirstLine(season)` → `'☀️ the dry season parches the bowl — thirst builds faster and a drink
    doesn't hold.'` / `'❄️ winter eases the thirst — a drink goes further.'` / `''` for spring and fall,
    mirroring `seasonGripLine` exactly (including the `''` convention for the hinges).
- `game/src/world/needs.ts`
  - `thirstRate(traits, mul = 1)` — multiply the trait-scaled base. Default 1 keeps every existing caller
    and test identical.
  - `advanceNeeds(needs, entries, steps = 1, thirstMul = 1)` — thread the multiplier into the thirst term
    only. Hunger's term is untouched.
  - `satisfy(needs, name, which, to = 0)` — reset to `to` instead of 0. Default 0 keeps all four existing
    call sites identical.
  - **No import of `seasons.ts`.** The multiplier arrives as a number.
- `game/src/scenes/WorldScene.ts`
  - `checkNeeds`: pass `seasonThirst(this.currentSeason())` as `advanceNeeds`' 4th argument, and
    `slakeFloor(season)` as `satisfy`'s 4th at the `atWater` drink.
  - the season-turn handler (where `seasonGripLine` is logged): log `seasonThirstLine(season)` beside it,
    skipping the empty string exactly as the grip line does.
  - `__advanceNeeds` dev hook: thread the same multiplier, so the e2e drives the production rate rather
    than the default.
  - import `seasonThirst, slakeFloor, seasonThirstLine` from `../world/seasons` (that import already exists
    for `seasonFor`/`seasonGrip`/`seasonSocialBias`).
- `game/src/world/needs.test.ts` — pin the defaults (see below).

### Reuse list

- `game/src/world/seasons.ts` — `Season`, `SEASONS`, and the **shape** of `seasonGrip`/`seasonSocialBias`/
  `seasonGripLine`. These three are the template; the new functions must look like their siblings (a
  frozen record + a lookup accessor + a line function with `''` for the hinges), not like a new idiom.
- `game/src/world/needs.ts` — `scaled` (the trait-energy scaling) and `clamp01`. The multiplier composes on
  top of `scaled`; it does not replace it.
- `WorldScene.currentSeason()` — the single season read. Do not call `seasonFor(getWorldClock()...)` again.
- E2E: the `__setClock(day, h, m)` hook (the `cycle-121-yearning` / `cycle-122-distance` convention) to
  land on a chosen season, plus `__advanceNeeds`, `__setNeed`, `__checkNeeds`, `__ticker`.

### New dependencies

none.

### Test plan

**Unit — `game/src/world/dry-season.test.ts`:**

1. `seasonThirst` for all four seasons; `spring === 1` and `fall === 1` asserted with `toBe` (exactness is
   the compatibility promise, not an approximation).
2. summer > 1 > winter.
3. `slakeFloor`: summer is the floor constant, the other three are exactly 0.
4. `seasonThirstLine` is non-empty for summer and winter, `''` for spring and fall.
5. `advanceNeeds` with no 4th argument equals `advanceNeeds` with `1` — the byte-identical default.
6. over N identical steps, summer thirst > spring thirst > winter thirst for the same dino and traits.
7. hunger is identical across all three of those runs — the grip reaches thirst only.
8. `satisfy(..., 'thirst')` with no `to` is exactly 0; with the summer floor it is the floor.
9. thirst still clamps at 1 under the summer multiplier (the `clamp01` pin).

**Unit — `game/src/world/needs.test.ts`:** one added case that the existing `thirstRate(traits)` signature
still returns the pre-466 number (guards the default-argument change).

**E2E — `tests/e2e/cycle-130-dry-season.spec.ts`:**

1. *the heat is felt* — boot, `__setClock` onto a summer day, `__setNeed(name,'thirst',0)`,
   `__advanceNeeds(20)`, record; `__setClock` onto a winter day, reset, advance the same 20; assert the
   summer thirst is strictly greater.
2. *a summer drink doesn't hold* — park a thirsty dino at its zone's water (`__placeDino` onto the
   waterhole tile the way the 445 spec does), `__checkNeeds()` under summer → thirst equals the floor, not
   0; repeat under spring → exactly 0.
3. *the turn says so* — cross into summer and assert the ticker carries the dry-season line; cross into
   spring and assert it carries no thirst line.
4. zero console errors.

### Risks

- **Default-argument creep.** Three signatures gain trailing optional parameters. Every existing call site
  must be left alone; if the Coder finds itself editing a call it isn't listed above, that's a signal the
  default is wrong.
- **`satisfy` is called for hunger too** (`eatFood`, `feedFromStores`, the hunt). The `to` parameter must
  not be threaded into those — hunger has no seasonal floor this cycle.
- **e2e season landing.** `__setClock(day, …)` must land on a day whose `seasonFor` is the intended season;
  compute it in the spec from `SEASON_LENGTH_DAYS` rather than hard-coding day numbers, or the spec breaks
  the first time the year's length changes.
- **The `__advanceNeeds` hook currently bypasses the season.** If it isn't threaded, e2e test 1 silently
  passes for the wrong reason (both runs at 1.0) — assert a strict inequality, never equality-to-a-constant.
- Thirst is slower than hunger by design (`THIRST_RATE` 0.005). 20 steps at 1.5× is 0.15 — visible in a
  numeric assertion but **not** enough to cross `NEED_THRESHOLD`. Do not write the e2e as "the 💧 appears".

### Estimated touch count

~6 files.

---

## Cross-track collision check

`WorldScene.ts` is the only shared file. `checkFeeding` (403) and `checkNeeds` (466) are disjoint methods;
the import block and the dev-hook block are both append-only. Order: land 403 fully (including its unit
run), then 466. Combined estimate **~9 files** — inside the arc-sized budget.
