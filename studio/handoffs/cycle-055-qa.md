# Cycle 55 — QA

**Item:** BACKLOG-247 [social] Thanks in the voice

- **Build:** ✅ `npm --prefix game run build` clean (type-check passes; 9.2s).
- **Unit tests:** ✅ 494 passed (was 485; +9 from `cycle-055-thanks-voice.test.ts`).
- **E2E tests:** ✅ 178 passed (was 176; +2 from `cycle-055-thanks-voice.spec.ts`) in one fresh full
  run, 3.0m, **no flake** (no boot-timeout this run).

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `whoClearedMyName` returns clearer when first-hand memory present, null otherwise | PASS | unit "returns the clearer…" / "returns null when…" |
| 2 | ignores hearsay; returns most-recent clearer with multiple | PASS | unit "ignores rumor-marked hearsay…" / "returns the most-recent clearer…" |
| 3 | round-trips the exact `gratefulMemory(clearer)` string | PASS | unit "round-trips the exact string gratefulMemory produces" |
| 4 | `cannedReply` names the clearer with gratitude set; normal greeting without | PASS | unit "cannedReply names the clearer…" / "…returns a normal greeting…" |
| 5 | `buildMessages` includes clearer in system prompt with gratitude; unchanged without | PASS | unit "buildMessages folds the clearer…" / "…unchanged (no clearer)…" |
| 6 | E2E: planting `Twitch cleared my name` on Mossback + greeting names Twitch | PASS | e2e "a just-cleared dino names who cleared its name when greeted" (reply contains Twitch + prompt contains Twitch/"cleared your name") |
| 7 | E2E: a dino with no cleared-name memory names no clearer | PASS | e2e "a dino with no cleared-name memory greets without naming any clearer" |
| 8 | build clean; unit green; e2e green | PASS | 494 unit / 178 e2e, build clean |
| 9 | no save-format change; no new dep; web-llm only under `game/src/ai/` | PASS | diff is cold.ts/brain.ts/webllmBrain.ts/WorldScene.ts + 2 tests; no `SAVE_VERSION` touch; no package.json change; boundary grep clean (below) |

## Boundary check
`@mlc-ai/web-llm` imports remain only under `game/src/ai/` (webllmBrain.ts dynamic imports). The
new `cold.ts` parser imports nothing from `ai/` beyond `memory` (pre-existing); `brain.ts` does not
import `world/cold.ts` — dialogue text stays in the brain layer as the plan required.

## Bugs found
None. No console errors in either new e2e (asserted in the first spec). Control test confirms the
non-grateful greet path is byte-unchanged (cycle-035 tones specs all green).

## Recommendation
**APPROVE** — all 9 criteria pass; full suite green in a single fresh run, no flake.
