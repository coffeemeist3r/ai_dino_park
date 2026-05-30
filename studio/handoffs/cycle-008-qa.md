# Cycle 8 — QA

BACKLOG-048 (in-character dino dialogue) vs the cycle-008 acceptance criteria.

- **Build:** ✅ exit 0 (pre-existing chunk-size warning only)
- **Unit tests:** ✅ 46/46
- **E2E tests:** ✅ 20/20

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `buildMessages` system forbids assistant behavior + has name/species/persona | ✅ PASS | unit `buildMessages forbids assistant behavior and includes identity + a one-shot example` (matches `/not an ai|never offer help|never ask how you can assist/i`) |
| 2 | `buildMessages` includes a one-shot example (≥4 msgs: system/user/assistant/user) | ✅ PASS | same test (asserts length ≥4 and the role sequence) |
| 3 | `cleanReply('"Hello there!"')` → `Hello there!` (quotes stripped) | ✅ PASS | unit `strips wrapping quotes` |
| 4 | `cleanReply` removes assistant boilerplate / assist-AI wording | ✅ PASS | unit `drops assistant-voice entirely` (no `/assist|\bai\b/i`) |
| 5 | `cleanReply` returns only the first sentence, ≤200 | ✅ PASS | unit `keeps only the first sentence` (`I love this sunny rock.`) |
| 6 | `cleanReply` leaves clean in-character text unchanged | ✅ PASS | unit `leaves a clean in-character line unchanged` (`Hi, I am Rex.`) |
| 7 | `generate()` runs output through `cleanReply` (fake engine) | ✅ PASS | unit `cleans assistant-speak out of a ready reply, falling back...` — fake returns `"Sure! How can I assist you today? I am an AI."` → reply is quote-free, no assist/AI, non-empty (fell back to a canned dino line) |
| 8 | No regression (fallback/boundary/boot + cycle-2..7 suites) | ✅ PASS | 20/20 e2e; grep confirms web-llm only in `webllmBrain.ts` |
| 9 | Build clean; unit + e2e green | ✅ PASS | header |
| 10 | **Human re-greet reads in-character (manual)** | ⏳ PENDING HUMAN | the operator already reported the *old* prompt gave help-desk replies; needs one more greet on this build to confirm the new prompt + cleaner read as a dinosaur |

## Bugs found
None. The prompt change + `cleanReply` are pure and well-tested; the cleaner is a deterministic backstop so even an off-generation can't surface "how can I assist you today?" — worst case it falls back to a canned dino line. Boundary intact, fallback path unchanged, no new deps.

## Recommendation
**APPROVE** — with the same kind of human follow-up as cycle 7: greet a dino on this build and confirm the voice. The deterministic guardrail means the help-desk text is gone regardless of model behavior; the prompt rewrite aims to make the *generated* text genuinely dino. If the human still sees assistant-voice slip through, that's a fast follow-up (extend the `ASSISTANT_TELL` list or strengthen the one-shot), not a structural problem.
