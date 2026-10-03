# Cycle 176 — QA

**Board:** `npm run build` clean. `npx vitest run` **3202 passed / 3 skipped** (304 files). `npx playwright test`
**867 passed, 0 failed** on the first full run (8.4 min). `@mlc-ai/web-llm` imported only under `game/src/ai/`.
Save untouched (no new field). CI on `main` before this cycle: last three runs `success`.

## Lore track — BACKLOG-395

| # | Criterion | Result |
|---|---|---|
| 1 | Unit: `admirers` keeps a friend at the bar, drops one below, never the pair, empty for strangers | PASS |
| 2 | Unit: `admireLine` / `admiredMemory` wording; `worldPlacedProps()` has `ADMIRE_ART_KEY` | PASS |
| 3 | E2E: friend near a production stand is a witness; bond rose; memory filed; ticker line | PASS (20/20 repeat) |
| 4 | E2E: same stand on strangers → `__lastAdmire()` null | PASS |
| 5 | E2E: zero console errors | PASS |

Finding on the way, and it was the feature: the spec's first draft pinned the witness list to `['Glade']` and
failed 7 of 20 repeats — on an all-bowl park Thornback (founding bond 16 with Mossback) was often standing in range
and admired the stand too. The spec now asserts Glade is among the witnesses and Twitch (a rival) is not.

## Structure track — BACKLOG-573 (+483)

| # | Criterion | Result |
|---|---|---|
| 1 | Unit: no sheet row (all 14) intersects an action button or the stick; disjoint, on-canvas | PASS |
| 2 | Unit: first column nine rows at pitch 35; `export` heads column two | PASS |
| 3 | Unit: each builder round-trips through `hatchPattern`; manner and pecking count builder output | PASS |
| 4 | E2E: sheet-column + touch-controls specs green; full suite green | PASS |

`cycle-173-sheet-columns` failed twice on the very first targeted run (cold Vite, run beside a fresh spec) and
passed 3/3 immediately after and in the full run — the known cold-boot flake, not the geometry.

**11/11 criteria pass.**
