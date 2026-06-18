# Cycle 56 — QA

**Item:** BACKLOG-251 [emergent] Gratitude fades.

- **Build:** ✅ clean (`npm --prefix game run build`, built in 9.01s).
- **Unit tests:** ✅ 500 passed (48 files; was 494, +6 new in `cycle-056-gratitude-fades.test.ts`).
- **E2E tests:** ✅ 179 passed in one fresh full run, no flake (was 178; +1 new). Free-port done first.
  - New `cycle-056-gratitude-fades.spec.ts` green (test 166).
  - Regression guards green: both `cycle-055-thanks-voice.spec.ts` specs (164/165), every cold/relief
    seam spec (cycle-049→055) green untouched.

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Newest memory = `gratefulMemory(clearer)` → still named (247 regression) | PASS | unit "still names the clearer when the grateful memory is the newest entry"; e2e fresh-greet phase names `Twitch` |
| 2 | Clearer named while grateful memory inside the fresh window | PASS | unit "still names the clearer while … inside the fresh window" (WINDOW-1 newer on top) |
| 3 | `null` once ≥ `GRATITUDE_FRESH_WINDOW` newer memories bury it, though still in ring | PASS | unit "quiets once exactly … newer memories bury it — but the memory remains" (asserts `toContain(mem)` + null) |
| 4 | `GRATITUDE_FRESH_WINDOW` exported, positive int ≤ 6 | PASS | unit "is a positive integer no larger than the memory ring (6)" |
| 5 | All five existing cycle-055 `whoClearedMyName` assertions still pass unchanged | PASS | `cycle-055-thanks-voice.test.ts` unmodified, green in the 500-unit run |
| 6 | E2E: fresh cleared dino, greeted, surfaces the thanks (names clearer) | PASS | e2e fresh phase: reply `toContain('Twitch')`, `__greetPrompt` `toContain('cleared your name')` |
| 7 | E2E: after WINDOW+ newer memories, greeted again, no clearer named | PASS | e2e faded phase: reply not `Twitch`/`I owe them one`, prompt not `cleared your name`, no console errors |
| 8 | build / vitest / playwright all green | PASS | above |
| 9 | No save change; no new dep; web-llm only under `game/src/ai/` | PASS | diff is `cold.ts` + 2 tests; grep `@mlc-ai/web-llm` → only `ai/webllmBrain.ts` + `ai/webllm.worker.ts` |

## Bugs found
None. The diff is minimal and surgical (one const + one loop bound + doc); no regression surfaced in
the full e2e run, no flake on the fresh run.

## Recommendation
**APPROVE.** 9/9 criteria pass, build + 500 unit + 179 e2e green in one clean run, the 247 happy path
holds as the regression guard, boundary intact, no save change.
