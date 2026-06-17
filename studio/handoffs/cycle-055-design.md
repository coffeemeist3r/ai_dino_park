# Cycle 55 — Design

## Item
BACKLOG-247 [social] Thanks in the voice — a just-cleared dino's next keeper greeting names who
cleared its name; gratitude surfaces in dialogue, not just the bond math.

## Why this cycle
For six cycles the cold-rumor channel has grown verbs (185→217→223→234→235→243), and cycle 54
made clearing a friend's name *earn a bond*. But all of that lives below the waterline — bond
numbers and a 💛 bubble between two dinos. The keeper never hears it. This cycle is the payoff:
when you greet a dino whose name was just cleared, it tells you who did it ("Twitch told everyone
I was alright"). The longest invisible arc in the project becomes something the player reads. The
grateful memory `<clearer> cleared my name` already lands from BACKLOG-243's `clearedName` detector,
so this is a small read-back, not a new system.

## What ships
- When the keeper greets (E → tone pick) a dino that carries a fresh `<X> cleared my name` memory,
  the dino's reply **names X**: on the canned/no-model path a deterministic line
  (e.g. "X told everyone I was alright — I owe them one."), and on the LLM path the same fact is
  woven into the prompt so the model can colour its own grateful line.
- A dino with no cleared-name memory greets exactly as before (no thanks line).
- The fact rides the existing per-dino memory ring, so it ages out on its own (no new freshness
  gate this cycle — that's BACKLOG-251).

## Acceptance criteria
- [ ] A pure `whoClearedMyName(store, name)` returns the clearer's name when the dino holds a
      first-hand `<clearer> cleared my name` memory, and `null` when it doesn't.
- [ ] `whoClearedMyName` ignores rumor-marked / hearsay entries (only a first-hand grateful memory
      counts) and, with multiple, returns the most recent clearer.
- [ ] `whoClearedMyName(store, name)` round-trips the exact string `gratefulMemory(clearer)` produces.
- [ ] `cannedReply` with a gratitude clearer set returns a line that contains the clearer's name;
      without it, the normal canned greeting is returned (no clearer name leaks in).
- [ ] `buildMessages` with a gratitude clearer set includes that clearer's name in the system prompt
      (LLM colour); without it the prompt is byte-identical to today's.
- [ ] E2E: planting `<Twitch> cleared my name` on Mossback then greeting Mossback shows a reply that
      names Twitch (canned path under headless / no-WebGPU).
- [ ] E2E: a dino with no cleared-name memory greeted shows a reply that does **not** name any clearer.
- [ ] `npm --prefix game run build` clean; `npm run test:unit` green; `npx playwright test` green.
- [ ] No save-format change; no new dependency; `@mlc-ai/web-llm` still imported only under `game/src/ai/`.

## Out of scope
- Freshness/one-shot quieting of the thanks line (BACKLOG-251).
- Dino-to-dino spoken thanks on meeting the clearer (BACKLOG-252).
- Temperament-coloured / grudging variants (BACKLOG-253).
- Any change to how the grateful memory is *filed* — that's cycle 54's `clearedName`, untouched.

## Constraints
- The deterministic line + LLM weave must key off a single new optional `NPCContext` field (the
  clearer's name) so both paths read the same fact — mirror the established "deterministic fallback
  line; LLM colour behind NPCBrain" shape (148/160/173).
- Keep dialogue-text concerns in the `ai/` brain layer; the `world/cold.ts` addition is a pure
  memory *parser* only (`whoClearedMyName`) — no `ai → world` import (brain.ts must not import cold.ts).
- Must not change the greet path for a dino with no cleared-name memory (the cycle-035 tones specs
  and cycle-007/012 brain specs are the pins).
- Additive only: no `SAVE_VERSION` bump, no new persisted field (the memory store already persists).
