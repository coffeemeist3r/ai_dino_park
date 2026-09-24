# Cycle 167 — Design

Two tracks. `soloCycle` is false; both sections are live.

---

## Lore track — BACKLOG-193, Call and answer

### The defect, stated plainly

`chirpFor(d)` is called at `WorldScene.ts:8395` the moment a greet resolves. It reads
`chirpParams(d.traits)` and plays it. That call is a function of the dino's **birth traits and
nothing else** — so the bowl makes the identical sound, at the identical moment, whether you are
greeting a dino you met four seconds ago or one you have fed every day for a week. The voicebox has
been a tell about the *dino* since cycle 44 and has never once been a tell about **you and the dino**.

And there is no *call* — only an answer. The keeper says nothing; a dino simply emits.

### The beat

Greeting a dino becomes two sounds with a gap between them.

1. **The keeper hails.** A plain two-pip call, immediately, in a register no dino occupies — the
   watcher's own voice, the audible sibling of the glass rap.
2. **The dino answers, after a pause.** The length of that pause, and the shape of the call that
   ends it, scale with hearts. A stranger takes most of a second and answers flat. A dino at ten
   hearts answers almost on top of you: brighter, bendier, an extra pip, a touch shorter — eager.

You can hear how much a dino likes you before you read a word of what it says.

### Rules

New pure module `game/src/audio/answer.ts`. No Phaser, no `AudioContext`, Node-testable.

- `KEEPER_HAIL: ChirpParams` — the watcher's call. Two pips, no bend, in a band no roster dino
  reaches (the cast spans 148–797 Hz; `THUNK` is 90 Hz). Plain by construction: the keeper is not a
  creature and must not sound like one.
- `answerDelayMs(hearts: number): number` — `ANSWER_SLOW_MS` (780) at 0 hearts falling to
  `ANSWER_FAST_MS` (90) at 10, linear, clamped, **monotone non-increasing** across the whole range.
- `answerParams(t: Personality, hearts: number): ChirpParams` — the dino's own call, warmed. At 0
  hearts it must be **byte-identical to `chirpParams(t)`**: a stranger sounds exactly as it does
  today, so this is a gain and never a regression. Warmth `w = hearts / 10` then lifts it: shorter
  (times `1 - 0.25w`), bendier (`+0.3w`, clamped to 1), a pip more past seven hearts, and a small
  pitch lift (times `1 + 0.08w`) — **small on purpose**, because the whole value of the voicebox is
  that you can tell Twitch from Mossback, and an eagerness that outran the cast's own spread would
  destroy the thing it decorates.

Scene side, in the greet path only:

- The hail plays immediately; the dino's answer is scheduled at `answerDelayMs(hearts)`.
- The answer is **recorded whether or not the device is muted**, on the `cryDistress` precedent: the
  dino answers the keeper in the world, and mute gates playback intent, not the beat. New
  `__lastAnswer()` hook returning name, hearts, delay and params.
- **The reply text timing does not change.** The dialog appears on exactly the frame it does today.
  This is a deliberate scope call, not an oversight: the item's phrasing is "an answering chirp
  before the text reply", and the honest reading is that the answer lands while you are still
  reading — moving the dialog would re-time a seam a hundred e2e specs stand on, to buy nothing
  audible.

### Reachability (CHARTER v7) — what a player hears in a fresh ten-minute save

**On the very first greet, before any friendship exists at all:** a sound that does not exist in the
game today. The keeper hails, and roughly three-quarters of a second later the dino answers. Today
there is one flat chirp and no pause.

**Within the first minute:** `greetGain` is 3–8 points per greet and a heart is 10 points, so two to
four greets of the same dino crosses the first heart. The answer quickens on a schedule the player
can hear, not one they have to be told about.

**Deliberately not gated on anything.** No clock boundary, no population floor, no threshold the
founding park sits under. Walk up to a dino and press a key.

### Acceptance criteria — lore track

