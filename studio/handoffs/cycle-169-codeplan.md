# Cycle 169 — Code Plan

Ten files, two of them new, and the two tracks overlap in exactly one function (`cryDistress`) —
which is the good kind of overlap: the structure track's distance argument is what the lore track's
new callback needs to sound like it is coming from over there.

## Prior art check (CHARTER: reuse before adding)

| Need | Already exists | Verdict |
|---|---|---|
| A ticker line | `logEvent()` + `tickerLines()` (`ui/lenses.ts`) | reuse, no new plumbing |
| A deferred call with the two guards | `hailAndAnswer`'s `delayedCall` (193) | **copy the shape, not a new abstraction.** BACKLOG-562 is queued to unify all of these and is the next structure pick; inventing the cue spine here would pre-empt it badly and half of it |
| A delay that shrinks with a relationship | `answerDelayMs(hearts)` (`audio/answer.ts`) | mirror its shape in `callbackDelayMs(bond)` — same clamp/lerp idiom, different axis |
| Who answers a cry | `comforter()` (`world/comfort.ts`) | reuse verbatim; `cryDistress` already calls it and already has `friend` in hand |
| Pair bond strength | `bondPoints(bonds, a, b)` (`social/bonds.ts`) | reuse |
| The friend's own voice | `chirpParams(traits)` (`audio/chirp.ts`) | reuse |
| The ground's name | `zoneById(this.zoneId).name` | reuse |
| A per-call level | `gainFor(kind)` (`audio/mix.ts`, cycle 168) | widen its signature; do not add a second level source |
| Distance between two points | `Phaser.Math.Distance.Between` (already used at `WorldScene.ts:9072`) | reuse in the scene; the pure module takes a scalar and never sees Phaser |
| e2e placement | `__setPlayer`, `__placeDino`, `__cryDistress`, `__lastSound` | all already exist — no new staging hooks needed beyond the two observation hooks below |

**Nothing new is invented that the park already had.** The two new modules are new *facts*
(how loudness falls with distance; how fast a friend answers), not new machinery.

---

## New files

### 1. `game/src/audio/space.ts` (structure track)

Pure, no Phaser, no WebAudio.

```ts
export const NEAR_PX = 96;    // 3 tiles — standing with it
export const FAR_PX = 448;    // 14 tiles — most of the 20×15 ground
export const FAR_LEVEL = 0.35;
export function distanceGain(distPx: number): number
```

- `!Number.isFinite(distPx) || distPx < 0` → `1` (never silence a call over bad input).
- `<= NEAR_PX` → `1`; `>= FAR_PX` → `FAR_LEVEL`; between → linear lerp.
- `FAR_LEVEL` carries the comment explaining *why* it is a floor and not zero, pointing at 204.

Constants sized against the real map: `TILE 32`, `COLS 20`, `ROWS 15` → 640×480 px, diagonal ≈ 800.
`FAR_PX = 448` means the floor is reached roughly two thirds of the way across, so the falloff is
actually *used* by the ground the player walks on rather than being a curve nothing reaches
(CHARTER v7 corollary: constants are not tuned to be dormant).

### 2. `game/src/audio/cycle-169-space.test.ts`

Criteria 9, 10, 11, 12. Includes the `VOICE_KINDS` totality walk pinning the cycle-168 numbers, so a
future kind added without a level still fails here.

---

## Changed files

### 3. `game/src/audio/mix.ts` (structure)

```ts
export interface VoiceOpts { distancePx?: number }
export function gainFor(kind: VoiceKind, opts?: VoiceOpts): number
```
`LEVEL[kind] * (opts?.distancePx === undefined ? 1 : distanceGain(opts.distancePx))`. Every existing
call site compiles and returns its existing number.

### 4. `game/src/audio/voice.ts` (structure)

`playChirp(p, kind = 'chirp', opts?: VoiceOpts)` — passes `opts` to `gainFor`. That is the whole
change; the envelope arithmetic is untouched. `playThunk` untouched.

### 5. `game/src/world/distress.ts` (lore)

Two pure exports plus their constants:

```ts
export const CALLBACK_SLOW_MS = 520;
export const CALLBACK_FAST_MS = 120;
export function callbackDelayMs(bondPts: number): number
export function distressEventLine(caller: string, trigger: 'startle' | 'cold', where: string): string
```

