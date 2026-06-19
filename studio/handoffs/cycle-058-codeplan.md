# Cycle 58 — Code Plan

## Item
BACKLOG-261 [emergent] Effusive thanks — a high-agreeableness dino gushes about whoever cleared its
name; the warm twin of cycle 57's grudging thanks (253).

## Files to create
- `tests/unit/cycle-058-effusive-thanks.test.ts` — pure-layer unit coverage (synthetic traits).
- `tests/e2e/cycle-058-effusive-thanks.spec.ts` — Twitch gushes through the canned fallback, headless.

## Files to modify
- `game/src/ai/brain.ts`
  - Add `export const EFFUSIVE_MIN = 0.6;` directly below `PRICKLY_MAX`, comment-pinned to the
    `describePersonality` high-pole cutoff (`> 0.6` in `personality.ts`), the way `PRICKLY_MAX` is
    pinned to the low (`< 0.4`).
  - In `thanksLine(clearer, traits?)`, insert one branch **between** the existing gruff branch and the
    plain `return`: `if (traits && traits.agreeableness > EFFUSIVE_MIN) return <gush line>;`. The gush
    names the clearer and is distinct from both other lines. Proposed:
    `` `${clearer} told the whole park I was alright — best friend a dino could ask for, I'll never forget it!` ``
  - `cannedReply` is untouched — it already threads `ctx.traits` into `thanksLine`, so the gush flows
    through for free.
- `game/src/ai/webllmBrain.ts`
  - In `buildMessages`, generalize the current `grudging` const into a three-way `manner`: gruff clause
    when `agreeableness < PRICKLY_MAX` (unchanged text), an effusive clause when
    `agreeableness > EFFUSIVE_MIN`, else `''`. Import `EFFUSIVE_MIN` alongside `PRICKLY_MAX`.
    Effusive clause (warm counterpart of the grudging one):
    `` `You can't thank them enough — gush about it, warm and effusive. ` ``
  - The `grateful` lead-in currently says "You're **quietly** grateful" — drop "quietly" so it doesn't
    fight the effusive manner; keep the rest (it still contains `cleared your name`, the pinned fact).
    Verify no spec asserts the word "quietly" (grep: none in cycle-055/056/057).

## Files to modify (test fixups — same fire, legitimate behavior change)
- `tests/unit/cycle-057-grudging-thanks.test.ts`
  - The two assertions that a `warm` (0.9) dino returns the **plain** line are now false (warm gushes).
    Soften them to the still-true contract "a warm grateful dino does NOT grumble":
    - `thanksLine` warm test → assert `not.toContain(GRUFF)` and `toContain('Twitch')` (drop the
      `.toBe(thanksLine('Twitch'))` plain-equality).
    - `cannedReply` warm test → assert `not.toContain(GRUFF)` and `toContain('Twitch')`.
  - The exclusive-cutoff test uses `agreeableness: PRICKLY_MAX` (0.4) → still plain (even band): keep,
    but assert `not.toContain(GRUFF)` rather than the exact warm phrasing to stay robust.
  - The `buildMessages` "omits grudging for a warm dino" test stays TRUE (effusive omits grudging) — keep.
- No other cycle spec changes: cycle-055 unit passes **no traits** (plain), cycle-055 e2e uses prickly
  Mossback, cycle-056 doesn't touch `thanksLine`. All stay green untouched.

## Reuse list
- `Personality` + the `> 0.6` / `< 0.4` pole cutoffs in `game/src/ai/personality.ts` (`describePersonality`)
  — `EFFUSIVE_MIN`/`PRICKLY_MAX` mirror these; do NOT invent new thresholds.
- `thanksLine` / `cannedReply` / `buildMessages` in `game/src/ai/brain.ts` + `webllmBrain.ts` — extend
  in place; this is the exact shape cycle 57 used for the gruff branch.
- `ctx.gratitude` + `ctx.traits` already populated at both greet sites in `WorldScene` (`pickTone` /
  `dino.greet`, via `whoClearedMyName`) — no scene change, confirmed by cycle 53/55/57 verdicts.
- E2E hooks `__rememberGrateful`, `__pickTone`, `__dialogPage` (used verbatim by cycle-055/057 specs).

## New dependencies
none.

## Test plan
- Unit (`tests/unit/cycle-058-effusive-thanks.test.ts`):
  - `thanksLine('Twitch', warm{0.9})` contains the effusive marker (`never forget`), names Twitch, and
    is NOT the gruff line and NOT the plain `I owe them one`.
  - `thanksLine('Twitch', even{0.5})` === `thanksLine('Twitch')` (plain) — middle band unchanged.
  - `thanksLine('Twitch', prickly{0.1})` is the gruff line (cross-check the three branches don't bleed).
  - `EFFUSIVE_MIN === 0.6`; exclusive — `thanksLine('Twitch', {…,agreeableness: EFFUSIVE_MIN})` is plain.
  - `thanksLine('Twitch')` (no traits) is plain (back-compat).
  - `cannedReply({warm, gratitude:'Twitch'})` → text === effusive line, `source: 'canned'`.
  - `buildMessages({warm, gratitude})` system prompt contains the effusive clause, NOT 'grudgingly',
    and still contains 'cleared your name' + 'Twitch'.
  - `buildMessages({prickly, gratitude})` still contains 'grudgingly' (cycle-57 cross-check).
- E2E (`tests/e2e/cycle-058-effusive-thanks.spec.ts`):
  - boot → `__rememberGrateful('Twitch','Sunny')` → `__pickTone('Twitch','warm')` → reply contains the
    effusive marker + 'Sunny', not the gruff phrase, not 'I owe them one'; no console errors.
  - (sanity) a freshly-cleared prickly **Rex** still grumbles — guards the spectrum end-to-end (optional
    second test, cheap reuse of the cycle-057 flow).

## Risks
- The effusive marker string must be unique vs. the plain and gruff lines so tests can distinguish all
  three; `never forget` / `best friend` is absent from both other lines — assert on `never forget`.
- Dropping "quietly" from the LLM lead-in is a wording touch; confirmed no test asserts it. The fact
  string `cleared your name` is untouched, so cycle-055/057 buildMessages assertions hold.
- Three-way `manner` ternary must keep the gruff branch byte-equivalent so cycle-057's surviving
  grudging assertions stay green.

## Estimated touch count
~4 files (2 src, 2 new tests) + 1 in-fire test fixup = 5 files. Well under the 6-file split line.
