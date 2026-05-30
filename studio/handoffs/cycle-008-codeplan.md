# Cycle 8 — Code-plan

## Item
BACKLOG-048 [ai] In-character dino dialogue.

## Files to modify
- `game/src/ai/webllmBrain.ts`
  - **Rewrite `buildMessages(ctx, obs)`** to return ≥4 messages: a hardened `system`, a one-shot `user`+`assistant` example, then the real `user`.
    - System: `You are ${name}, a ${species} dinosaur living in a peaceful park. You are NOT an AI assistant and you never offer help, services, or ask how you can assist. You are a real creature with feelings and a personality: ${persona}. Speak ONLY as ${name}, in first person, one short spoken sentence, no narration, no quotation marks.`
    - One-shot: example user = a greet line; example assistant = an in-character reply (e.g. Rgh, a friendly snort + a dino-ish line) — generic enough to fit any dino, anchors style not content.
    - Real user: existing `OBSERVATION_PROMPT[obs.kind]` (+ detail).
  - **Add pure `export function cleanReply(raw: string): string`:**
    1. trim; strip a single pair of wrapping `"`/`'`/smart quotes.
    2. if it starts with an assistant boilerplate prefix (case-insensitive: `sure`, `of course`, `certainly`, `as an ai`, `i'm an ai`, `i am an ai`, `how can i (assist|help)`, `i'm here to help`, `i am here to help`), drop that clause up to the first sentence boundary.
    3. take the first sentence (split on `.!?` keeping the terminator).
    4. trim to ≤200 chars.
    5. if the result is empty after cleaning, return '' (caller falls back).
  - **`generate()`**: `const cleaned = cleanReply(raw); if (!cleaned) return cannedReply(ctx); return { text: cleaned, mood: moodFromTraits(ctx.traits) };`
  - Slightly lower temperature (0.7) and keep `max_tokens` modest (~60) to reduce rambling — minor, within the existing create() call.

## Files to (not) modify
- No scene/entity changes — boundary holds.
- `tests/unit/brain.test.ts` (modify) — add the `buildMessages` guardrail/one-shot assertions + `cleanReply` cases + the generate-cleans-output case.

## Reuse list
- `describePersonality` (010) for the persona phrase — reuse.
- `cannedReply`/`moodFromTraits` (brain.ts) — reuse for the empty-clean fallback + mood.
- The injected-loader / fake-engine test pattern (cycle 7) — reuse to test `generate()` cleaning deterministically.
- `OBSERVATION_PROMPT` map — reuse for the real user message.

## New dependencies
none.

## Test plan
### Unit (vitest) — extend `tests/unit/brain.test.ts`
- `buildMessages`: system contains an anti-assistant phrase (e.g. matches `/not an ai|never offer help|never .* assist/i`) + name + species + persona; total messages ≥ 4 with roles system/user/assistant/user.
- `cleanReply('"Hello there!"')` === `'Hello there!'`.
- `cleanReply("Sure! How can I assist you today?")` → no `/assist|ai/i`, single sentence.
- `cleanReply('Rgh! I love this sunny rock. It is warm and nice.')` → `'Rgh! I love this sunny rock.'`-ish (first sentence; ≤200).
- `cleanReply('Hi, I am Rex.')` idempotent-ish (returns clean first sentence unchanged).
- generate path: fake engine returns `'"Sure! How can I assist you today? I am an AI."'` → reply text is quote-free and matches `!/assist|ai/i`.
### E2E (playwright) — no new file
- Existing `cycle-007-brain.spec.ts` + all prior suites stay green (fallback path + boundary unaffected).
### Manual (human)
- Greet on WebGPU browser → reads in-character, not help-desk.

## Risks
- **Over-aggressive cleaning** eating legit replies: keep the boilerplate list tight and anchored to sentence starts; idempotency test guards good input.
- **First-sentence split** on abbreviations is imperfect for a 1-sentence target — acceptable; replies are short and the model is told one sentence.
- **Small-model defiance:** the one-shot + blunt system is the strongest lever short of fine-tuning; if it still drifts, `cleanReply` is the backstop. Real efficacy is the human re-check.
- Boundary unchanged (grep still shows web-llm only in `webllmBrain.ts`).

## Estimated touch count
2 files (1 modified src, 1 modified unit). Well under the ceiling — focused prompt/cleaning change.