- `callbackDelayMs`: clamp `bondPts` to 0..100 (`MAX_BOND`'s range — the same 0–100 `bondPoints`
  returns), then lerp `CALLBACK_SLOW_MS → CALLBACK_FAST_MS`. Rounded. Strictly positive at 100 by
  construction, and faster than `ANSWER_FAST_MS`-territory is deliberately avoided: a friend answers
  quickly but is not instantaneous.
- `distressEventLine`: `📢` + caller + a verb chosen by trigger + the ground. Trigger-specific so the
  ticker carries the difference between startled and cold, which nothing else reaches the player with.

### 6. `game/src/world/cycle-169-distress.test.ts`

Criteria 1 and 4.

### 7. `game/src/scenes/WorldScene.ts` (both tracks)

- New private `distanceToKeeper(x: number, y: number): number` — one `Phaser.Math.Distance.Between`.
- `lastSound` type gains `gain: number`; every assignment in the file supplies it (the `thunk` site
  at :1690 gets `gainFor('thunk')`).
- `chirpFor(d, distancePx = this.distanceToKeeper(d.x, d.y))` — default parameter, so the npc-meet
  site (:6628) and the dawn chorus (:9378) become spatial with **no edit at either call site**.
  `stepBookCursor` passes `0`.
- `hailAndAnswer`: hail unchanged (no distance); inside the deferral, re-resolve the dino to `who`
  and read *its* position for the answer's distance.
- `cryDistress`: pass the caller's distance to the cry; log `distressEventLine(...)` **outside** the
  mute gate, beside the existing `lastDistress` write; after `this.memory = remember(...)`, call the
  new `answerCry(friend, d)`.
- New private `answerCry(friend, caller)`:
  - `bond = bondPoints(this.bonds, friend.name, caller.name)`, `delayMs = callbackDelayMs(bond)`,
    `params = chirpParams(friend.traits)`.
  - Records `lastCallback = { name, caller, bond, delayMs, params }` **unconditionally** — the beat
    is diegetic, same rule as `lastDistress`/`lastAnswer`.
  - `this.time.delayedCall(delayMs, ...)` with the two 193 guards written the same way (re-resolve by
    name; re-check `soundMuted()`), then `playChirp(params, 'chirp', { distancePx })` with the
    distance read at answer time.
- Hook: `(window as any).__lastCallback = () => (this.lastCallback ? { ...this.lastCallback } : null);`
  beside `__lastAnswer`.

### 8. `tests/e2e/cycle-169-distress-answer.spec.ts` (lore)

Criterion 8. `__cryDistress('Rex')` after `foundingState('as-shipped')`, then poll `__lastCallback`
for a non-null naming a dino that is not Rex, and read the ticker for a `📢` line naming Rex. Assert
no page errors.

### 9. `tests/e2e/cycle-169-sound-has-a-place.spec.ts` (structure)

Criterion 14. `__placeDino` two dinos at known tiles, `__setPlayer` beside the first, greet, read
`__lastSound().gain`; `__setPlayer` beside the second, greet, read again. Strictly smaller, both > 0.
Reads `lastSound.gain` rather than any AudioContext — headless-safe by the same construction every
audio spec since 191 has used.

### 10. `game/src/scenes/` — nothing else.

---

## Test plan

| Criterion | Where |
|---|---|
| 1, 4 | `game/src/world/cycle-169-distress.test.ts` |
| 2, 3, 5, 6, 7 | `tests/unit/` scene-level? **No** — 5/6/7 are scene wiring. Covered by the e2e in #8 for 5, and by reading the guards' shape from 193's precedent. 2 and 3 are asserted in the e2e (the ticker is read with the sound off as well as on). |
| 9, 10, 11, 12 | `game/src/audio/cycle-169-space.test.ts` |
| 8 | `tests/e2e/cycle-169-distress-answer.spec.ts` |
| 13, 14, 15 | `tests/e2e/cycle-169-sound-has-a-place.spec.ts` |

## Risks

- **`lastSound.gain` is a required field on a type with five assignment sites.** A missed one is a
  type error, not a silent bug — which is why it is required rather than optional.
- **The dawn chorus becomes spatial with no call-site edit** (default parameter). That is the intent,
  but it means `cycle-045`-era chorus specs run against attenuated calls. They assert order and
  names, not levels, so this should be inert — **verify, do not assume.**
- **Two `delayedCall` copies now exist** where there was one. Named as accepted debt: BACKLOG-562 is
  the queued fix and is the Structure-smith's flagged next pick. Do not solve it here.

## Blockers

None.