- **L1** `answerDelayMs(0)` is 780, `answerDelayMs(10)` is 90, and the sequence over hearts 0..10 is monotone non-increasing. Out-of-range hearts clamp.
- **L2** For every roster dino, `answerParams(t, 10)` is strictly shorter than `answerParams(t, 0)`, has `wobble` greater or equal, and has `notes` greater or equal.
- **L3** `answerParams(t, 0)` deep-equals `chirpParams(t)` for every roster dino — the identity case.
- **L4** The cast stays identifiable: at 10 hearts every dino's pitch is within 10% of its own base pitch, and the cast's pitch *ordering* at 10 hearts is identical to its ordering at 0.
- **L5** `KEEPER_HAIL.pitchHz` equals no roster dino's chirp pitch and is not `THUNK.pitchHz`.
- **L6** In-game, greeting a dino sets `__lastAnswer()` to a record naming that dino, its current hearts and the delay — and that record updates **when the device is muted** too.
- **L7** In-game, `__lastSound()` reads the keeper's hail immediately on greet, and reads the dino's own chirp after the answer lands.
- **L8** **(the reachability criterion)** e2e on a fresh save: greet a dino, record the delay; greet it enough times to cross a heart; the delay is now strictly smaller — with no save edit, no clock skip and no seeded friendship.
- **L9** Muted: `__lastSound()` does not advance past the greet, but `__lastAnswer()` does.
- **L10** The reply dialog still appears on the same frame as before — the existing greet specs stay green untouched.

---

## Structure track — BACKLOG-558, The brass in pieces

### The defect

`refreshPlaque()` is one line: it joins `plaqueLines(...)` with newlines and calls `setText` on a
single `Phaser.GameObjects.Text`. There is no object that is *a line of the plaque*, so nothing on
the brass can carry anything of its own — not art, not a weight, not a colour. BACKLOG-539 has been
blocked on that fact for nine cycles and two corrections, and it is why the art queue has no-op'd
twice running.

### The change

`setupPlaque` builds a `Container` at the same anchor holding a background `Rectangle` and **one
`Text` per rendered line**, laid out top-to-bottom at a fixed pitch. `refreshPlaque` stops joining
and starts iterating: it reuses line objects it already has, creates any it needs, hides any it does
not, and resizes the panel to the widest line.

`plaqueLines` is **unchanged** and stays pure — that is the item's own instruction and the reason a
hundred existing literals across this suite do not move.

### The reachability half — and why it is this track's and not 539's

A per-line array that renders byte-identically is exactly the "compatibility win" the reachability
bar calls a REWORK. The item's own second sentence says what the geometry is *for*: that "this line
is about you" becomes expressible at all. So it ships expressed.

Eight lines can appear on the brass. Five are about the park — the vivarium, the day and specimen
count, the stores, the satchel, the zones, the upkeep. **Three are about the player** — `Watch`
(555), `Sitting` (542) and `Keeper` (122) — and all three are currently set in the same colour at the
same weight as a tally of specimens. With one object per line they get their own register: a warmer,
brighter engraving, the way the founder's mark stands off the ground.

A fresh save shows it on the first frame, with no friendship, no clock boundary and no population
floor: `Watch - AETHER-1 "Aki" - since day 1` stops reading like a count of things.

The classification is a **pure function beside `plaqueLines`** — `plaqueLineKind(line)` — not a
colour literal buried in the scene, so the rule is one thing in one place and 539 reads the same one.

### Scope, held

**The engraved day-count glyph is 539's and is not taken here.** No rig, no `PROP_RIGS` entry, no
`worldPlacedProps` edit. The geometry and the register are the item; the engraving is the Artist's,
tonight if it likes.

### Acceptance criteria — structure track

- **S1** `plaqueLines` is unchanged in signature and output — every existing unit assertion passes untouched.
- **S2** New pure `plaqueLineKind(line)` returns `keeper` for the `Watch`, `Sitting` and `Keeper` lines and `stat` for all five others, including the two mandatory ones.
- **S3** The plaque renders as one `Text` per line at a fixed pitch inside a container — not one multi-line `Text`.
- **S4** The rendered lines read top-to-bottom exactly equal to `plaqueLines(plaqueStats())` — none lost, none reordered, none left stale when the line count shrinks between refreshes.
- **S5** On a fresh save's first frame, the three keeper lines render in a different colour from the stat lines.
- **S6** A `__plaqueRows()` dev hook returns text, kind and colour per rendered line, so QA asserts what is *drawn* rather than what is computed — the cycle-163 lesson, where a green hook assertion sat beside a chip that swallowed the tap.
- **S7** The plaque still fades and returns with the rest of the HUD in ambient mode.
- **S8** The plaque still sits at the same anchor with its panel behind it, sized to the widest line.
- **S9** Every existing plaque spec (`cycle-024-plaque`, `-154-streak`, `-154-upkeep-line`, `-156-sitting`, `-159-satchel`, `-164-watch`, and the zone/stockpile ones) stays green **without edits**.
- **S10** 539 is unblocked in fact, not in claim: a per-line display object exists and is reachable, and the QA note records the host by name.

---

## Both tracks

- `npm run build` clean; `npx vitest run` green; `npx playwright test` green.
- `@mlc-ai/web-llm` stays imported only under `game/src/ai/` (neither track goes near it).
- No save-format change on either track. Nothing here persists.
