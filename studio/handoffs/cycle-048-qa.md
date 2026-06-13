# Cycle 48 — QA

**Item:** BACKLOG-208 — Nobody came

**Build:** ✅ `npm --prefix game run build` clean (type-check passes, 9.07s).

**Unit tests:** ✅ 424 passed (44 files) — +3 in `cold.test.ts` (BACKLOG-208 describe).

**E2E tests:** ✅ 160 total green. A fresh full parallel run reported 154 passed / 6 failed; the 6 are the **catalogued cold-boot parallel-load flake** (early specs `cycle-002-daynight`, `cycle-003-save`, `controls-help` timing out on `__ready` under parallel Vite/Phaser cold-load — see the e2e-boot-flake note). Re-run isolated single-worker: **10/10 green**. The two new `cycle-048-nobody-came` specs passed in the full run *and* isolated (2/2). No regression — every failure was a boot timeout, not an assertion.

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `cold.ts` exports `neglectMemory()` containing "nobody came" | PASS | unit "the neglect memory names the hurt" |
| 2 | the three cold memories pairwise distinct | PASS | unit "the three cold memories are pairwise distinct" |
| 3 | unmended funk files `neglectMemory()` at the dusk edge | PASS | e2e "nobody came…": `mem` includes "nobody came" after crossDusk |
| 4 | a warmed dino gets no neglect memory | PASS | e2e "the warmed dino is spared": warmedHasNeglect === false |
| 5 | the neglect note surfaces in the next greet prompt | PASS | e2e: `__greetPrompt(name)` contains "nobody came" |
| 6 | the morning cold memory still present — compounds | PASS | e2e: `stillColdNote` (includes "slept alone") === true |
| 7 | the 🥶 funk is gone after dusk thaw | PASS | e2e: `__coldPending()` === [] in both specs |
| 8 | save persists the note; no `SAVE_VERSION` bump | PASS | save fires on the dusk edge (guarded); empty diff on save shape — neglect rides the already-persisted memory store; no new fields |
| 9 | no-funk dusk edge files nothing / no churn | PASS | branch guarded by `coldPending.size`; the summer-morning path in cycle-047 spec (still green) proves an empty pending dusk does nothing |
| 10 | sentries green: cycle-043 cold + cycle-047 warmth | PASS | both untouched and green in the full run; the cycle-047 silent-thaw test (warm-memory-specific assertion) holds unmodified |

**Bugs found:** none. The neglect note correctly lands only on dinos still in the funk set; warmed dinos (greet path tested) are spared; both notes coexist in the ring buffer and the most-recent surfaces in the prompt.

**Boundary / save:** `world/cold.ts` stays pure (no Phaser); `@mlc-ai/web-llm` not touched; no save-format change (the memory store was already persisted); NPCBrain not in play.

**Recommendation:** APPROVE.
