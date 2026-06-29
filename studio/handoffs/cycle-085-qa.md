# Cycle 85 — QA

**Build:** ✅ `npm run build` (game) clean — type-check passed.
**Unit tests:** ✅ `npm run test:unit` — **883 passed / 883** (+9 net new this cycle).
**E2E tests:** ✅ `npx playwright test` (full, port freed) — **269 passed / 270**. The lone failure was
`cycle-037-keeper.spec.ts:43` (the chosen observer persists across a reload) — **green 4/4 isolated**
(`--workers=1`), the catalogued parallel-load flake (a cold reload under 6-worker contention). It touches
keeper persistence, nothing in this cycle's diff (zones / feeding). Not a regression.
**web-llm boundary:** ✅ grep clean — imported only under `game/src/ai/`.
**Save schema:** unchanged either track (no `SAVE_VERSION` bump).

---

## Lore track — BACKLOG-390 Standing up to the gobbler

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Gobbler would fire but winner bravery ≥ STAND_BRAVERY → winner eats, gobbler denied | **PASS** | e2e `cycle-085-stand-up` "a bold winner holds its ground": winner hunger <0.1 (ate), gobbler still >0.8 (denied) |
| 2 | Standing winner flashes 😠 and the log names both | **PASS** | `checkFeeding` 390 branch (`flashFeed(eater,'😠')` + `logEvent("held its ground against …")`); `__standFood()` beat = `{winner,gobbler}` asserted |
| 3 | Winner files a "stood up to" memory | **PASS** | e2e asserts `__memory()[winner]` includes "stood your ground" + the gobbler name |
| 4 | Winner bravery < STAND_BRAVERY → gobble byte-identical (387 unchanged) | **PASS** | e2e `cycle-085-stand-up` "a timid winner cedes" (gobbler eats, `__standFood` null) + `cycle-084-gobble` 2/2 green (winner pinned timid) |
| 5 | The generous yield (375) still pre-empts everything | **PASS** | yield branch `return`s before gobble/stand is evaluated; `cycle-083-generous` 2/2 green |
| 6 | No bond change, no save-schema change; pure helper unit-tested | **PASS** | `standsGround` unit (boundary inclusive at 0.65, false below); no bond/save code touched; full suite green |

**Bugs found:** none.
**Recommendation:** **APPROVE.**

---

## Structure track — BACKLOG-378 Third zone spine

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Keeper crosses grove→Fernreach (east) and Fernreach→grove (west); bowl↔grove unchanged | **PASS** | e2e `cycle-085-third-zone` "the keeper walks grove → Fernreach → grove" (both `__tryCross` true, zone flips); `cycle-073-crossing` + `cycle-059-zones` green |
| 2 | Fernreach floor tint distinct from bowl (untinted) and grove | **PASS** | unit `cycle-085-third-zone`: `zoneTint(FERNREACH_ID)` = `FERNREACH_TINT` ≠ `GROVE_TINT` ≠ `0xffffff`; `drawFloor` uses `zoneTint(this.zoneId)` |
| 3 | Plaque tally shows three zones (▸ active); both-zone stores can show a third pile | **PASS** | e2e "the plaque tally lists all three zones"; `plaque.test` zone-tally updated to the 3-zone string; `zoneStores` maps over all `ZONES` |
| 4 | A `fernreach`-home dino renders/interacts only in the Fernreach (occupancy generalizes) | **PASS** | e2e migration case: after crossing, Rex is **not** in the grove view, **is** visible once `__setZone('fernreach')`; `inView` is zone-generic |
| 5 | Migration generalizes past two — a grove dino migrates **east** into the Fernreach | **PASS** | e2e "a grove dino migrates EAST into the Fernreach" (walks to the edge, crosses, home→fernreach, lands at the west entry x<96); unit `migrationStepTarget/crossEntryTile(GROVE_ID,…,'east')` |
| 6 | Bowl↔grove migration **behavior** byte-identical (optional-edge default) | **PASS** | helper bodies unchanged for the omitted-edge path; `cycle-073-crossing` + the cycle-084 migration-column assertions pass unmodified. *(Three specs had stale facts updated — see note.)* |
| 7 | No save-schema change | **PASS** | no `SAVE_VERSION` bump; `dinoZones` already persisted any zone id additively (old saves → bowl) |

**Note on the in-fire spec updates (criterion 6):** the *behavior* of the bowl↔grove pair is byte-identical
(every migration-column / `linkEdge` / `otherZone` assertion in `cycle-084-zone-adjacency` passes unchanged).
What changed is three now-**false** facts, because the adjacency table legitimately grew a third zone:
`cycle-084-zone-adjacency` (the `ZONE_LINKS` array is 4 rows; grove-east now resolves to the Fernreach),
`cycle-059-zones` (dropped the "grove-east is unlinked" line), and `plaque.test` (the tally lists all three
zones). These are truth-updates to assertions about the *world's shape*, not the relaxation of a behavioral
guard — the same pattern prior cycles used when a feature changed a neighbouring scenario (e.g. cycle 84
isolating 375 from 387).

**Bugs found:** none. (One e2e authoring fix during the Coder fire — the keeper-crossing case had to set the
player position and cross in a single `evaluate` so the Phaser update loop couldn't clamp the player back
inside the edge between calls; the real game crosses pre-clamp within one tick. Not a product bug.)
**Recommendation:** **APPROVE.**
