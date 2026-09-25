# Cycle 168 — Design

Two tracks. They share one directory (`game/src/audio/`) and that is deliberate — see the
**Sequencing** note at the bottom. Build the structure track first.

---

## Lore track — BACKLOG-195

**Item:** BACKLOG-195 [pokemon] Cry in the book — the collection book plays a dino's chirp when you
open its entry; a hatchling's cry blends its parents' parameters the way its traits do.

### Why this cycle

Milestone 22's arc 2. Arc 1 (193, shipped cycle 167) made the *greeting* carry a relationship. This
one gives the voice a second place to come from — the one place the park keeps its dinosaurs when
they are not in front of you — and it is the arc that turns the voicebox from a thing that happens
*at* you into a thing you can go and ask for.

**A finding the Coder must not paper over.** Half of this item is already true and invisible.
`chirpParams` derives a call from `traits`, `blendTraits` (`social/breeding.ts:48`) already blends a
hatchling's traits per-axis from both parents, and `hatch()` already feeds those blended traits to
the new dino. **A hatchling's cry is therefore already a blend of its parents' cries, and has been
since cycle 44.** Re-deriving it would be bit-identical work — a REWORK under CHARTER v7. So the
blend half of this item ships as *legibility*: the book says, in words and in sound, where a voice
sits between the two it came from. That is the part a player cannot currently reach.

**The second finding, which sets the shape.** The book has no per-entry open. `refreshLens()` renders
every dino's block into one `bookPanel` text at once (`WorldScene.ts:5232`), so there is no "entry"
for a cry to be attached to. This item therefore ships the cursor as well as the cry; a cry with no
selection would have nothing to fire on.

### What ships

Press **V** to the **book** lens as today. The book now has a **cursor**, and pressing **N** steps it
to the next dino and **plays that dino's own call** in its own voice.

1. **The cursor.** The selected dino's name line is prefixed `▸`; every other block is unchanged. The
   cursor starts on the first dino in the book. `N` advances it and wraps at the end. `N` does
   nothing outside the book lens (and never moves the keeper).
2. **The cry.** Each step plays `chirpParams(d.traits)` for the newly selected dino — the same call
   the park has made since cycle 44, so five presses of `N` on a fresh save walk the founders' whole
   148–797 Hz spread back to back. This is the first time in the game's life that two dinos' voices
   can be heard *next to each other* on demand; until now you had to walk to each one.
3. **The voice line.** The selected block — and only the selected block — gains one line naming its
   own voice: `🔊 voice · 412 Hz · 2 pips`. A founder gets that and stops.
