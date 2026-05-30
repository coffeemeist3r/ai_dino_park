# Cycle 8 — Design

## Item
BACKLOG-048 [ai] In-character dino dialogue — the WebLLM dinos must talk like dinosaurs, never like an AI assistant.

## Why this cycle
The live model works but speaks help-desk: "Hi, I'm Rex, how can I assist you today?" That breaks the entire fiction. This cycle re-engineers the prompt (blunt anti-assistant system message + a one-shot in-character example) and adds a deterministic reply-cleaner (strip surrounding quotes, drop obvious assistant boilerplate, keep one sentence, trim). The model output improves; the cleaner guarantees the worst assistant-isms never reach the dialog box even on an off-generation.

## What ships
A rewritten `buildMessages` that: states the dino is NOT an AI and never offers help/assistance; describes it vividly via name + species + personality phrase; demands one short spoken sentence, in first person, no narration/quotes; and includes a one-shot example (a sample greet → a sample in-character reply) to anchor the small model. A new pure `cleanReply(raw)` that strips wrapping quotes, removes a leading assistant boilerplate prefix if present ("Sure!", "As an AI", "How can I assist", etc.), takes the first sentence, and trims to ≤200 chars. `generate()` runs the model output through `cleanReply`.

## Acceptance criteria
- [ ] `buildMessages` system content explicitly forbids assistant behavior (contains an anti-assistant instruction) and includes the dino's name, species, and personality phrase (unit).
- [ ] `buildMessages` includes a one-shot example exchange (≥ 4 messages total: system, example-user, example-assistant, real-user) (unit).
- [ ] `cleanReply('"Hello there!"')` → `Hello there!` (surrounding quotes stripped) (unit).
- [ ] `cleanReply('Sure! How can I assist you today? I am here to help.')` removes the assistant boilerplate and/or reduces to a single short sentence with no "assist"/"AI" wording (unit).
- [ ] `cleanReply` of a multi-sentence reply returns only the first sentence, ≤200 chars (unit).
- [ ] `cleanReply` of already-clean in-character text returns it unchanged (idempotent on good input) (unit).
- [ ] `generate()` passes model output through `cleanReply` — a fake engine returning `'"Sure! How can I assist you today?"'` yields a cleaned, quote-free, assistant-word-free reply (unit, via injected engine).
- [ ] No regression: fallback path, boundary, boot, and the cycle-2..7 suites stay green (unit + e2e).
- [ ] `npm run build` clean; vitest + playwright green.
- [ ] **Human re-check (manual):** greet a dino on a WebGPU browser — the reply reads as an in-character dinosaur, not an assistant. Recorded as a follow-up note (not automatable headlessly).

## Out of scope
- Web Worker offload / the gameplay lag (BACKLOG-049).
- Model-size selection (BACKLOG-006).
- Memory/context beyond the static persona (011/012).
- Streaming or a "thinking" UI.
- Per-species voice presets beyond what personality already provides.

## Constraints
- All changes stay inside `game/src/ai/` — the NPCBrain boundary holds; no scene/entity edits needed.
- `buildMessages` and `cleanReply` must be pure and Node-unit-testable (the model itself stays out of tests via the existing injected-loader/fake-engine pattern).
- The fallback (`cannedReply`) path is unchanged and must still work when the model is absent.
- No new dependencies. TypeScript strict; `any` only via the documented patterns.
- Keep the reply bound at ≤200 chars (existing contract).
