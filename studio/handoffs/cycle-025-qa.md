# Cycle 25 — QA — BACKLOG-059 Feeding hatch

- **Build:** ✅ `npm run build` clean (vite, 36 modules; pre-existing chunk-size warning only).
- **Unit tests:** ✅ `npx vitest run` — **134 passed** / 20 files (125 prior + 9 new `feeding.test.ts`).
- **E2E tests:** ✅ `npx playwright test` — **50 passed** (48 prior + 2 new `cycle-025-feeding`). Clean single full run, **no flake** this cycle (the cycle-024 parallel-load flake was killed by the `c548974` scene-ready boot gate).
- **web-llm boundary:** ✅ only `game/src/ai/webllmBrain.ts` and `game/src/ai/webllm.worker.ts` import `@mlc-ai/web-llm`.
- **Save format:** ✅ unchanged (food is an ephemeral event, never serialized) → old saves load untouched, additive-only honored trivially.

## Acceptance criteria

| Criterion | Status | Evidence |
|---|---|---|
| H / `__dropFood()` creates exactly one 🍖; a second press while food is present is ignored | PASS | e2e "only one piece of food is in play at a time" — second `__dropFood(19)` returns the first's tile (col 0), not col 19. `dropFood()` early-returns when `this.food` set. |
| `__dropFood(col)` lands at the clamped column; `__food()` returns the tile while pending, null after eaten | PASS | unit `foodLanding` (col honored + clamped -3→0, 999→19); e2e asserts `__food()` non-null right after drop, null after the swarm consumes it. |
| Drop near the cast + a few `__stepWorld` → eaten and some dino gains ≥1 friendship pt + a feed memory | PASS | e2e "dropped food gets swarmed and eaten": `eaten===true`, `fedSomeone===true` ("snapped up the food" in `__memory()`). |
| An energetic, in-range dino steps **toward** the food (distance strictly decreases) | PASS | unit `feedStep` (distance shrinks); live: Rex (energy 0.54) rushes onto the food from (10,7)→(10,6) and eats on step 1. |
| An out-of-range / too-calm dino does **not** rush (`reactionToFood` → ignore) | PASS | unit `reactionToFood`: out-of-range ignore for any energy; in-range energy 0.1 → ignore (Mossback 0.24 / Twitch 0.33 are calm). |
| Drop + eat each append a 🍖 line to `__events()` | PASS | e2e asserts `droppedLogged` ("food dropped") and `ateLogged` ("snapped up the food") both true. |
| No new framework; boundary intact; build + vitest + playwright green | PASS | see header rows. |

## Bugs found
None. No `pageerror` during the feeding e2e. No regressions in the prior 48 e2e / 125 unit.

## Recommendation
**APPROVE.** All 7 acceptance criteria PASS; full quality bar green; the feature is playable end-to-end (press H → food falls → cast swarms → first dino eats, with a 😋 flash, a hearts bump, a gossip-able memory, and Park-News ticker lines).
