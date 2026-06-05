# Cycle 32 — QA

**Item:** BACKLOG-125 [social] Greeting the runner-up.

- **Build:** ✅ `npm --prefix game run build` clean (44 modules, 7.9s).
- **Unit tests:** ✅ `npx vitest run` — **202 passed** (26 files), incl. the new 5-test `repair (BACKLOG-125)` describe.
- **E2E tests:** ✅ `npx playwright test` — **67 passed** (full parallel run, no flake this time), incl. the 3 new `cycle-032-repair` specs.

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | After a jealous homecoming, `__pendingRepair()` returns the runner-up | PASS | e2e `…outsized bump and a 😊`: `__pendingRepair()` === `jealous.name` |
| 2 | No jealous runner-up → `__pendingRepair()` null | PASS | flag only set in `playHomecoming` under `hc.jealous`; cycle-031 "lone favorite" path leaves it untouched (stays null at boot) |
| 3 | Repair greet raises points by **more** than a normal greet | PASS | e2e: `repairDelta > normalDelta`, and `repairDelta - normalDelta === 6` (REPAIR_BONUS); unit `repairGain(t) > greetGain(t)` for warm/cold/none |
| 4 | Repair greet floats a bubble with the name + 😊 | PASS | e2e: `__bubbleTexts()` contains a string with the sulker name and `😊`; unit `repairLine` |
| 5 | Repair greet writes a distinct "noticed" memory | PASS | e2e `…distinct "noticed" memory`: `__memory()[sulker]` has an entry with `noticed` + name; unit `repairMemory` distinct from plain greet line |
| 6 | After repair, `__pendingRepair()` null + second greet only normal gain (one-shot) | PASS | e2e: pending null post-repair; second greet delta smaller by exactly REPAIR_BONUS |
| 7 | Greeting a non-target gives normal gain, leaves pending unchanged | PASS | e2e `…non-jealous dino leaves the pending repair untouched`: greet homecomer → `__pendingRepair()` still === sulker |
| 8 | Pure `repair.ts`, no Phaser/WebLLM; `repairGain > greetGain` | PASS | module imports only `friendship.ts` + `Personality` type; grep of `@mlc-ai/web-llm` outside `game/src/ai/` empty |
| 9 | Build clean; vitest green; playwright green | PASS | see top of report |

## Bugs found
None. Note: an *isolated* `npx playwright test cycle-032-repair` cold-run with the default 3 parallel
workers reds all three at `boot()` (`__ready` timeout) — three workers each cold-loading the 6 MB
webllm bundle starve the boot. `--workers=1` → 3/3 pass, and the **full** suite run (warm cache,
configured workers) is **67/67 green**. This is the documented parallel-load boot flake, not a
regression in the feature.

## Recommendation
**APPROVE** — all 9 criteria PASS, build + 202 unit + 67 e2e green, additive save, boundary intact.
