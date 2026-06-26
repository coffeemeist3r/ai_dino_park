# Cycle 80 — Code Plan (two tracks)

Both tracks add one pure `world/*.ts` module + disjoint `WorldScene.ts` glue + tests. No new deps.
No `SAVE_VERSION` bump (loner derives from saved bonds; needs is an additive field).

## Lore track — BACKLOG-135 (The loner)

**Files to create**
- `game/src/world/loner.ts` (pure): `LONER_FLOOR = 8` (one huddle's worth — pinned to the comfort floor's
  scale), `LONER_BONUS = 4` (outsized greet bump), `MOPE_GLYPH = '🥀'`, `isLoner(bonds, name, peers, floor?)`
  (true when the dino's strongest pairwise bond < floor — pure read via `bondPoints`), `edgeTarget(tile, cols, rows)`
  (nearest bowl edge tile — min of the 4 wall distances), `perkUpLine(name)` (`'<name> perks up 💐'`).
- `tests/unit/cycle-080-loner.test.ts`.
- `tests/e2e/cycle-080-loner.spec.ts`.

**Files to modify**
- `WorldScene.ts`:
  - import `{ isLoner, LONER_FLOOR, LONER_BONUS, MOPE_GLYPH, edgeTarget, perkUpLine }`.
  - `forceStep` wander-decision block (~1891–1917): add `const lonely = isLoner(this.bonds, d.name, this.dinoNames(), LONER_FLOOR)`,
    a `moping = !huddling && !gathering && lonely` branch between gathering and socializing
    (`socializing` gains `&& !moping`); when moping, `next = stepToward(cur, edgeTarget(cur, COLS, ROWS), ...)`.
    Activity stays `wandering` (the 🥀 mark is the tell — no `activity.ts` change).
  - `spawnDino`: push a `mopeMarks` text (🥀, hidden).
  - new `mopeMarks: Phaser.GameObjects.Text[]` field + `refreshMopeMarks()` (visible when
    `isLoner(...) && inView`, at `d.y - TILE * 1.4`); call it from `refreshSleepMarks` tail (beside `refreshColdMarks`).
  - `recordGreet` + `recordTone`: in the **plain** branch only (not repairing/warming), add
    `const lonely = isLoner(...)`; add `lonely ? LONER_BONUS : 0` to `gain`; after `bumpPoints`, if `lonely`
    show `perkUpLine` bubble once. (Repair/warm branches untouched → cycle-006/035/125/184 sentries hold.)
  - hooks: `__loners()` (names where `isLoner`), `__isLoner(name)`.

**Reuse list** — `bondPoints` (social/bonds.ts), `maxBond`/`stepToward`/`inView`/`tileOf` (WorldScene),
`greetGain`/`bumpPoints` (friendship.ts), `showBubble`, the `coldMarks` index-aligned mark pattern.

**Test plan**
- Unit: `isLoner` true when all bonds < floor / false with one ≥ floor / empty peers = loner;
  `edgeTarget` returns an edge tile (one coord at 0 or cols-1/rows-1) nearest the input; `perkUpLine` contains name + 💐.
- E2E: bond a pair high so they're non-loners + leave one dino unbonded → `__loners()` = [that one];
  assert its 🥀 mark visible, the bonded pair's not; greet the loner via `__greet`/key, friendship jumps by
  ≥ greetGain + LONER_BONUS and 💐 floats; greet a non-loner → no 💐, normal gain.

## Structure track — BACKLOG-371 (Need-drive spine)

**Files to create**
- `game/src/world/needs.ts` (pure): `interface Need {hunger; thirst}`, `type Needs = Record<string, Need>`,
  `NEED_THRESHOLD = 0.6`, `HUNGER_RATE = 0.01`, `THIRST_RATE = 0.005` (thirst slower — rarer 💧, hunger the
  common keeper-quenched one), `NEED_GLYPH = {hunger:'🍖', thirst:'💧'}`, `hungerRate(traits?)`/`thirstRate(traits?)`
  (energy-scaled: `BASE*(0.6+0.8*energy)`), `advanceNeeds(needs, entries, steps?)` (pure, clamp ≤1),
  `pressingNeed(n)` (`'hunger'|'thirst'|null` — larger if ≥ threshold, tie→thirst), `satisfy(needs, name, which)` (→0).
- `tests/unit/cycle-080-needs.test.ts`.
- `tests/e2e/cycle-080-needs.spec.ts`.

**Files to modify**
- `WorldScene.ts`:
  - import the needs module; new `needs: Needs = {}` field + `needMarks: Phaser.GameObjects.Text[]`.
  - `spawnDino`: `this.needs[cfg.name] ??= { hunger: 0, thirst: 0 }`; push a `needMarks` text (empty, hidden).
  - `forceStep` tail (~1959–1968): add `this.checkNeeds()` → advance all dinos' needs one step
    (`advanceNeeds`), quench thirst for any dino within `nearPond` sight, refresh need marks.
  - `eatFood` (~876): after the existing gain, `this.needs = satisfy(this.needs, d.name, 'hunger')`.
  - `refreshNeedMarks()`: text = `NEED_GLYPH[pressing]`, visible when `pressingNeed(this.needs[name]) && inView`,
    at `d.y - TILE * 1.7` (above 🥶/🥀).
  - save: `currentSaveData` add `needs: this.needs`; restore `this.needs = save.needs ?? {}` then backfill
    any spawned dino missing an entry to `{0,0}`.
  - hooks: `__needs()`, `__pressingNeed(name)`, `__advanceNeeds(steps?)` (drives the build headless),
    `__setNeed(name, which, v)`.
- `game/src/world/saveGame.ts`: add optional `needs?: Needs` to `SaveData` (additive; validated lenient —
  absent → {}). No `SAVE_VERSION` bump.

**Reuse list** — `nearPond` (world/arrival.ts — thirst quench at the pond), `eatFood`/`checkFeeding`
(hunger quench), `tileOf`/`inView`, the `coldMarks` mark pattern, the additive-save validation shape of `gathered`.

**Test plan**
- Unit: fresh need = {0,0}; `advanceNeeds` raises both, clamps ≤1; higher-energy hunger rises faster;
  `pressingNeed` null below / larger above; `satisfy` zeroes one need only; **no-death** is structural
  (the module never deletes — assert `advanceNeeds` keys are unchanged set).
- E2E: `__advanceNeeds(100)` → a dino shows 🍖 (or 💧); feed it (`__drop`/key + let it eat) → hunger 0, 🍖 gone;
  migrate a thirsty dino to the grove pond (`__migrate` + `__warpTo` a water-adjacent tile) + step →
  thirst 0, 💧 gone; population unchanged after pinning a need at 1 over many steps; `needs` survives a save round-trip.

## Risks / cross-track
- **Shared files:** both edit `WorldScene.ts` `spawnDino` (two mark pushes + one needs-init) and the
  save serialize/restore — do both in one pass so neither clobbers the other. `forceStep` edits are in
  different regions (loner = wander-decision; needs = tail). No function is edited by both tracks.
- **Mark stacking:** 💤(-1.0) / 🥶(-1.4) / 🥀(-1.4) / 🍖💧(-1.7). A dino that's both a loner and hungry shows
  both at different offsets — intended. Cold+mope co-occurrence is rare and only a cosmetic overlap.
- **Thirst in the bowl:** the pond is grove-only, so a bowl dino quenches thirst only after it migrates
  (existing system). Deliberate — thirst slower than hunger keeps 💧 rare, and it's the exact pressure the
  deferred wander-pull (372) will answer. Not a half-feature: thirst *is* resolvable (pond), just not in-bowl.

**Estimated touch count:** ~7 files (2 new src, 1 src edit ×2 tracks = WorldScene + saveGame, 2 new unit, 2 new e2e). Within budget.
