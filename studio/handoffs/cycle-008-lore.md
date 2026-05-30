# Cycle 8 — Lore Handoff

**Theme:** The dinos think — but they think they're ChatGPT. The human spot-check (BACKLOG-047) confirmed live WebLLM inference works: there's a load lag, then the dino replies with *generated* text. The problem: that text is assistant-voice — "Hi, I'm Rex, how can I assist you today?" The 0.5B model is defaulting to helpful-AI mode and ignoring the persona. Cycle 8 makes them talk like *dinosaurs in a park*, not a help desk.

**Cycle status:** Lore-smith bumped cycle 7 → 8. Cycle 7 closed BACKLOG-005 (WebLLM brain), APPROVED. The operator is grinding hard tonight and re-verifying live in their own browser, which is exactly the loop this needs.

**Closed by human verification:**
- BACKLOG-047 — live inference spot-check. **Confirmed working** (load lag → generated reply). It also surfaced the persona bug below.

**Added to BACKLOG:**
- BACKLOG-048 [ai] In-character dino dialogue — strengthen the system prompt (+ a one-shot example) and clean the reply so dinos never speak as an AI assistant. *(next-up)*
- BACKLOG-049 [ai] Offload WebLLM to a Web Worker — the model currently loads/infers on the main thread, causing the gameplay lag the human noticed. Move to `CreateWebWorkerMLCEngine` so the world keeps moving while it thinks. *(follow-up, bigger)*

**Suggested next-up: BACKLOG-048.** Why: it's the difference between "a tech demo that loads a model" and "a dinosaur that talks." Pure prompt + a deterministic reply-cleaner — fully unit-testable; the human confirms the vibe with one more greet. The lag (049) is real but secondary — a janky in-character dino beats a smooth help desk.

**Mood note:** Qwen-0.5B is small and eager to be helpful. Beat it into character with a blunt system prompt ("You are NOT an assistant. You never offer help.") and a one-shot example. Strip quotes, take the first sentence. Make Rex sound like Rex.
