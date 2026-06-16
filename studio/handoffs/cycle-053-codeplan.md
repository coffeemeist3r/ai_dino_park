# Cycle 53 — Code Plan

## Item

BACKLOG-235 [emergent] — Relief travels too.

## Reuse audit

Ran the mental grep against `game/src/` — almost everything exists:

- `spreadWarmWord` / `spreadColdWord` (`world/cold.ts`) — the **exact template**. `spreadReliefWord`
  is a structural twin: recall speaker's memories, find a shareable one matching a news token, plant
  a `RUMOR_MARK`ed line on the listener, return `{ store, rumor }`.
- `reliefMemory(sufferer)` (`world/cold.ts`, 234) — `saw <sufferer> came through it fine`. The
  first-hand memory we detect and forward. No change.
- `RUMOR_MARK`, `isShareable` (`social/gossip.ts`, 019) — the 1-hop marker + the shareable test.
  `WARM_NEWS_TOKEN`/`COLD_NEWS_TOKEN` are the precedent for a stable substring tell.
- `remember` / `recall` (`ai/memory.ts`) — store ops. **No new primitive** (`forget` is unused here).
- Converse gossip cascade (`WorldScene.converse`, ~1426–1432) — the `relief ? : warm ? : cold ? :
  gossip` short-circuit pattern already exists for warm→cold→generic; we prepend one rung.
- Hook pattern `__spreadWarmWord` (`WorldScene` ~1147) — copy verbatim for `__spreadReliefWord`.

Nothing reinvented. The one genuinely new symbol is `spreadReliefWord` + its `RELIEF_NEWS_TOKEN` and
`reliefWordLine` helper — all in `cold.ts` beside their warm/cold siblings.

## Files to create

- `tests/e2e/cycle-053-relief-travels.spec.ts` — the relief-spreads flow + a no-relief control.

## Files to modify

- `game/src/world/cold.ts` — add, in the BACKLOG-234 block's tail:
  - `export const RELIEF_NEWS_TOKEN = 'came through it fine'` (stable substring of `reliefMemory`).
  - `export function reliefWordLine(speaker, reliefMem)` — strips the leading `saw ` off the carried
    first-hand memory and prefixes `<speaker> <RUMOR_MARK> `, yielding e.g.
    `Sunny told me: Mossback came through it fine`.
  - `export function spreadReliefWord(store, speaker, listener)` — twin of `spreadWarmWord`: returns
    `{ store, rumor: null }` if `speaker === listener` or the speaker has no shareable memory
    containing `RELIEF_NEWS_TOKEN`; else builds `reliefWordLine(speaker, mem)`, `remember`s it on the
    listener, returns `{ store, rumor }`.
- `game/src/scenes/WorldScene.ts`:
  - Import `spreadReliefWord` (and `reliefWordLine` if the hook needs it) from `../world/cold`.
  - In `converse`, prepend relief to the cascade:
    `const relief = spreadReliefWord(this.memory, a.name, b.name);`
    `const warm = relief.rumor ? relief : spreadWarmWord(...);` (warm/cold/gossip lines unchanged).
    Add `if (relief.rumor) this.logEvent(\`😌 ${b.name} heard the all-clear from ${a.name}\`);` as the
    first branch of the existing log if/else-if chain (warm/cold/generic become `else if`).
  - Add hook `__spreadReliefWord` beside `__spreadWarmWord` (same 3-line shape).

## New dependencies

none.

## Test plan

### Unit (`tests/unit/cold.test.ts`) — new `describe('relief travels too (BACKLOG-235)')`

- `reliefWordLine` strips `saw ` and carries `RUMOR_MARK` + the sufferer's name.
- `spreadReliefWord` plants the all-clear when the speaker holds a first-hand relief memory; the
  planted line equals `reliefWordLine(speaker, reliefMemory(sufferer))`.
- the planted rumor is **not** shareable (`isShareable` false) → second hop returns null (1-hop).
- returns null when the speaker has no relief memory, and when `speaker === listener`.
- a speaker that only *heard* the relief (carries the rumor, not `reliefMemory`) does not re-spread.

Build the speaker's relief memory the real way: `remember(store, corrector, reliefMemory(sufferer))`
(or run `selfCorrect` + apply, mirroring the cycle-52 test helpers).

### E2E (`tests/e2e/cycle-053-relief-travels.spec.ts`)

- **spreads:** plant cold word on a carrier about a sufferer, recover the sufferer (`__rememberWarm`),
  `__selfCorrect(carrier, sufferer)` so the carrier files the relief memory; then
  `__spreadReliefWord(carrier, third)` and assert `third`'s memory contains `came through it fine`
  + the sufferer's name, and (via `__forceConverse` with carrier as speaker) a 😌 all-clear log line.
- **control:** a carrier with no relief memory → `__spreadReliefWord` returns null, no 😌 log.

(Use the existing `__memory`, `__events`, `__dinoNames`, `__rememberCold`, `__rememberWarm`,
`__spreadColdWord`, `__selfCorrect` hooks; add `__spreadReliefWord`.)

## Risks

- **Precedence correctness** is the whole feature: relief must be the first rung so a corrector leads
  with the all-clear. The existing `warm.rumor ? warm : …` alias pattern extends cleanly — when
  `relief.rumor` is falsy, `warm` binds to the real `spreadWarmWord` result, so the `else if
  (warm.rumor)` log branch stays correct. Keep the log if/else-if order = cascade order.
- **Token uniqueness:** `'came through it fine'` appears only in `reliefMemory` — distinct from
  `'cold night'` (cold) and `'the keeper warmed'` (warm), so no cross-matching. Guard with a unit
  assertion that the relief token is absent from `coldMemory()`/`warmMemory()`.
- **Same-meeting self-spread is impossible by construction:** the relief memory is filed in the
  `selfCorrect` block (after the gossip cascade in `converse`), so it can only spread on a *later*
  meeting — the same snapshot discipline cycle 52 relies on. No code needed; note it.

## Estimated touch count

~4 files (cold.ts, WorldScene.ts, cold.test.ts, new e2e). Well under the 6 ceiling, no split.
