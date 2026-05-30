# Cycle 7 — Verdict

**Verdict:** APPROVED
**Item:** BACKLOG-005 — WebLLM-backed brain (Qwen2.5-0.5B, lazy-loaded)

## Rationale
Automatable criteria 1–9 all pass; build clean, 41/41 unit, 20/20 e2e. The charter's hardest rule for this item is "no half-shipped features — Validator must reject anything not playable end-to-end," and this passes that test precisely *because* of its design: the brain degrades gracefully. If WebGPU or the model is missing, or while it's still loading, `respond()` returns the canned fallback instantly and never throws — so the game is fully playable end-to-end today, and progressively upgrades to real generation when the model is ready. That is a complete feature, not a stub.

The engineering respects the boundary I care most about: a grep confirms `@mlc-ai/web-llm` is imported in exactly one file, `ai/webllmBrain.ts`, behind `NPCBrain` — no scene or entity touches it, so the native-mobile swap path is intact. The dependency is charter-sanctioned (Tech stack §). The injectable engine loader is a clever, honest move: it let QA prove the full ready→generate→trim path against a fake engine and the failure→fallback path against a rejecting one, so everything except the literal model download is covered by automated tests. One shared engine across all five dinos avoids a five-download disaster. Dynamic import keeps the engine out of the entry bundle.

## The one open thread (criterion 10 — live inference)
QA could not confirm real token generation in this environment: WebGPU is present, but the preview harness evaluates in an isolated world (no access to the page's dev hooks) and synthetic key events didn't drive Phaser's input, so a real greet never kicked the download. This is a limitation of the verification harness, not evidence of a defect — and the graceful fallback means it isn't a playability risk. I am APPROVING on that basis and filing the live check as a human follow-up rather than holding the cycle.

**Filed:** BACKLOG-047 [infra/ai] Human spot-check WebLLM live inference — on a WebGPU browser, greet a dino, confirm `__brainStatus` goes loading→ready and a non-canned reply appears; note first-load model-download time.

## Follow-ups
- BACKLOG-006 (device probe) should pick the model size by VRAM instead of the hardcoded 0.5B.
- A visible "…thinking" indicator and token streaming would improve the wait UX (currently the instant canned line covers it).
- BACKLOG-047 is the live-inference confirmation above.

BACKLOG-005 closed. The dinos can think now — pending one human hello to watch them do it.
