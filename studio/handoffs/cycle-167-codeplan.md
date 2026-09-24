# Cycle 167 — Code Plan

Two tracks, no file overlap. Lore lives in `game/src/audio/` plus the greet path in `pickTone`;
structure lives in `game/src/ui/plaque.ts` plus `setupPlaque`/`refreshPlaque`. The two WorldScene
regions are ~6900 lines apart.

---

## Lore track — BACKLOG-193

### Prior art checked first (CHARTER: reuse before adding)

- `audio/chirp.ts` — `chirpParams(t)`, `ChirpParams`, `THUNK`, and `distressParams(t)`, which is
  **exactly the precedent for this module**: a second reading of the same voice, derived from the
  base call rather than synthesized fresh. `answerParams` is written the same way and for the same
  reason — one voice, read differently.
- `audio/voice.ts` — `playChirp(p)` is already a general synth over `ChirpParams`. **The keeper's
  hail needs no new WebAudio code at all**: it is `playChirp(KEEPER_HAIL)`. `voice.ts` is untouched,
  which keeps the CHARTER's "only file that touches `AudioContext`" claim trivially true.
- `social/friendship.ts` — `heartsFromPoints` already in scope at the greet.
- `cryDistress` (`WorldScene:6913`) — the precedent for recording a social beat regardless of mute.
- `this.time.delayedCall` — the existing chorus scheduler (`WorldScene:9184`) already stages chirps
  this way; the answer uses the same mechanism rather than inventing a tick.

### New file: `game/src/audio/answer.ts` (pure)

```
KEEPER_HAIL: ChirpParams          // 1020 Hz, 140 ms, wobble 0, 2 pips
ANSWER_SLOW_MS = 780              // 0 hearts
ANSWER_FAST_MS = 90               // 10 hearts
EAGER_PIP_HEARTS = 7
answerDelayMs(hearts): number
answerParams(t: Personality, hearts: number): ChirpParams
```

`KEEPER_HAIL.pitchHz = 1020` is chosen against `chirpParams`' own arithmetic, not against the
current roster: `pitchHz = 120 + 780 * height` with `height` clamped to 0..1, so **no** personality
vector can ever exceed 900. 1020 is therefore above the cast by construction and stays there when
new dinos hatch — L5 is a property, not a measurement of today's eight.

`answerParams` derives from `chirpParams(t)` and returns it unmodified at `hearts <= 0` (L3).

### Changes in `WorldScene.ts`

1. Widen `lastSound` kind to `'chirp' | 'thunk' | 'hail'`.
2. Add `lastAnswer: { name, hearts, delayMs, params } | null`.
3. New `private hailAndAnswer(d: Dino): void` beside `chirpFor`:
   - read `hearts = heartsFromPoints(this.friendship[d.name] ?? 0)` **before** the tone's affinity
     bump, so the answer reflects the relationship as it stood when the keeper called;
   - record `lastAnswer` unconditionally (mute gates playback, not the beat — `cryDistress`);
   - if unmuted: set `lastSound` to the hail and `playChirp(KEEPER_HAIL)`;
   - `this.time.delayedCall(delayMs, ...)` → if the dino is still in `this.dinos`, set `lastSound`
     to its answer and play it (both mute-gated at fire time, so muting mid-gap is honoured).
4. Call `hailAndAnswer(target)` at the **top of `pickTone`**, right after the target is resolved —
   that is the frame the keeper actually speaks, and it is before the awaited brain call, so with a
   real model the answer genuinely lands before the reply text.
5. **Replace** `this.chirpFor(target)` at `WorldScene:8395` — the answer is now the greet's chirp.
   `chirpFor` keeps its two other callers (ambient speaker `:6516`, dawn chorus `:9191`) unchanged.
6. Dev hook `__lastAnswer()`.

### Tests

- `tests/unit/cycle-167-answer.test.ts` — L1..L5, driven over `ROSTER` traits.
- `tests/e2e/cycle-167-call-and-answer.spec.ts` — L6..L10 via `__pickTone`, `__lastAnswer`,
  `__lastSound`, `__setSoundMuted`/`__soundMuted`, `__hearts`.

### Blocker risk

`delayedCall` firing after a scene teardown. Guarded by re-resolving the dino from `this.dinos`
inside the callback; a dino that left the roster mid-gap simply does not answer, which is also the
correct behaviour.

---

## Structure track — BACKLOG-558

### Prior art checked first

- `ui/plaque.ts` — `plaqueLines` stays exactly as it is (S1, and the item's own instruction).
- `hudElements` is typed structurally as `{ setAlpha }`, so a `Container` drops straight in with no
  change at `WorldScene:1401`.
- `__plaque()` already reads `plaqueStats()` rather than rebuilding it (the cycle-154 fix). The new
  `__plaqueRows()` sits beside it and reads the **rendered objects**, which is the different question
  S6 asks.

### `game/src/ui/plaque.ts` — added

```
export type PlaqueLineKind = 'stat' | 'keeper';
export function plaqueLineKind(line: string): PlaqueLineKind
```

Keyed on the three keeper prefixes `plaqueLines` itself writes (`Watch · `, `Sitting · `,
`Keeper · `), declared as a const beside the function that writes them so the two cannot drift.

### `WorldScene.ts` — `setupPlaque` / `refreshPlaque`

- `plaque` becomes a `Phaser.GameObjects.Container` at the same anchor and depth.
- `plaqueBg` is a `Rectangle` child; `plaqueRows` is a `Text[]` of one object per line.
- `refreshPlaque` iterates: reuse, create-on-demand, hide the tail when the line count shrinks
  (S4), colour by `plaqueLineKind` (S5), then lay out at `PLAQUE_PITCH` and size the panel to the
  widest visible row (S8).
- Colours: stats keep `#f4d58d` exactly — the five park lines are byte-identical to tonight.
  Keeper lines take `#fff1c9`, a brighter engraving in the same brass hue.
- `__plaqueRows()` returns `{ text, kind, color }` for the **visible** rows only.

### Tests

- `tests/unit/cycle-167-plaque-kind.test.ts` — S1, S2 (including that the two mandatory lines and
  all five park lines classify `stat`, driven off `plaqueLines` output rather than string literals).
- `tests/e2e/cycle-167-brass-in-pieces.spec.ts` — S3..S8 on a fresh `as-shipped` founding state.

### Scope held

No `PROP_RIGS` entry, no `worldPlacedProps` edit, no rig. 539 is the Artist's.

---

## Shipped

_(the Coder fills this in)_
