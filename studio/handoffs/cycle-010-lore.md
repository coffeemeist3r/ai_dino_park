# Cycle 10 — Lore Handoff

**Theme:** Two problems the operator hit live, fixed together: (1) the model loads and runs on the main thread, so the game *lags* while a dino thinks; (2) the dialog is "mostly hellos" and there's no way to tell whether a line came from the LLM or the canned fallback. Cycle 10 moves inference to a Web Worker (smooth) and adds a brain-status readout + a per-reply source tag (legible). After this, you can *see* the mind working.

**Cycle status:** Lore-smith bumped cycle 9 → 10. Cycle 9 closed BACKLOG-015 (gifts), APPROVED. Tenth cycle of the all-night grind.

**The "mostly hellos" diagnosis (drives this cycle):** replies fall back to the 4 canned lines whenever the model isn't ready (still downloading) OR when cycle-8's `cleanReply` strips an all-assistant-voice generation to empty. With no status indicator, the player can't distinguish a real LLM line from the fallback — so it all reads as scripted. Observability is the fix.

**Suggested next-up: BACKLOG-049 [ai] Offload WebLLM to a Web Worker — and surface brain status.**

Why: it directly fixes the lag the operator felt, and the status readout + reply-source tag directly answer their question ("how do I tell if it's the LLM?"). Both live inside the `ai/` boundary; the worker file just relocates where web-llm runs.

**Next after this:** BACKLOG-018 (dinos move + meet) per the operator's plan.

**Mood note:** make the mind visible. A small "🧠 thinking… / ready / offline" line, and a 🧠 on dialogue the model actually wrote. If it says "offline (canned)", the player knows the hellos are the safety net, not the dino.
