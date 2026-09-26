# Cycle 169 — Design

Two tracks, and this cycle they meet in one place: `cryDistress`. The lore track makes a cry
**findable and answered**; the structure track makes every call in the park **carry a distance**.
Built together they produce the beat neither could alone — a cry from the far corner arrives faint,
the ticker tells you who it was, and the friend that answers is fainter still, because it is over
there too.

---

## Lore track — BACKLOG-204 + BACKLOG-202: a cry you can find, and a cry that is answered

### What exists today

`cryDistress(d, trigger)` (`WorldScene.ts`) records `lastDistress`, plays the cry, picks the
comforter with `comforter()`, sets `pendingRespond`, shows the responder's `👂 caller?!` bubble and
files the memory. Every one of those outputs is **local to the two dinos**. If the keeper is not
looking at that patch of ground, the entire beat is invisible: there is no ticker line, and the only
sound in it is the cry itself.

### 204 — the keeper hears trouble

When a dino cries out, the event log gains a line naming the caller and the ground it is on, so the
ticker a keeper is already reading carries the one genuinely urgent thing the bowl does.

- New pure export in `world/distress.ts`: `distressEventLine(caller, trigger, where)`.
- Shape follows every other ticker line in the park — glyph, then a sentence. `📢` per the backlog
  item. The **trigger shapes the verb**, because "startled" and "cold through the night" are not the
  same trouble and the ticker is the only place the difference reaches the player at all.
- **Logged whether or not the device is muted.** The cry is diegetic (the cycle-46 rule `cryDistress`
  already documents in its own header): mute gates playback, not the event. A keeper who has turned
  the sound off must still be able to find a dino in trouble — arguably *especially* then.

### 202 — answered across the bowl

The friend that turns toward the cry calls back before it takes a step.

- New pure export in `world/distress.ts`: `callbackDelayMs(bondPoints)` — the pause between the cry
  and the answer, **shrinking as the bond strengthens**, the same shape `answerDelayMs(hearts)` uses
  for the keeper. This is the arc's actual content: it is what makes the bond audible rather than
  merely present. Monotone non-increasing, never zero (an answer needs a gap to be one).
- The callback is the friend's **own ordinary voice** — `chirpParams(friend.traits)`, kind `chirp`.
  Not a distress call: it is reassurance, and it must sound like the friend rather than like more
  trouble.
- It fires before the walk: `pendingRespond` is already set on the same frame, so the order the
  player perceives is cry, answer, the friend starts moving.
- **Guards, both of them, as `hailAndAnswer` has had since 193:** the friend is re-resolved by name
  inside the deferral (a dino that left the roster during the gap does not answer), and a mute that
  flips during the gap is honoured.
- Recorded as `lastCallback = { name, caller, bond, delayMs, params }` with a `__lastCallback` hook,
  matching `lastAnswer`/`__lastAnswer` exactly.

### Acceptance criteria — lore track

1. `distressEventLine` is pure, exported from `world/distress.ts`, and unit-tested: it names the
   caller, names the ground, and differs by trigger.
2. Firing a cry appends that line to the event log, and it appears in `tickerLines`.
3. The ticker line is posted **on a muted device** as well as an unmuted one.
4. `callbackDelayMs` is pure and unit-tested: monotone non-increasing in bond points, clamped at both
   ends, strictly positive at maximum bond.
5. After a cry with a comforter, a second call is made, in the comforter's own voice
   (`chirpParams(friend.traits)`), after `callbackDelayMs` of that pair's bond.
6. A cry with **no** comforter over the floor produces no callback — the cry hangs unanswered,
   exactly as it does today.
7. The callback does not fire if the comforter left the roster during the gap, and does not play if
   sound was muted during the gap.
8. e2e: a fresh save, a startle, and the player observes (a) a `📢` ticker line naming the caller and
   (b) `__lastCallback` naming the comforter. No page errors.

---

## Structure track — BACKLOG-206: sound has a place

### What exists today

`gainFor(kind)` in `audio/mix.ts` returns one number per kind and nothing else can influence it. Its
own header names 206 as the arc the seam was built for. So a cry from the far corner of the ground
and a chirp at the keeper's elbow arrive at exactly the same level, and where the keeper stands has
never changed what the keeper hears.

