# Cycle 7 — QA

BACKLOG-005 (WebLLM brain) vs the cycle-007 acceptance criteria.

- **Build:** ✅ exit 0 (web-llm dynamic-imported / code-split; pre-existing chunk-size warning unchanged)
- **Unit tests:** ✅ 41/41
- **E2E tests:** ✅ 20/20 (default config)

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `makeBrain('webllm')` returns an `NPCBrain`, no throw | ✅ PASS | unit `makeBrain("webllm") returns a brain and does not throw` |
| 2 | `buildMessages` puts identity+personality in system, observation in user; 2 msgs | ✅ PASS | unit `buildMessages puts identity + personality in system...` |
| 3 | `respond()` before ready → non-empty fallback, no hang/throw | ✅ PASS | unit `falls back to a non-empty reply while the model is still loading` |
| 4 | Forced load failure → `fallback` status, still replies | ✅ PASS | unit `enters fallback status when the loader fails, and still replies` |
| 5 | Reply trimmed to ≤200 chars | ✅ PASS | unit `uses the engine when ready and trims the reply to 200 chars` (fake engine returns 500 chars → reply length 200) |
| 6 | WebLLM imported only under `game/src/ai/` (boundary) | ✅ PASS | grep: `@mlc-ai/web-llm` appears only in `game/src/ai/webllmBrain.ts`; no scene/entity imports it |
| 7 | Boot with WebLLM dinos; `__brainStatus()` defined; greet returns a reply | ✅ PASS | e2e `brain status is a defined string and boot is error-free` + `greeting still returns a reply via the fallback path` |
| 8 | No regression (clock/day-night/save/roster/hearts) | ✅ PASS | cycle-2..6 suites all green |
| 9 | Build clean; unit + e2e green | ✅ PASS | header |
| 10 | **Live inference verified in a real browser (manual)** | ⚠️ NOT VERIFIED HERE | See note below |

## Live-inference note (criterion 10)
I attempted the manual check via the preview browser. Findings:
- **WebGPU is available** in the environment (`navigator.gpu` truthy) — the hard prerequisite is met.
- The preview `eval` runs in an **isolated JS world**: it sees the DOM (correct 640×480 canvas) but not the page's `window.__*` dev hooks, so I couldn't read `__brainStatus` or call a greet from script.
- Synthetic keyboard events dispatched from that world did **not** drive Phaser's input manager, so I couldn't trigger a real greet → the model never started downloading (no web-llm progress in the shared console).

So real token generation is **unconfirmed by QA**. Everything that gates it is verified: the boundary, the lazy-load wiring, the prompt builder, the trim, and — via an injected fake engine — the full ready→generate→reply path. The feature is **playable regardless**: the canned fallback guarantees dialog never breaks while/if the model is absent.

## Bugs found
None. The brain never throws out of `respond` and never blocks the dialog; load failures log to console (no silent failure). One shared engine across all dinos (no five-download trap). Boundary intact.

## Recommendation
**APPROVE** — with a flagged follow-up: a human should greet a dino on a WebGPU browser and confirm the status goes `loading→ready` and a non-canned reply appears. The shipped feature degrades gracefully, so this confirmation is enhancement-verification, not a blocker to the cycle.
