# Cycle 179 — QA

Board: `npm run build` clean; `npx vitest run` **3255 passed / 3 skipped** (310 files); `npx playwright test` **880/880**
on the first full run (10.2 m). Boundary: `@mlc-ai/web-llm` imported only under `game/src/ai/` (grep empty elsewhere).
The first isolated run of the two minds specs timed out on boot (cold Vite — the known boot flake); the rerun was 7/7.

## Lore track — BACKLOG-585

| # | Criterion | Result | Evidence |
|---|---|---|---|
| L1 | Four days, four different lines | PASS | unit `different days, different people, different lines` |
| L2 | Same-bucket variants differ; a `went` day leads with the place | PASS | unit `two dinos with the same day can sound different`, `a day with a destination leads with it` |
| L3 | Founding `said` + book quote | PASS | e2e `the founding yesterday has a voice, and the book quotes it` |
| L4 | Crossing 17:00 files `said` everywhere and a line is live in a bubble | PASS | e2e `at dusk every dino says how its day went` |
| L5 | Parse keeps string `said`, drops junk, absence stays absent | PASS | unit `save parse keeps a spoken line and a place…` |
| L6 | `reflect` only on the WebLLM brain; boundary holds | PASS | `brain.ts` optional member, `webllmBrain.ts` impl; grep |

## Structure track — BACKLOG-586

| # | Criterion | Result | Evidence |
|---|---|---|---|
| S1 | `planPlace` rules | PASS | unit `a restless phase names a neighbour…`, `a forage phase goes where the food is…`, `social and solitary leans stay put…` |
| S2 | Fresh boot: `__errand()` launches a forage/restless dino, 🧭 in the ticker | PASS | e2e `a fresh park: a forage or restless dino sets off for another ground on purpose` |
| S3 | One errand per dino per phase | PASS | e2e `one errand per dino per phase, and a ground keeps its last resident` (20 ticks, no repeats) |
| S4 | Last resident stays | PASS | same spec — Ember (the Ridge's only resident, restless) never leaves |
| S5 | Book `heading:` | PASS | S2 spec asserts `heading: ` in the book |
| S6 | Build/unit/e2e green; save additive | PASS | board above; `said`/`went` optional, no version bump |

**12/12 criteria pass.** Also checked: the CI run on `main` that went red after cycle 178 (`cycle-028-realtime`, 61/62
vs 60 on Linux) — the spec now pumps before its baseline; passes locally inside the 880.