### The shape

- New pure module **`game/src/audio/space.ts`** — knows nothing about Phaser or WebAudio, Node-testable:
  - `NEAR_PX` — within this, full level (you are standing with it).
  - `FAR_PX` — at and past this, the floor.
  - `FAR_LEVEL` — **the floor, and it is well above zero.** A call that fades to nothing is a beat
    the player cannot know they missed, and this cycle's own lore track exists to make far-off
    trouble findable. Faint and still there is the design.
  - `distanceGain(distPx)` — 1 at/inside `NEAR_PX`, falling linearly to `FAR_LEVEL` at `FAR_PX`,
    flat thereafter. Defensive at the edges: negative, `NaN` and non-finite inputs return 1 rather
    than a silent call.
- `gainFor(kind, opts?: { distancePx?: number })` — multiplies the kind's level by
  `distanceGain(opts.distancePx)`. **Omitting `distancePx` is the identity case:** every existing
  caller reads unchanged and sounds unchanged.
- `playChirp(p, kind, opts?)` passes `opts` through to `gainFor`. `playThunk` is untouched — the
  glass rap happens *at* the glass.
- `WorldScene` gains one private `distanceToKeeper(x, y)` and passes it at the world call sites:
  - `chirpFor(d)` — the npc-meet speaker and the dawn chorus, both of which are dinos standing
    somewhere. The chorus becoming spatial is a free win and is audible on frame one.
  - the answer in `hailAndAnswer` — distance **re-read inside the deferral**, from the re-resolved
    dino, so a dino that walked during the gap answers from where it actually is.
  - the cry in `cryDistress`, and this cycle's new callback.
  - **The book cursor (195) is deliberately at full level.** Opening a dino's entry is a readout, not
    a sound in the world; attenuating it would make the book quieter for the dinos you have not
    walked to, which is nonsense. It passes distance `0`.
  - **The keeper's hail is at full level** for the same reason — the keeper's own call happens at
    the keeper.
- `lastSound` gains a `gain: number` field — what the call actually played at. This is what makes
  the whole thing observable from e2e, which cannot read an `AudioContext` headless.

### Acceptance criteria — structure track

9. `distanceGain` is pure, unit-tested, and: returns 1 at 0 and at `NEAR_PX`; returns `FAR_LEVEL` at
   and beyond `FAR_PX`; is monotone non-increasing across the range; never returns 0 or a negative;
   returns 1 for `NaN`/`Infinity`/negative input.
10. `FAR_LEVEL > 0` is asserted by name in a test — the floor is a design commitment, not an accident
    of the arithmetic.
11. `gainFor(kind)` with no options returns **exactly** the cycle-168 number for every kind (a
    totality test over `VOICE_KINDS`). No voice anybody knows moves this cycle unless they walk.
12. `gainFor(kind, { distancePx })` equals `gainFor(kind) * distanceGain(distancePx)`.
13. `lastSound.gain` is recorded at every `playChirp` call site in the scene.
14. e2e, on a fresh save with no prerequisites: greet a dino standing next to the keeper, then move
    the keeper to the far side of the ground and greet a dino there; the second `lastSound.gain` is
    strictly smaller than the first, and both are greater than zero.
15. The book cursor's cry plays at full level regardless of where the keeper is standing.

---

## Reachability (CHARTER v7) — the ten-minute question, per track

**Lore track.** Fresh save, no unlocks, no thresholds: rap the glass. A dino startles, and *in the
ticker the player is already reading* a `📢` line names it and names the ground it is on — the first
time in this park's life the bowl's most urgent event reaches a keeper who was looking elsewhere. A
beat later a second voice answers it from wherever the friend is standing. Before tonight the entire
distress beat was two dinos and a walk, visible only to a keeper who happened to be watching the
right tile.

**Structure track.** Fresh save, no unlocks: greet a dino at your elbow, walk across the tank, greet
another. The second is quieter. The dawn chorus, which has played flat since cycle 45, now arrives
from where each dino is sleeping. Where the keeper chooses to stand changes what the keeper hears —
which has never been true of this park before.

**Neither answer is "groundwork."**
