# Cycle 29 — QA

**Item:** BACKLOG-106 [emergent] Offline catch-up ("while you were away").

## Results
- **Build:** ✅ `npm run build` clean (tsc -b + vite build, 40 modules).
- **Unit tests:** ✅ `npm run test:unit` — **170 passed** (was 157; +13 new in `away.test.ts`).
- **E2E tests:** ✅ effectively **58 passed**. First full parallel run reported 52 passed / 6 failed — all 6 were `__ready` boot timeouts in `cycle-002-daynight` (2) and `cycle-003-save` (4), the **documented parallel-load flake**. Re-run isolated (`--workers=1`): **7/7 green** including the whole cycle-003 save round-trip. Not a regression. The two new cycle-029 specs passed on the full parallel run.

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `awayMinutes` 0 on undefined savedAt / now≤saved; else `floor(realMs*scale/60000)` | PASS | `away.test.ts` "awayMinutes" block (5 cases, incl. invalid-scale→1×) |
| 2 | `fastForward` 0 elapsed → unchanged state, empty digest | PASS | `away.test.ts` "no-ops when no time elapsed" |
| 3 | clock advances by exactly the (capped) elapsed minutes | PASS | "advances the clock by exactly the elapsed in-game minutes" (abs-minute check) |
| 4 | companion pair (bond ≥ 8) drifts `min(DRIFT*days, MAX_DRIFT)`; sub-threshold untouched | PASS | "drifts companion pairs…", "caps total drift…", "leaves sub-threshold pairs untouched" |
| 5 | both companions gain a "kept each other company" memory | PASS | "records a 'kept each other company' memory for both companions" |
| 6 | over-cap gap → `capped:true`, minutes clamped to 7 days, digest names it | PASS | "caps the simulated span and flags it" |
| 7 | E2E: bond Rex↔Glade, `__catchUp` 3 days → bond +6, digest has "grew closer" + duration | PASS | `cycle-029-away.spec.ts` test 1 (days===3, Glade\|Rex 8→14, digest length>1) |
| 8 | E2E: fresh boot, no save → no homecoming digest | PASS | `cycle-029-away.spec.ts` test 2 (`__awayDigest()` === []) |
| 9 | build clean; suites green; `@mlc-ai/web-llm` only under `game/src/ai/` | PASS | build/test above; grep below |

### Boundary check
`@mlc-ai/web-llm` import audit:
```
$ grep -rl "@mlc-ai/web-llm" game/src
game/src/ai/webllmBrain.ts
game/src/ai/webllm.worker.ts
```
Both under `game/src/ai/`. `world/away.ts` imports only `clock`, `social/bonds`, `ui/lenses`, `ai/memory` — pure, no Phaser/WebLLM. Boundary intact.

## Bugs found
None. The save round-trip (cycle-003) — the path most at risk from the restore rewrite — is fully green: an immediate reload has ~0 elapsed, so the catch-up no-ops and no spurious "While you were away" panel appears.

## Recommendation
**APPROVE.**
