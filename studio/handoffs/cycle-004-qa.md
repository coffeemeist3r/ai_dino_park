# Cycle 4 — QA

BACKLOG-010 (NPC personality traits) vs the cycle-004 acceptance criteria.

- **Build:** ✅ exit 0 (pre-existing chunk-size warning only)
- **Unit tests:** ✅ 26/26 (2 brain + 6 clock + 6 dayNight + 6 saveGame + 6 personality)
- **E2E tests:** ✅ 12/12 (default config)

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `seededPersonality('Rex')` deterministic; 5 axes numbers in [0,1] | ✅ PASS | unit `seededPersonality › is deterministic and bounded` |
| 2 | Two names produce different traits | ✅ PASS | unit `differs between two names` (Rex vs Mossback) |
| 3 | `describePersonality` high curio/social/brave → curious/social/bold, not opposites | ✅ PASS | unit `names the dominant poles` |
| 4 | All-0.5 personality → defined non-empty fallback | ✅ PASS | unit `falls back to even-tempered` |
| 5 | Stub mood: timid → wary; social+warm → happy | ✅ PASS | unit `a timid dino replies wary`, `a social, warm dino replies happy` |
| 6 | No-traits stub still non-empty + neutral (back-compat) | ✅ PASS | existing `brain.test.ts` (2/2) unchanged + green |
| 7 | `__dinoTraits()` → 5 numeric axes in [0,1] | ✅ PASS | e2e `first dino exposes 5 numeric personality axes in [0,1]` |
| 8 | No regression: Z dialog + clock/day-night/save | ✅ PASS | e2e `talking to Rex still returns a reply`; full smoke + cycle-002/003 suites green |
| 9 | Build clean; unit + e2e green | ✅ PASS | header |

## Bugs found
None. `personality.ts` is pure and Node-tested; traits ride the existing `NPCContext` so the NPCBrain boundary is intact (no inference backend imported). `traits` is optional throughout — the two pre-existing brain tests pass untouched. No new dependencies.

## Recommendation
**APPROVE.**
