# Cycle 97 — QA

**Result: APPROVE both tracks.**

- **Build:** clean (`npm run build`, type-check passes).
- **Unit:** `npx vitest run` → **1078/1078** (+14: 7 hunger-voice, 7 carry-pressure).
- **E2E:** `npx playwright test` → **322/322**, zero flakes on the green run.
- **WebLLM boundary:** grep confirms `@mlc-ai/web-llm` imported only under `game/src/ai/`.
- **Saves:** additive — neither track adds or changes a save field (piles + needs already persist).

## BACKLOG-368 — Hunger in the voice (lore)

| # | Criterion | Verdict |
|---|-----------|---------|
| 1 | `pressingNeed === 'hunger'` → aside appended to the greeting | PASS (unit + e2e) |
| 2 | Sated / thirst-pressing dino → byte-identical, no aside | PASS (unit sated; e2e sated + thirsty-not-hungry controls) |
| 3 | Aside temperament-shaded (prickly/warm/even, distinct) | PASS (unit) |
| 4 | Composes with every register (gratitude/wistful/fond/generic) | PASS (unit) |
| 5 | Deterministic under stub/fallback; LLM only colours | PASS (headless has no WebGPU → canned path exercised) |
| 6 | No save change; WebLLM under ai/ | PASS |

## BACKLOG-429 — Zone carry pressure (structure)

| # | Criterion | Verdict |
|---|-----------|---------|
| 1 | Over soft cap + lighter dest → sheds up to PRESSURE_CARRY glut kinds | PASS (unit + e2e "sheds two") |
| 2 | At/under cap → byte-identical single directed carry | PASS (unit == directedCarry; e2e "carries just one") |
| 3 | Over cap + heavier/equal dest → no boost | PASS (unit) |
| 4 | Lossless + cap-safe (per-unit dest cap recheck) | PASS (unit cap-safe + supply-bound) |
| 5 | Pure in resource.ts; WorldScene only applies | PASS |
| 6 | Additive save; build+tests green | PASS |

## Notes

- **Cold-boot flake (catalogued):** the first parallel run of the new specs timed out at `__ready`
  (cold Vite/Phaser warmup, BACKLOG-431 class); all passed on the warm re-run and isolated.
- **`cycle-065-gather-grace` flaked once** under full parallel load (resource grace timing), passed
  isolated and on the clean full re-run — the known parallel-load flake, off this diff (resource.ts grace
  logic untouched), **not a regression**.
- **QA hardening:** the carry-pressure e2e first asserted on the *source* (bowl) total, which drifts as
  bowl dinos gather during the 40 crossing steps (ambient spawn is not frozen by 431). Re-pointed both
  assertions at the **grove destination** (empty at boot, only Rex's carry adds to it) — deterministic.
  The production logic was correct; only the test's observation point was flaky.
