# Cycle 98 — Code Plan

Two disjoint tracks. No cross-track file collision (lore = feeding path; structure = crop data + save).

---

## Lore track — BACKLOG-385 + 386 (Provision remembered)

**Item:** reciprocity (385) + grateful nuzzle (386) on the 375 yield in `checkFeeding`.

**Files to create:** none.

**Files to modify:**
- `game/src/world/feeding.ts`
  - Add consts `RECIPROCAL_BOND = 20`, `RECIPROCAL_HUNGRIER_BY = 0.1` (both below the generous bars).
  - Extend `yieldFoodTo(winner, winnerHunger, candidates, owes: ReadonlySet<string> = new Set())`:
    per-candidate bond/hunger bars relaxed to the reciprocal values when `owes.has(c.name)`; sort key
    gains an owed-first primary term (`Number(owes.has(b)) - Number(owes.has(a))`) so a remembered
    benefactor wins ties. Empty `owes` ⇒ byte-identical to today (both branches collapse to the old
    filter + sort).
- `game/src/scenes/WorldScene.ts`
  - New field `private owesFood: Record<string, string[]> = {}` and `private lastNuzzle: {from:string;to:string}|null = null`.
  - In `checkFeeding`, the `yieldFoodTo` call passes `new Set(this.owesFood[eater.name] ?? [])`.
  - In the yield branch (after `friendName` resolves, before/around `this.eatFood(friend)`):
    - **386:** `this.lastNuzzle = { from: friendName, to: eater.name }`; `this.flashFeed(friend, '💛')`;
      `this.logEvent('💛 ' + friendName + ' nuzzled ' + eater.name + ' in thanks')`.
    - **385 repay:** if `(this.owesFood[eater.name] ?? []).includes(friendName)` → remove friendName
      from `owesFood[eater.name]` and `remember(... eater.name, 'you repaid ' + friendName + "'s kindness at the hatch")`.
    - **385 record:** `owesFood[friendName] = [...new Set([...(owesFood[friendName] ?? []), eater.name])]`.
  - In the non-yield branches, set `this.lastNuzzle = null` (mirror the existing `lastYield = null` resets).
  - Hooks in `setupFeeding`-area (beside `__yieldFood`): `__nuzzle` → `lastNuzzle`, `__owesFood` → `{...owesFood}`.
  - Reset `owesFood`/`lastNuzzle` wherever the feeding session state resets is not required (live ledger,
    not persisted); do NOT add a save field (durable trace = the memory, per 375).

**Reuse list:** `yieldFoodTo` (feeding.ts), `flashFeed`/`logEvent`/`remember`/`strengthen` (WorldScene +
ai/memory + social/bonds) — all existing. No new util.

**New dependencies:** none.

**Test plan:**
- Unit `tests/unit/cycle-098-reciprocity.test.ts` — `yieldFoodTo`:
  - owed benefactor yielded to at a bond in `[RECIPROCAL_BOND, GENEROUS_BOND)` where an un-owed one is not;
  - owed benefactor preferred on a hunger tie (owed-first sort);
  - empty `owes` reproduces the cycle-83 verdict (regression pin);
  - `RECIPROCAL_BOND < GENEROUS_BOND` and `RECIPROCAL_HUNGRIER_BY < HUNGRIER_BY`.
- E2E `tests/e2e/cycle-098-provision.spec.ts` (mirror cycle-083-generous harness): meal 1 A→B yields
  (assert `__nuzzle` = {from:B,to:A}, `__owesFood()[B]` ⊇ [A]); meal 2 with B well-fed, A hungry, bond
  25 (below GENEROUS_BOND, above RECIPROCAL_BOND) → B repays A (`__yieldFood` = {giver:B,eater:A}), debt
  cleared (`__owesFood()[B]` ∌ A), B has a `repaid` memory; control un-owed pair at bond 25 → no yield;
  a plain solo feed → `__nuzzle` null.

**Risks:** the owed-first sort term must not perturb the empty-`owes` ordering (all terms 0 → stable).
Two `flashFeed` on the friend in one tick (💛 then the eat emoji) briefly overlap — cosmetic, matches
existing multi-beat stacking.

**Estimated touch count:** ~4 files (feeding.ts, WorldScene.ts, +2 tests).

---

## Structure track — BACKLOG-432 (Fernreach plot + a farmable third crop)

**Item:** the Fernreach farms `roots`.

**Files to create:** none.

**Files to modify:**
- `game/src/world/foods.ts` — append to `FOODS`:
  `{ id: 'roots', emoji: '🥕', label: 'starchy roots', appeal: { energy: -0.5, bravery: 0.4 } }`.
  (Verified against the name-seeded roster: `roots` outscores no dino's current favorite in any season,
  so 061/170/418 verdicts are unchanged. `SEASON_CRAVING` unchanged — roots is never craved.)
- `game/src/world/plot.ts`
  - Add `FERNREACH_PLOT_TILE: Tile = { tileX: 8, tileY: 8 }` (Fernreach grass; verified `fernreachTileAt`).
  - `CROP_BY_ZONE[FERNREACH_ID] = { food: 'roots', ripe: '🍠' }`.
  - `PLOT_TILE_BY_ZONE[FERNREACH_ID] = FERNREACH_PLOT_TILE`.
  - import `FERNREACH_ID` from `./zones`.
