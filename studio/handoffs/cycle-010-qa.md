# Cycle 10 — QA

BACKLOG-049 (Web Worker offload + brain observability) vs the cycle-010 acceptance criteria.

- **Build:** ✅ exit 0 — web-llm code-split into a separate worker chunk (the offload is real)
- **Unit tests:** ✅ 55/55
- **E2E tests:** ✅ 24/24

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `Reply.source`; canned→'canned', model→'llm' | ✅ PASS | unit `a ready model reply is tagged llm; a not-ready reply is canned` + `cannedReply is tagged canned` |
| 2 | Not-ready `respond()` → source 'canned' | ✅ PASS | same unit (loading brain → canned) |
| 3 | Brain-status HUD reflects `__brainStatus()` | ✅ PASS | e2e `brain status hook reports a known state`; HUD built in `setupBrainHud`, refreshed on tick |
| 4 | Dialog prefixes 🧠 on generated lines only | ✅ PASS | unit `replyPrefix('llm')==='🧠 '`, `replyPrefix('canned'/undefined)===''`; wired at the `handleInteract` show call |
| 5 | Worker only in browser; tests never spawn one | ✅ PASS | injected fake loader in all unit tests; `defaultLoader` (the only `new Worker`) never called in Node |
| 6 | WebLLM confined to `game/src/ai/` | ✅ PASS | grep: `@mlc-ai/web-llm` only in `webllmBrain.ts` + `webllm.worker.ts`, both under `ai/` |
| 7 | No regression (all prior suites) | ✅ PASS | 24/24 e2e |
| 8 | Build clean; unit + e2e green | ✅ PASS | header; build shows web-llm in its own worker chunk |
| 9 | **Human: smooth + 🧠 tag on WebGPU (manual)** | ⏳ PENDING HUMAN | greet on a WebGPU browser — expect `🧠 thinking…`→`🧠 ready`, no freeze, generated lines tagged 🧠 |

## Bugs found
None. The offload is verified structurally (web-llm is now in a dedicated worker chunk, off the entry bundle). Observability is in: a status HUD and a per-reply source tag. The injected-loader seam keeps Node tests worker-free. `greet()` return-type change (string→`Reply`) is internal, one call site, covered by the greet e2e. Boundary intact, no new deps.

## Recommendation
**APPROVE** — with the human smoothness/tag check (same pattern as cycles 7–8). This cycle also gives the operator the tool to answer their own "is it the LLM?" question: the HUD will read `ready` and lines will carry 🧠 when the model is truly driving; if it reads `offline` or lines stay un-tagged, the hellos are the documented fallback.
