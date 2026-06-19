# Cycle 57 — Code Plan

## Item
BACKLOG-253 [emergent] Grudging thanks — temperament colours the cleared-name thanks.

## Approach
One axis read, two call sites. The spoken-thanks machinery already exists end-to-end (247/251):
`ctx.gratitude` drives the canned `thanksLine` and the `buildMessages` grateful clause. This cycle
makes both read the dino's `agreeableness` trait (already on every `NPCContext.traits`, injected by
`dino.greet`). A prickly dino (`agreeableness < 0.4`, the exact cutoff `describePersonality` uses
for the `low` pole) gets a gruff line; everyone else keeps the cycle-55 warm line verbatim. No
world change, no save change, no new memory — purely the wording in the `ai/` layer.

## Files to create
- `tests/unit/cycle-057-grudging-thanks.test.ts` — pure unit coverage (below).
- `tests/e2e/cycle-057-grudging-thanks.spec.ts` — in-game greet coverage (below).

## Files to modify
- `game/src/ai/brain.ts`
  - Add `export const PRICKLY_MAX = 0.4;` — the agreeableness ceiling for "prickly", with a comment
    pinning it to `describePersonality`'s `low` cutoff in `personality.ts`.
  - `thanksLine(clearer: string, traits?: Personality): string` — add optional `traits` arg. When
    `traits && traits.agreeableness < PRICKLY_MAX`, return the gruff variant
    `` `…yeah. thanks, I guess. ${clearer} set the record straight.` ``; otherwise return the existing
    warm line unchanged. (`Personality` is already imported in this file.)
  - `cannedReply` — change the grateful branch from `thanksLine(ctx.gratitude)` to
    `thanksLine(ctx.gratitude, ctx.traits)`. Nothing else moves.
- `game/src/ai/webllmBrain.ts`
  - In `buildMessages`, the `grateful` clause (line ~65): when `ctx.gratitude` AND
    `ctx.traits && ctx.traits.agreeableness < PRICKLY_MAX`, append a grudging instruction
    (`'You'd never gush about it — say your thanks gruffly, almost grudgingly. '`) so the model's
    thanks reads prickly too. Import `PRICKLY_MAX` from `./brain`. When traits are absent or the
    dino is warm, the clause is byte-identical to cycle 55.

## Reuse list (MUST reuse, do not reinvent)
- `whoClearedMyName` / `gratefulMemory` (`game/src/world/cold.ts`) — already feed `ctx.gratitude` at
  both greet sites (`pickTone`, `__greetPrompt`). No WorldScene change needed at all.
- `NPCContext.traits` + `dino.greet` (`game/src/entities/dino.ts:70`) — already inject the dino's
  `traits` into every greet context; the new code just reads `traits.agreeableness`.
- `Personality` axis `agreeableness` (`game/src/ai/personality.ts`) — `0 prickly .. 1 warm`, and the
  `< 0.4` cutoff `describePersonality` uses. Do not invent a new "prickly" notion.
- Dev hooks `__rememberGrateful`, `__pickTone`, `__greetPrompt`, `__dialogPage` — all exist; the
  e2e drives entirely through them (no new hooks).

## New dependencies
None.

## Test plan
**Unit — `tests/unit/cycle-057-grudging-thanks.test.ts`** (mirrors `cycle-055-thanks-voice.test.ts`):
- `thanksLine(clearer, prickly)` returns the gruff variant; it contains `clearer` and `'thanks, I guess'`.
- `thanksLine(clearer, warm)` returns the existing warm line (`=== thanksLine(clearer)` no-traits).
- `thanksLine(clearer)` with no traits returns the warm line (back-compat default).
- `cannedReply({ gratitude, traits: prickly })` → gruff text, `source: 'canned'`, names the clearer.
- `cannedReply({ gratitude, traits: warm })` → warm text (`=== thanksLine(clearer)`).
- `buildMessages({ gratitude, traits: prickly })` system prompt contains the grudging instruction
  AND still `'cleared your name'`.
- `buildMessages({ gratitude, traits: warm })` system prompt has `'cleared your name'` but NOT the
  grudging instruction.
- Use synthetic `Personality` objects (e.g. `agreeableness: 0.1` prickly / `0.9` warm) so the test
  is independent of roster seeding.

**E2E — `tests/e2e/cycle-057-grudging-thanks.spec.ts`** (mirrors `cycle-055-thanks-voice.spec.ts`):
- Greet a freshly-cleared **Rex** (prickly, agreeableness 0.019): dialog contains `'thanks, I guess'`
  and the clearer's name, and NOT `'I owe them one'` (the warm phrase).
- Greet a freshly-cleared **Twitch** (warm, agreeableness 0.929): dialog contains `'I owe them one'`
  (warm line unchanged) and NOT `'thanks, I guess'`.
- Control: a non-grateful greet of Rex contains neither thanks phrase (gruff branch only fires under
  gratitude). No console errors across the run.

## Risks
- The cycle-055 e2e greets **Mossback** (prickly, 0.216) and asserts the reply `.toContain('Twitch')`
  — the gruff variant still names the clearer, so it stays green. The cycle-056 e2e (also Mossback)
  asserts the *faded* greet omits `'Twitch'`/`'I owe them one'` — unaffected, the gruff branch only
  fires under `gratitude`. Both verified against the gruff string before coding.
- The cycle-055 unit pins `cannedReply(gratitude, no traits).text === thanksLine('Twitch')` — the
  no-traits default returns the warm line, so it holds. Keep the warm line byte-identical.
- `buildMessages` is asserted by string `.toContain` in cycle 55 with no traits → warm clause
  unchanged. Gate the grudging append strictly on `traits && agreeableness < PRICKLY_MAX`.

## Estimated touch count
~4 files (2 src, 2 test). Well under the 6-file split threshold.
