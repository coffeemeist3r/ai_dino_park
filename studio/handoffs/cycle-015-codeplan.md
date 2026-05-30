# Cycle 15 — Lore + Design + Code-plan (BACKLOG-055)

## Item
BACKLOG-055 [ai] Livelier character voice — fix the bland/lifeless replies. Operator-diagnosed: the system prompt drops the vivid roster personality, is negative-heavy, and the output is triple-truncated.

## Root causes (in `webllmBrain.ts`)
1. `persona = ctx.traits ? describePersonality(ctx.traits) : ctx.personality` — traits always exist, so the colorful roster string (`"loves rocks"`, `"quick to bolt"`) is never used; only a dry adjective list.
2. System prompt is mostly prohibitions (NOT assistant / no help / no narration / no quotes / no helpfulness) → small model goes safe/bland.
3. Triple truncation: "one short sentence" + `max_tokens: 60` + `cleanReply` keeping only the FIRST sentence.
4. `temperature: 0.7` — flat.

## Fix
- `buildMessages` system prompt rewrite:
  - Feed **both** the roster flavor (`ctx.personality`) **and** the trait adjectives (`describePersonality(ctx.traits)`).
  - Lead with positive, vivid character direction; collapse the anti-assistant rule to one short clause.
  - Invite "one or two vivid, specific sentences — mention what you see, want, or feel."
- `cleanReply`: keep up to **2** in-character sentences (was 1); still strip quotes/filler/assistant-tells; still `''` → canned fallback if nothing survives.
- `generate`: `max_tokens 100`, `temperature 0.9`.

## Files to modify
- `game/src/ai/webllmBrain.ts` — `buildMessages`, `cleanReply` (2-sentence), `generate` (tokens/temp).
- `tests/unit/brain.test.ts` — update the anti-assistant assertion wording; update cleanReply tests for 2-sentence behavior; add a >2-sentence truncation test.

## Reuse
- `describePersonality` (traits) + `ctx.personality` (roster flavor) — now used together.
- `moodFromTraits`, `relationshipLabel`, `dayPhase` context (cycles 8/10/12) — unchanged.

## Test plan
- Unit: system contains the roster flavor AND trait adjectives AND a (softened) anti-assistant clause; `cleanReply` returns up to 2 sentences and truncates a 3-sentence reply to 2; assistant-only reply still → `''`.
- E2E: `__greetPrompt('Rex')` still reflects time; greet still resolves. All prior suites green.

## Risks
- **Looser cleaner could let an assistant phrase slip** in sentence 2 — keep the `ASSISTANT_TELL` per-sentence filter; only in-character sentences are kept.
- **2 sentences + 100 tokens** slightly longer dialog — fine, `MAX_REPLY` 200 still caps it.
- Live quality is the human re-greet (watch the 🧠 tag).

## Touch count
2 files. Small, surgical.

## Shipped
- `ai/webllmBrain.ts` — system prompt rewritten (roster flavor + trait adjectives via `Who you are: <flavor>; <adjectives>`, positive-led, one light "never a chatbot or helper" clause, "one or two vivid specific sentences"); livelier one-shot example; `cleanReply(maxSentences=2)` keeps up to two in-character sentences; `generate` max_tokens 100 / temperature 0.9.
- `tests/unit/brain.test.ts` — updated anti-assistant assertion wording; cleanReply now 2-sentence + a truncation test.

Build ✅; unit ✅ 66/66; e2e ✅ 32/32.

### Before → after (Twitch, dusk, 6 hearts)
- **Before** `…your personality is: curious, solitary, energetic, prickly, timid. … one short spoken sentence. No narration, no quotation marks, no helpfulness.` (roster "jittery, quick to bolt" dropped; reply clipped to 1 sentence)
- **After** `Who you are: jittery, watchful, quick to bolt; curious, solitary, energetic, prickly, timid. It is dusk. You feel wary, and the visitor is a good friend. Answer in your own voice — one or two vivid, specific sentences…`
