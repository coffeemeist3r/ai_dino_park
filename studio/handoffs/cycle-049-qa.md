# Cycle 49 — QA

**Item:** BACKLOG-185 — Word of the cold

**Build:** ✅ `npm --prefix game run build` clean (built in 9.0s; only the pre-existing >500 kB chunk advisory).

**Unit tests:** ✅ 438 passed / 45 files (`npm run test:unit`), +7 from the new `word of the cold (BACKLOG-185)` block.

**E2E tests:** ✅ 164 total green. Full parallel run reported 159 passed / 5 failed; all 5 failures were `boot()` 30s timeouts on early specs (`controls-help` ×3, `cycle-002-daynight`, `cycle-003-save`) — the catalogued cold-boot parallel-load flake, not a regression. Re-run isolated single-worker, **all 5 plus both new cycle-049 specs plus both cycle-020 gossip specs passed 14/14 (11.8s)**. The new feature specs were green in the parallel run too.

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Cold-slept speaker: `__spreadColdWord` returns non-null + plants the line on listener | ✅ PASS | unit "a cold-slept speaker plants the word on the listener and returns it"; e2e cycle-049 test 1 (`__rememberCold`→`__spreadColdWord('Mossback','Sunny')` non-null, `__memory().Sunny` contains the cold word) |
| 2 | Speaker with no cold memory → `null` (falls back to generic gossip) | ✅ PASS | unit "a speaker with no cold memory passes nothing"; e2e cycle-049 test 2 (`__spreadColdWord('Rex','Sunny')` null) |
| 3 | One hop: a heard cold word can't re-spread as fresh cold news | ✅ PASS | unit "the heard word is one hop"; e2e cycle-049 test 1 (`__spreadColdWord('Sunny','Glade')` null) |
| 4 | Cold word distinct ≠ cold/neglect/warm memory + ≠ generic retell; `isShareable`→false | ✅ PASS | unit "the cold word names the speaker, carries the rumor mark, and cannot re-spread"; unit "distinct from every first-hand cold memory and from the generic retell" |
| 5 | Cold token is a real substring of `coldMemory()` | ✅ PASS | unit "the cold-news token is a real substring of the cold memory" |
| 6 | `converse` logs the 🥶 cold-word line when speaker slept cold; generic 🗣️ otherwise | ✅ PASS | code inspection of `converse` (WorldScene): `cold.rumor` branch fires `🥶 … heard about … cold night`, else the unchanged `🗣️` line — the branch is reachable because `spreadColdWord` returns non-null for a cold-slept speaker (proven in AC1) |
| 7 | Generic gossip byte-unchanged for non-cold memories (cycle-020 green) | ✅ PASS | both cycle-020 gossip specs green (isolated rerun); e2e cycle-049 test 2 asserts `__spreadGossip` still returns a `told me:` rumor |
| 8 | Build clean; suites green; no `SAVE_VERSION` bump; no web-llm outside `game/src/ai/` | ✅ PASS | build ✅; 438 unit / 164 e2e ✅; `git diff` touched no save files; boundary grep clean (no `web-llm` outside `game/src/ai/`) |

## Bugs found

None. No regressions in the diff — the change is additive (a new cold-first branch in `converse`, three pure functions, three dev hooks); the generic `spreadGossip` is untouched and pinned green by cycle-020.

## Recommendation

**APPROVE** — 8/8 criteria pass on a clean build, 438 unit / 164 e2e green (5 catalogued cold-boot flakes, all green isolated). No save change (ninth-plus cycle running), no deps, NPCBrain not in play, boundary intact.
