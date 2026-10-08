# Cycle 181 — Codeplan

## Lore track — BACKLOG-148

**Files.** `game/src/social/tones.ts` (+`toneEcho`), `game/src/scenes/WorldScene.ts` (`pickTone`: capture `prevTone`
before `recordTone`; add the echo at the bottom of the `opener` chain), `game/src/social/cycle-181-tones.test.ts`,
`tests/e2e/cycle-181-minds.spec.ts`.

**Reuse.** `toneReaction` (the verdict), `PAST_TONE` (the wording of a past tone), the existing one-or-none opener
chain, `__pickTone` and `__lastTone` hooks. No new hook.

**Tests.** Unit: the four registers, null cases, two trait sets diverging on one tone. E2E: first greet has no echo,
second greet contains one.

## Structure track — BACKLOG-592

**Files.** `game/src/ai/welcome.ts` (+`answerSeek`, `answerEffect`, `WELCOME_ART_KEY`, `WELCOME_GLYPH`),
`game/src/scenes/WorldScene.ts` (`answerNewcomer`), unit tests in `game/src/ai/cycle-181-minds.test.ts`, e2e in the
same spec as above.

**Reuse.** `strengthen` (bonds, grudges), the `meetings` map with `pairKey`, `seekLine`, `popMark` with `SEEK`-style
key+glyph, `__seeking`, `__ticker`, and the `crossBack` helper shape from `cycle-180-minds.spec.ts`. The walk and
arrival line come from the existing `soughtOnGround` / `arriveIfSought`.

**Risks.** Specs that assert exact second-greet text or exact bond values after a crossing may need their expectation
updated. Run the full suite.

## Shipped

- **148:** `toneEcho` in `social/tones.ts`; `pickTone` reads `prevTone` before `recordTone` and puts the echo at the bottom of the opener chain.
- **592:** `answerSeek`, `answerEffect`, `WELCOME_ART_KEY`/`WELCOME_GLYPH` in `ai/welcome.ts`; `actOnAnswer` called from `answerNewcomer`, which also pops the welcome mark.
- Unit tests for both live in one file, `game/src/ai/cycle-181-minds.test.ts` (the plan named a separate tones test; one file was enough). E2E: `tests/e2e/cycle-181-minds.spec.ts`.
- The bond assertion is `> before`, not `>= before + 4`: ambient drift over the walk takes ~1.5 off the +4.
- Board: build clean, unit 3281 green, e2e 889/889 on the first full run. No other spec needed changing.