- `game/src/world/saveGame.ts`
  - `SaveData.fernreachPlot?: { plantedDay: number } | null` (additive, beside `grovePlot`).
  - In `parseSave`: `const fernreachPlot = readPlot(o.fernreachPlot); if (fernreachPlot === undefined) return null;`
    and add `fernreachPlot` to the returned object (beside `grovePlot`).
- `game/src/scenes/WorldScene.ts`
  - `currentSaveData()`: `fernreachPlot: this.plotByZone[FERNREACH_ID]` (beside `grovePlot`).
  - restore: `this.plotByZone = { [BOWL_ID]: save.plot ?? null, [GROVE_ID]: save.grovePlot ?? null, [FERNREACH_ID]: save.fernreachPlot ?? null }`
    and `this.plotStageShownByZone` seed the `FERNREACH_ID` key `'empty'`.
  - import `FERNREACH_ID` if not already (it is imported for tint/zone logic — confirm).

**Reuse list:** `cropOf`/`stageGlyph`/`PLOT_TILE_BY_ZONE`/`ripeRigKey` (plot.ts), `readPlot` (saveGame.ts),
the zone-generic plot loops in WorldScene (`setupPlot`/`refreshPlot`/`harvest`) — all existing, no new code.

**New dependencies:** none.

**Test plan:**
- Update `tests/unit/cycle-095-crops.test.ts`: the "no Fernreach plot yet" case (`cropOf(FERNREACH_ID)`
  == bowl) becomes `cropOf(FERNREACH_ID)` == `{ food: 'roots', ripe: '🍠' }`; keep `cropOf('nowhere')`
  fallback. The `Object.values(CROP_BY_ZONE)` "every crop is a real food" loop now also covers roots.
- Unit `tests/unit/cycle-098-fernreach-plot.test.ts`: `PLOT_TILE_BY_ZONE[FERNREACH_ID]` == FERNREACH_PLOT_TILE,
  is Fernreach grass, off edges, distinct from bowl/grove; ripe marker distinct from sprout/roots-emoji/🍓/🥬;
  favorites unchanged for the whole roster across all seasons (pin the anchors + no-flip loop).
- E2E `tests/e2e/cycle-098-fernreach-farm.spec.ts`: cross to the Fernreach, plant via `__plantPlot('fernreach')`,
  fast-forward days, `__harvestPlot('fernreach')` drops roots + bumps `__harvestedByZone`? (use existing
  harvest hooks + `__plot('fernreach')`); assert a planted Fernreach plot round-trips through save/reload.

**Risks:** `roots` shifting a favorite (mitigated by the appeal math + the no-flip test). Save parse is
strict — `fernreachPlot` must be validated via the existing `readPlot` (reused) so a malformed value is
rejected like grovePlot.

**Estimated touch count:** ~7 files (foods.ts, plot.ts, saveGame.ts, WorldScene.ts, +3 tests). Arc-sized.

phase → coder-pending.

---

## Shipped (Coder — 2026-07-11)

**Lore track (385 + 386):**
- `game/src/world/feeding.ts` — `RECIPROCAL_BOND=20` / `RECIPROCAL_HUNGRIER_BY=0.1`; `yieldFoodTo` gains an optional `owes` set (relaxed bars for owed benefactors + owed-first tiebreak; empty set = byte-identical to cycle-83).
- `game/src/scenes/WorldScene.ts` — `owesFood` ledger + `lastNuzzle`; `checkFeeding` yield branch passes the ledger, records the debt, clears it on a repayment (+ "repaid X's kindness" memory), throws the 💛 (386). `__nuzzle` / `__owesFood` hooks. No save field (durable trace = the memory, per 375).

**Structure track (432):**
- `game/src/world/foods.ts` — `roots` (🥕, appeal {energy:-0.5, bravery:0.4}).
- `game/src/world/plot.ts` — `FERNREACH_PLOT_TILE {8,8}`; `CROP_BY_ZONE`/`PLOT_TILE_BY_ZONE` Fernreach rows (crop roots, ripe 🍠).
- `game/src/world/saveGame.ts` — `fernreachPlot` (additive, validated via `readPlot`).
- `game/src/scenes/WorldScene.ts` — `fernreachPlot` save/restore + field-init seeds for the Fernreach plot keys.

**Deviations:** added 3 mirror save tests (round-trip / old-save / malformed `fernreachPlot`) and updated the stale cycle-095-crops "no Fernreach plot yet" assertion — both anticipated in the plan.

**Tests added:** `tests/unit/cycle-098-reciprocity.test.ts`, `tests/unit/cycle-098-fernreach-plot.test.ts`, `tests/e2e/cycle-098-provision.spec.ts`, `tests/e2e/cycle-098-fernreach-farm.spec.ts`.

**Build:** ✅ clean. **Unit:** ✅ 1094/1094 (+16). **Dev render:** ✅ HTTP 200. **WebLLM boundary:** ✅ only under `ai/`. E2E is QA's gate.
