# Cycle 56 — Design

## Item
BACKLOG-251 [emergent] Gratitude fades — the 247 thanks-line surfaces only while the cleared-name
memory is fresh, then quiets, so gratitude reads as a passing feeling, not a permanent script.

## Why this cycle
Cycle 55 shipped "thanks in the voice" (247) honest about its own wart: in its verdict and closed-log
entry it flagged that the thanks surfaces on *every* keeper greet for as long as the
`"<clearer> cleared my name"` memory rides the 6-entry ring. Because a dino only files ~one new memory
per notable beat, that means a just-cleared dino keeps thanking the keeper for the same favour over and
over — gratitude as a stuck script, not a feeling. This cycle closes the deferred freshness gate before
the louder gratitude beats (252 thanks-to-face / 254 the savior swells) stack onto an ungated line. It
is the smallest honest step that makes the bowl's newest spoken layer read as alive: gratitude that
comes and goes. It is also the **first freshness gate in the whole cold/relief arc** (222/233/244 are
all still open), so it sets the pattern those will reuse.

## What ships
A dino's spoken thanks naming its clearer (247) now **fades as the dino lives on**. Right after another
dino clears its name, greeting it still surfaces the thanks ("Twitch told everyone I was alright — I owe
them one."). But once the dino has filed a few newer memories (it wanders, meets others, eats, hears
gossip — ordinary life), the cleared-name memory is no longer among its freshest thoughts, and greeting
it returns to a normal greeting. The clearing isn't forgotten (the bond it earned in 243 stands, the
memory may still sit in the ring) — the dino has just stopped bringing it up unprompted.

Concretely: `whoClearedMyName(store, name)` (the pure read-back parser in `world/cold.ts` that drives
both the canned thanks line and the LLM prompt weave) returns the clearer **only while the
`<clearer> cleared my name` memory is within the most-recent `GRATITUDE_FRESH_WINDOW` entries** of the
dino's memory ring. Once enough newer memories pile on top, it returns `null` and the greet path falls
through to the ordinary greeting — no thanks. The deterministic canned path and the LLM-coloured path
both go quiet together, because both read the same `gratitude` ctx field WorldScene computes from this
parser. No change to how memory is stored (still the plain `Record<string,string[]>` ring) and no save
change — freshness is read purely from ring position, the only deterministic age signal available.

`GRATITUDE_FRESH_WINDOW = 3`: gratitude surfaces while the clearing is among the dino's 3 freshest
memories, then quiets. (Exported so the test pins it and a later beat can re-tune it.)

## Acceptance criteria
- [ ] A dino whose newest memory is `gratefulMemory(clearer)` still names the clearer: `whoClearedMyName` returns it (247 still works — regression guard).
- [ ] `whoClearedMyName` returns the clearer when the grateful memory sits within the most-recent `GRATITUDE_FRESH_WINDOW` entries.
- [ ] `whoClearedMyName` returns `null` when `GRATITUDE_FRESH_WINDOW` or more *newer* memories have been filed on top of the grateful memory, even though it is still present in the ring.
- [ ] `GRATITUDE_FRESH_WINDOW` is exported from `world/cold.ts` and is a positive integer ≤ the memory ring size (6).
- [ ] All five existing `whoClearedMyName` assertions in `tests/unit/cycle-055-thanks-voice.test.ts` still pass unchanged (their grateful memory sits in the fresh window).
- [ ] E2E: a dino freshly given a cleared-name memory, greeted, surfaces the thanks (reply names the clearer).
- [ ] E2E: the same dino, after `GRATITUDE_FRESH_WINDOW`+ newer memories are filed on top, greeted again, no longer names the clearer (reply is a normal greeting).
- [ ] `npm run build` clean; `npx vitest run` green; `npx playwright test` green.
- [ ] No save-format change; no new dependency; `@mlc-ai/web-llm` stays imported only under `game/src/ai/`.

## Out of scope
- Time/clock-based aging of the thanks (we use ring position, not wall-clock — there is no per-memory timestamp and adding one would be a save-format change). A clock-aged fade is not needed for the beat to read right.
- Generalising the freshness gate to the other un-gated rumor beats (sympathy visit 217, cold word 185 → 222; relief 235 → 244). 251 gates *only* the spoken thanks-line read-back; those stay as their own backlog items, though they may copy this pattern.
- The dino-to-dino spoken thanks (252), grudging thanks (253), the savior swelling (254) — all separate items that build on a now-fading line.
- Changing the bond/affinity gratitude earned in 243 — the *feeling* fades, the *bond* it built does not.

## Constraints
- Modify `whoClearedMyName` in place (do not fork a second parser) so the WorldScene greet path and the `__greetPrompt` hook inherit the gate with no new wiring.
- Keep the parser pure (no Phaser, Node-testable) and keep dialogue text out of `world/` — the spoken line stays in `ai/brain.ts` (`thanksLine`) / `ai/webllmBrain.ts`. No `ai → world` import.
- Freshness is read from ring position only. Do not add a field to `MemoryStore` or the save.
- The existing cycle-055 unit + e2e specs must stay green (the 247 happy path is a regression guard for this cycle).
