# Cycle 27 — QA — BACKLOG-061 Food favorites

**Build:** ✅ `npm run build` clean (tsc -b + vite). `@mlc-ai/web-llm` stays in its own worker chunk.
**Unit tests:** ✅ `npx vitest run` — **148 passed** (22 files; +9 vs cycle 26: 6 in `foods.test.ts`, 3 favorite-rush cases in `feeding.test.ts`).
**E2E tests:** ✅ `npx playwright test` — **54 passed** on a clean full run (+2: `cycle-027-favorites.spec.ts`).

> Flake note: the first full e2e run failed 5 specs (cycle-002 ×2, cycle-003 ×3) on `__ready` timeouts — the documented parallel-load flake (heavy webllm bundle booting across workers). All five pass isolated (`--workers=1`, 9/9 incl. cycle-027) and the subsequent fresh full run was 54/54 green. Neither spec touches feeding; not a regression. The 6th first-run failure was a genuine bug in the *new* test (a `hearts > 0` assertion against the coarse 0–10 heart scale, where one 9-point feed still rounds to 0 hearts) — fixed in QA by asserting the feed memory instead; the feature itself was correct.

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `favoriteFood` deterministic per personality; ≥3 distinct favorites across the cast | ✅ PASS | `foods.test.ts` "deterministic" + "spans at least three distinct foods" (founders → meat/berries/greens) |
| 2 | `foodReaction` favorite → `{favorite, FEED_GAIN_FAV, 😋}`, else `{ , FEED_GAIN, 🙂}`, `FEED_GAIN_FAV > FEED_GAIN` | ✅ PASS | `foods.test.ts` "loves its favorite" / "plain feed" / "strictly bigger" |
| 3 | `reactionToFood(...,true)` rushes a calmer & a farther dino that the generic call ignores; 2-arg behavior unchanged | ✅ PASS | `feeding.test.ts` favorite cases + the unchanged 2-arg cases all green |
| 4 | Drop a dino's favorite in its lane, step → some dino fed + "favorite" memory; favorite gain path exercised | ✅ PASS | `cycle-027-favorites` test 1: `eaten`, `eaterFed`, `eaterMemHasFavorite === (eaterFav===dropped)`; gain magnitude unit-tested (AC2) |
| 5 | Non-favorite food eaten as plain feed (no "favorite" memory), `FEED_GAIN`; both memories keep "snapped up the food" | ✅ PASS | `cycle-027-favorites` test 2 (fish, nobody's favorite) + `cycle-025-feeding` still green |
| 6 | Drop log keeps "food dropped", eat log keeps "snapped up the food" (cycle-25 guard) while naming the food | ✅ PASS | `cycle-025` `droppedLogged`/`ateLogged` + `cycle-027` both green; new strings append flavor, keep substrings |
| 7 | `__favoriteFood(name)` + `__dropFood(col?, foodId?)` hooks present | ✅ PASS | exercised throughout `cycle-027-favorites.spec.ts` |
| 8 | No new framework; web-llm only under `game/src/ai/`; save unchanged; build+vitest+playwright green | ✅ PASS | `grep` boundary clean; no save-format touch (food ephemeral); 148 unit + 54 e2e green |

## Bugs found
- None beyond the in-test assertion bug noted above (own test, fixed in QA). No production regression: feeding swarm/eat spine intact, save format untouched, day/night & save specs green isolated and in the clean full run.

## Recommendation
**APPROVE.** All 8 acceptance criteria PASS; build green; 148 unit + 54 e2e green; CHARTER boundary intact; diff is exactly the 6 planned files with no scope creep.