4. **The blend, made legible.** A dino with parents, both of whom are still in the roster, gets the
   comparison instead: `🔊 voice · 412 Hz · 2 pips — between Rex 301 and Sunny 523`. The relation word
   is derived, not assumed: `between` when the pitch lies within the parents' two pitches, `above
   both` / `below both` when the jitter in `blendTraits` has pushed it outside. If either parent has
   left the roster, fall back to the plain line — the comparison is a live read, never a stored one.
5. **Mute.** `M` still silences everything. Muted, `N` still moves the cursor and the voice line still
   renders; only the sound is withheld. The cursor is a read of the book, not a sound event.

### Acceptance criteria

- [ ] On a fresh save, pressing `V` until the book lens is up and then `N` prefixes exactly one name line with `▸`, and it is the first dino's.
- [ ] Pressing `N` five more times returns the `▸` to the first dino (wrap), with exactly one `▸` in the book text at every step.
- [ ] Each `N` press in the book lens records a chirp for the newly selected dino: the scene's last-sound observation returns `{ kind: 'chirp', name: <selected> }` and its `params` deep-equal `chirpParams(<that dino>.traits)`.
- [ ] Pressing `N` while the lens is **not** `book` changes neither the cursor nor the last-sound observation.
- [ ] The selected block contains exactly one line starting `🔊 voice · `; no unselected block contains one.
- [ ] `voiceLine(chirpParams(t))` returns `🔊 voice · <pitchHz> Hz · <notes> pip` / `pips` (singular at 1), pure, no parents argument.
- [ ] `voiceLine(child, [{name:'Rex',params:a},{name:'Sunny',params:b}])` appends `— between Rex <aHz> and Sunny <bHz>` when the child's pitch is strictly inside `[min(a,b), max(a,b)]`, `— above both …` when above, `— below both …` when below.
- [ ] A hatchling whose parents are both in the roster shows the comparison form; with one parent absent it shows the plain form.
- [ ] With sound muted (`M`), `N` still moves the `▸` and still renders the voice line, and the last-sound observation is not updated.
- [ ] Removing the selected dino from the roster leaves the cursor on a valid entry (clamped, never out of range) and the book still renders.
- [ ] `npm run build` clean, `npx vitest run` green, `npx playwright test` green.

### Out of scope

- **Any touch/`More`-sheet seat for `N`.** The sheet is at its geometric ceiling and that is BACKLOG-552's whole item; an eleventh row would land inside the action cluster. Keyboard only this cycle, named in the `[?]` help panel.
- Up/back stepping. One key that wraps is the whole cursor; a second key is a second thing to test for no gain.
- Playing the *answer* register (193) or the distress register from the book. The book plays the dino's plain call — what it sounds like, not how it feels about you.
- Scrolling the book panel, or highlighting by colour. `▸` is the selection.
- Persisting the cursor into the save. It is a view position.

### Constraints

- `chirpParams` and `blendTraits` are **reused, not re-derived**. No new blend arithmetic.
- `voiceLine` is **pure** — no Phaser, no AudioContext — and lives beside `chirpParams` in `audio/chirp.ts`. Do not create a module for one function.
- `N` must not be reachable by the keeper's movement handlers, and must not fire while a modal picker or dialog already swallows keys.
- The cry goes through whatever `playChirp` looks like **after** the structure track lands (see Sequencing).

---

## Structure track — BACKLOG-559

**Item:** BACKLOG-559 [infra] One bus for every voice — one master `GainNode` every call routes
through, and a pure module that decides the number.

### Why this cycle

`audio/voice.ts` builds a fresh `oscillator → gain → ctx.destination` chain for every call and
multiplies the module constant `MASTER_GAIN` in at the envelope, in two places, with `playThunk`
quietly using `MASTER_GAIN * 1.4` inline. There is no object representing *how loud the bowl is* and
no seam where a call's loudness can be decided by anything but the call itself. Milestone arc 206
(distance), and queued 204 and 202, all need exactly that seam, and each would otherwise add its own
copy of the arithmetic inside the one file the CHARTER keeps WebAudio locked in.

### What ships

1. **`game/src/audio/mix.ts` — pure, Node-testable, knows nothing about WebAudio.** One export:
   `gainFor(kind: VoiceKind): number`, returning a 0–1 multiplier, plus the `VoiceKind` union and the
   named level constants. Kinds: `'chirp'`, `'hail'`, `'distress'`, `'thunk'`.
2. **The bus.** `unlockAudio()` creates one `GainNode` alongside the context, at unity, and every
   oscillator in `voice.ts` connects to **it** rather than to `ctx.destination`. The bus connects to
   the destination once. `voice.ts` stays the only file that touches `AudioContext`.
3. **Every call declares its kind.** `playChirp(p, kind = 'chirp')` and `playThunk()` read their level
   from `gainFor`, and `MASTER_GAIN` stops being multiplied in by hand anywhere.
4. **The identity cases, pinned.** `gainFor('chirp') === 0.12` and `gainFor('thunk') === 0.168`
   (`0.12 * 1.4`) — exactly today's numbers, asserted in a unit test, so no sound anyone already knows
   changes by accident.
5. **The live consumer — this is the reachability half and it is not optional.** Two levels that were
   never expressible become expressible, and both are audible in a fresh save:
   - `gainFor('hail') === 0.08` — **the keeper's hail sits back.** `KEEPER_HAIL` is the one call in the
     park that is not a creature, and it has been playing at exactly a dinosaur's level since last
     cycle. Now the hail is quiet and the answer that follows it comes forward, so the greet reads as
     *you called and it answered* rather than as two equal beeps. Reachable on the first `Z` press
     against any dino, under a minute into a fresh save.
   - `gainFor('distress') === 0.20` — **a cry carries.** A distress yelp is the one sound in the bowl
     that is supposed to cut through, and it has been the quietest thing in it (`distressParams`
     shortens the call, and a shorter call at the same gain is a smaller sound). `cryDistress` passes
     `'distress'`.

### Acceptance criteria

- [ ] `game/src/audio/mix.ts` exists, imports nothing from `voice.ts` and nothing WebAudio-typed, and is exercised by a Vitest unit file that runs in Node.
- [ ] `gainFor('chirp') === 0.12` and `gainFor('thunk')` is within 1e-9 of `0.12 * 1.4` — the identity cases.
- [ ] `gainFor('hail') < gainFor('chirp') < gainFor('distress')`, and every `gainFor` result is in `(0, 1]`.
- [ ] `gainFor` is total over `VoiceKind`: a test iterates every member of the union and asserts a finite number in range (so a kind added later cannot silently return `undefined`).
- [ ] `grep -n "ctx.destination" game/src/audio/voice.ts` matches exactly **once** — the bus's own connection.
- [ ] `grep -n "MASTER_GAIN" game/src/audio/voice.ts` returns nothing; the constant lives in `mix.ts` or is gone.
- [ ] `hailAndAnswer` plays the hail with kind `'hail'` and the answer with kind `'chirp'`; `cryDistress` plays with kind `'distress'`. Asserted through the scene's existing last-sound observation seam, extended to carry the kind.
- [ ] `@mlc-ai/web-llm` still appears under `game/src/ai/` only (grep).
- [ ] No save-format change at all. (This track touches no persisted field; that is stronger than "additive".)
- [ ] An e2e spec drives a greet on a fresh save and asserts the observed hail/answer kinds — the reachability walk, not just the arithmetic.
- [ ] `npm run build` clean, `npx vitest run` green, `npx playwright test` green.

### Out of scope

- **`distanceTiles` and any falloff.** The seed sketches `gainFor({ kind, distanceTiles })`; that is
  deliberately **not** built. An attenuation nothing passes is an unused parameter, which is the
  groundwork CHARTER v7 calls a REWORK, and it is the entirety of BACKLOG-206 — the next structure
  arc. `gainFor` takes a kind this cycle; 206 widens it to an options object and wires the caller.
  The bus is what 206 needs and the bus is what ships.
- A user-facing volume slider, per-kind mute, or persisting a level. `M` is still the whole control.
- Ducking, compression, or any scheduling. Scheduling is BACKLOG-562, seeded this cycle.
- Folding `lastSound` / `lastAnswer` / `lastDistress` into one log. That is BACKLOG-563, seeded this cycle. Extend `lastSound` with the kind; do not refactor the three fields.

### Constraints

- **`voice.ts` remains the only file in the repo that references `AudioContext`, `GainNode` or `OscillatorNode`.** Verify by grep before committing.
- `mix.ts` must be importable from Node with no DOM — the whole point is that the number is decidable without a browser.
- Autoplay safety is unchanged: no node exists before `unlockAudio()`, which is still called only from the first-gesture seam.
- The mute rule does not move. `soundMuted()` gates playback exactly where it does today; the bus is not a mute.

---

## Sequencing (cross-track, read this)

Both tracks land in `game/src/audio/`. They do **not** contend if built in this order:

1. **Structure track first.** It changes `playChirp`'s signature (adds an optional `kind`) and the
   internals of `voice.ts`. Land it, build, test.
2. **Lore track second.** Its only audio touch is a `playChirp(params)` call from the book, which takes
   the default `'chirp'` kind and therefore needs no change once step 1 is in. `voiceLine` is added to
   `chirp.ts`, which the structure track does not modify.

The one shared file is `game/src/scenes/WorldScene.ts`, in different methods (`chirpFor` /
`hailAndAnswer` / `cryDistress` for structure; `refreshLens` / `bookRows` / a new `N` handler for
lore). No method is touched by both.

`audio/chirp.ts` is touched by the lore track only. `audio/mix.ts` is new and touched by the structure
track only. If the fire has to be split, split there — `mix.ts` is pure and has no dependency on the
book.
