# Cycle 170 — Code Plan

Order: structure (1–4) before lore (5–7). One Coder fire.

## Structure track — BACKLOG-562

1. `audio/chirp.ts` — `export function pipStrideMs(p)` = `(p.lengthMs / p.notes) * 1.15`.
2. `audio/voice.ts` — `playChirp` pip starts read `pipStrideMs(p) / 1000` (same arithmetic).
3. `audio/cue.ts` (new, pure) —
   - `interface Cue { atMs; who?; params; kind: VoiceKind }`
   - `answerCues(who, t, hearts)` → `[hail @0, answerParams @answerDelayMs]`
   - `callbackCues(who, t, bond)` → `[chirpParams @callbackDelayMs]`
   - `byTime(cues)` — stable ascending sort, used by every builder (and by `chorusCues`).
4. `WorldScene.playCues(cues, onFire?)` — the one clock. Per cue, at `atMs` (0 → synchronous):
   resolve `who` (skip if gone) → `onFire?.(cue, dino)` (visual, mute-independent) → skip if
   `soundMuted()` → distance at fire time → `lastSound` → `playChirp`.
   Migrate `hailAndAnswer`, `answerCry`, `checkDawnChorus`. `chirpFor` stays (immediate npc-meet).
   Guard test: the resolve step is pure-ish; pin it with a unit on a tiny exported helper
   `dueCue(cue, resolve)` in cue.ts returning the resolved dino or null — the scene uses it, so the
   unit and the scene cannot disagree.

## Lore track — BACKLOG-200 + 198

5. `audio/chorus.ts` —
   - `LATE_BEAT_MS = 450`, `ARRIVAL_REST_MIN = 180`, `CALL_ART_KEY = 'call'`, `CALL_GLYPH = '♪'`
   - `chorusCues(singers, bonds, cast = singer names)` → `{ cues, pairs, late }`; starts from
     `chorusOrder`; pairs = mutual `closestFriend(…, cast, LONER_FLOOR)` both singing; loners =
     `isLoner(bonds, n, cast)`; loner shift only if a non-loner sings.
   - `chorusLine(zoneName, pairs, late)`.
   - `arrivalDue(lastAbsMin | undefined, nowAbsMin)`.
6. `world/clock.ts` — export `timeToAbs` (was private).
7. `WorldScene` —
   - `checkDawnChorus` → `chorusCues(this.dinos, bonds)`; `lastChorus` keeps `{name, delayMs}[]`
     in energy order (192 spec compares names to `chorusOrder`).
   - `tryCrossZone` → after the zone switch, `this.callKeeperIn(zoneId)`: residents of that zone,
     rest check against `arrivalAt[zone]`, `chorusCues(residents, bonds, allNames)`, ticker line,
     `playCues(cues, pop♪)`; record `lastArrival = { zone, pairs, late, cues: [{name, atMs}] }`.
     `__setZone` untouched.
   - ♪: `makeHourMark(CALL_ART_KEY, CALL_GLYPH)` placed over the dino, visible, destroyed after 600 ms.
   - Hooks: `__lastArrival`, `__arrivalRest` (reads nothing else).

## Tests
- `audio/cycle-170-cue.test.ts` — pipStride, answerCues, callbackCues, ascending, dueCue.
- `audio/cycle-170-chorus.test.ts` — zero-bond identity, pair interleave, one-sided, loner late,
  no-non-loner no-shift, chorusLine, arrivalDue.
- `tests/e2e/cycle-170-chorus-arrival.spec.ts` — live 40–80 steps, cross out/in via
  `__setPlayer` + `__tryCross`, pair recorded + ticker; rest gate + clock advance; muted.

## Reuse
`chorusOrder`, `closestFriend`, `isLoner`/`LONER_FLOOR`, `answerDelayMs`/`answerParams`,
`callbackDelayMs`, `makeHourMark`, `theZone`, `timeToAbs`, `__stepWorld`/`__tryCross`/`__setPlayer`.

---

## Shipped (Coder)

As planned, with one deviation that matters:

- **Pairs are read among the singers, closeness = bond then meetings** — not "mutual `closestFriend`
  over the whole cast" as designed. Measured with `__stepWorld` on a founding save: the bond graph
  **saturates** — most pairs reach the cap of 100 inside 80 steps (four real minutes), and a
  bond-only closest friend is then decided by `closestFriend`'s alphabetical tie-break. With the
  whole-cast read the Bowl never produced a mutual pair at all (every Bowl dino's "best friend" was
  Bramble or Ember, by name), so the arc would have been unreachable for a reason nobody would hear.
  Among the singers, the top-scoring pair is always mutual, and the meetings tie-break makes it the
  two who have actually spent the most time together. The loner read stays whole-cast (same dino as
  the 🥀). The saturation itself is out of scope and flagged for the Validator.
- `__lastChorus` keeps its `{ name, delayMs }[]` energy-ordered shape (192's spec compares names to
  `chorusOrder`); the arrival is `__lastArrival`, the ♪ count `__callNotes`.
- `timeToAbs` exported from `clock.ts` for the rest gate.

Build clean; unit 3099 pass / 3 skipped (290 files).
