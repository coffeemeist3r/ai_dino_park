# Cycle 7 — Lore Handoff

**Theme:** Everything so far has been scaffolding for one thing: dinos that actually think. Cycle 7 is the heart of the whole project — a real local LLM behind the `NPCBrain` boundary. Qwen2.5 in the browser, no server, lazy-loaded so the game stays instant and only pays the model-download cost when the player first talks to someone. The canned stub becomes the safety net, not the voice.

**Cycle status:** Lore-smith bumped cycle 6 → 7. Cycle 6 closed BACKLOG-016 (friendship hearts), APPROVED. Seventh hand-driven cycle this Friday — operator is at the keyboard, which is exactly what this item needs.

**Suggested next-up: BACKLOG-005 [ai] WebLLM-backed brain — Qwen2.5-0.5B, lazy-loaded on first dialog.**

Why: the whole stack is charter-locked around it (WebLLM + Qwen). Personality (010) already gives us a prompt to feed it; the boundary (004) already isolates it. Adding `@mlc-ai/web-llm` is sanctioned by the CHARTER stack, not a forbidden framework.

**Critical constraints for downstream routines:**
- This is the one item that **cannot be fully verified by headless Playwright** — WebGPU + a ~300MB model download won't run in CI. The feature MUST degrade gracefully: if the model isn't ready (still loading) or WebGPU is unavailable, the brain falls back to the canned stub text so the game is never broken. QA verifies the boundary, the lazy-load wiring, the prompt builder (pure), and the fallback; live inference gets a human/real-browser check.
- WebLLM code stays **inside `game/src/ai/`** behind `NPCBrain`. No scene imports WebLLM. This is the charter's hard boundary.
- Smallest model (Qwen2.5-0.5B-Instruct) and a **dynamic import** so the engine is code-split and boot stays fast.

**Mood note:** progressive enhancement. First greet → instant canned reply while the model loads in the background → later greets → the dino's own words. Never a frozen screen, never a broken dialog.
