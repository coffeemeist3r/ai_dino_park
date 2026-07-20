# Cycle 106 — QA

**Verdict: PASS both tracks.**

| Gate | Result |
|---|---|
| `npm run build` (tsc -b + vite build) | **clean** |
| `npx vitest run` (root config) | **1217 / 1217** (134 files, +6 this cycle) |
| `npx playwright test` | **359 / 359** (no flake; +2 this cycle) |
| `@mlc-ai/web-llm` boundary | intact — no new import; `crossDino` change is pure world logic |
| Save shape | additive — reuses live `foodPileByZone` (446); no envelope change |

## Structure track — BACKLOG-447: Food flows between zones

| Acceptance criterion | Result |
|---|---|
| `pickFoodCarry` returns the wanted id when directed + src has it + dest lighter | PASS (unit — "prefers the wanted id") |
| falls back to most-stocked lighter-in-dest id when no want / want not banked / want not lighter | PASS (unit — "glut → lighter fallback", "prefers the wanted id" fallbacks) |
| `null` when src empty / dest fuller of every id / all dest-capped | PASS (unit — "moves nothing toward equal-or-fuller / capped / empty") |
| pure + deterministic (FOODS-order tie-break, no mutation) | PASS (unit — "is pure and deterministic") |
| crossing bowl→grove moves exactly one unit, bowl −1 / grove +1, ticker names it | PASS (e2e — food-flow spec 1) |
| a crossing with no source surplus moves nothing, no ticker line | PASS (e2e — food-flow spec 2) |
| instant `__migrate`/`relocate` path carries nothing (parity) | PASS (by construction — food carry is inside `crossDino`, not the instant paths; cycle-073 parity spec still green) |

## Lore track — BACKLOG-451: The courier's pride

| Acceptance criterion | Result |
|---|---|
| `courierMemory` names food emoji + dest zone; `courierLine` = 📦 | PASS (unit — "the courier's pride") |
| a ferrying crossing shows the 📦 beat + files the courier memory | PASS (e2e — spec 1 asserts the `carried food to` ticker + Rex's `…ran short` memory) |
| a no-ferry crossing files no courier memory / shows no 📦 | PASS (e2e — spec 2 asserts neither) |
| deterministic under stub/fallback; memory is the only greeting hook (no NPCBrain surface change) | PASS — the beat is pure `crossDino` logic; the memory rides the existing `recall → recentMemory → greet` path, no new greet field, boundary untouched |

## Notes
- One shared seam (`crossDino`), one pure module (`foodstore.ts`), one new e2e spec — matches the plan exactly.
- Food carry is a lean (one unit per crossing), flagged `// ponytail:` with the pressured-shed upgrade path;
  intentional, not a gap.
- No screenshots needed (no visual-regression surface; the beat is a ticker line + a transient bubble already
  covered by the movement/bubble machinery).
