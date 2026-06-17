# Cycle 55 — Code Plan

## Item
BACKLOG-247 [social] Thanks in the voice — a just-cleared dino names who cleared its name in its
next keeper greeting (deterministic canned line + LLM colour).

## Approach
The grateful memory `"<clearer> cleared my name"` (from `gratefulMemory`, filed by cycle 54's
`clearedName`) already sits in the dino's persisted memory ring. Three thin pieces:
1. `world/cold.ts` — a pure **parser** `whoClearedMyName(store, name)` that reads that memory back
   to the clearer's name (no dialogue text — keeps `world` free of `ai` text concerns).
2. `ai/brain.ts` — one optional `NPCContext.gratitude` field (the clearer's name). `cannedReply`
   emits a deterministic thanks line when it's set; a small `thanksLine` helper holds the template.
3. `ai/webllmBrain.ts` — `buildMessages` weaves the clearer into the system prompt (LLM colour).
4. `scenes/WorldScene.ts` — the greet path (`pickTone`) computes `whoClearedMyName` and passes it
   as `gratitude`; the `__greetPrompt` hook does the same so e2e sees the real prompt; a tiny
   `__rememberGrateful` dev hook plants the memory for the e2e (mirrors `__rememberCold/Warm`).

Dialogue text lives in `ai/` (brain layer); `world/cold.ts` only parses memory. No `ai → world`
import — `brain.ts` never imports `cold.ts`. WorldScene (which imports both) wires them together.

## Files to create
- `tests/unit/cycle-055-thanks-voice.test.ts` — unit tests for `whoClearedMyName`, `thanksLine`/
  `cannedReply` gratitude path, and `buildMessages` gratitude weave.
- `tests/e2e/cycle-055-thanks-voice.spec.ts` — plant grateful memory → greet → reply names clearer;
  control dino with no memory → no clearer named.

## Files to modify
- `game/src/world/cold.ts` — add `CLEARED_NAME_SUFFIX` const + pure `whoClearedMyName(store, name)`:
  scan `recall(store, name)` for shareable entries ending in the suffix, return the most-recent
  clearer prefix or `null`. Reuses `recall` + `isShareable` + `gratefulMemory` already in the file.
- `game/src/ai/brain.ts` — add `gratitude?: string` to `NPCContext`; add `thanksLine(clearer)`;
  `cannedReply` returns `thanksLine(ctx.gratitude)` (mood happy) when `ctx.gratitude` is set.
- `game/src/ai/webllmBrain.ts` — `buildMessages` prepends a one-clause gratitude lead to `system`
  when `ctx.gratitude` is set (byte-identical when unset).
- `game/src/scenes/WorldScene.ts` — import `whoClearedMyName`, `gratefulMemory`; in `pickTone` pass
  `gratitude: whoClearedMyName(this.memory, target.name) ?? undefined` into the greet ctx; add the
  same field to the `__greetPrompt` ctx; add `__rememberGrateful(sufferer, clearer)` dev hook.

## Reuse list
- `recall`, `isShareable`, `gratefulMemory` — `world/cold.ts` / `ai/memory.ts` / `social/gossip.ts`,
  already imported in cold.ts. `whoClearedMyName` is the read-back twin of `clearedMyName` (which
  already exists in cold.ts and tests `e === reliefMemory(sufferer)`).
- `cannedReply` / `moodFromTraits` — `ai/brain.ts`, the established canned path; extend, don't replace.
- `buildMessages` — `ai/webllmBrain.ts`, the established prompt builder; extend the `system` string.
- `recall` / `remember` — `ai/memory.ts`, for the dev hook (mirrors `__rememberCold/Warm`).
- `Dino.greet(extra)` already spreads arbitrary `NPCContext` fields, so `gratitude` flows with no
  signature change.
- E2E reads the reply via the existing `__dialogPage().text`; greet driven via `__pickTone`
  (cycle-035 pattern). No new read hooks.

## New dependencies
none.

## Test plan
### Unit (`tests/unit/cycle-055-thanks-voice.test.ts`)
- `whoClearedMyName` returns the clearer when `gratefulMemory('Twitch')` is on the dino.
- returns `null` with no such memory.
- ignores a rumor-marked hearsay line; returns most-recent clearer when two are present.
- round-trips: `whoClearedMyName({Mossback:[gratefulMemory('Twitch')]}, 'Mossback') === 'Twitch'`.
- `cannedReply({...,gratitude:'Twitch'})` text contains `Twitch`; `thanksLine('Twitch')` non-empty.
- `cannedReply` without `gratitude` contains none of the cleared-name phrasing (normal greeting).
- `buildMessages` with `gratitude:'Twitch'` → system content includes `Twitch`; without → no `Twitch`.

### E2E (`tests/e2e/cycle-055-thanks-voice.spec.ts`)
- Plant `__rememberGrateful('Mossback','Twitch')`; `__pickTone('Mossback','warm')`; the reply text
  (`__dialogPage().text`) contains `Twitch`. (Headless → canned → deterministic thanks line.)
- A dino with no grateful memory greeted → reply text names no clearer (control; no console errors).

## Risks
- `pickTone` shows the reply async; the e2e must `waitForTimeout` after the pick before reading the
  dialog (cycle-035/044 precedent). Low risk.
- If the canned fallback ever returns before gratitude is read, ensure `gratitude` is passed *into*
  `greet` (ctx), not applied after — both paths must read the same ctx field.
- `whoClearedMyName` parse must be exact (suffix match) so an unrelated memory can't false-positive;
  unit-pinned by the round-trip against `gratefulMemory`.

## Estimated touch count
~6 files (2 new tests + cold.ts + brain.ts + webllmBrain.ts + WorldScene.ts). Within budget.
