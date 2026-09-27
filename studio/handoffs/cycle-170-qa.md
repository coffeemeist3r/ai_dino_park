# Cycle 170 — QA

**Board:** `npm run build` clean · `npx vitest run` **3099 pass / 3 skipped, 290 files** ·
`npx playwright test` **838 / 838** on the second full run. Boundary: no `@mlc-ai/web-llm` import
outside `game/src/ai/`.

**Flake, noted, not a regression:** the first full e2e run failed 2 specs, both in
`mobile-minds.spec.ts` (`Execution context was destroyed, most likely because of a navigation`) —
the last file of an 836-spec run, touching nothing this cycle changed. The file passed 5/5 isolated
on this tree, and the fresh full run was 838/838.

## Structure track — BACKLOG-562

- [x] `pipStrideMs` exported and used by `playChirp`; no `* 1.15` literal left in `voice.ts`.
- [x] `answerCues` for hearts 0 / 5 / 10: hail at 0 with no `who`, answer at `answerDelayMs(h)` with
  `answerParams` (`cycle-170-cue.test.ts`).
- [x] `callbackCues` — one cue at `callbackDelayMs(bond)` in the friend's `chirpParams`.
- [x] Builders ascending by `atMs` (`byTime` pinned, ties stable).
- [x] `grep delayedCall WorldScene.ts` — the only callback that plays a chirp is inside `playCues`
  (L7133); the other seven clean up marks, bubbles, glances and the long-press.
- [x] 193 / 202 / 192 specs green unchanged (`cycle-045-chorus`, `cycle-169-distress-answer`, the 193
  answer spec) — `__lastChorus` keeps its `{name, delayMs}[]` energy-ordered shape.
- [x] Roster guard pinned once: `dueCue` returns null for a dino gone from the roster, and
  `playCues` routes through it. (The dawn chorus gained this guard; it had only the mute half.)
- [x] Interleave expressed as cues through `playCues` — see lore.

## Lore track — BACKLOG-200 + 198

- [x] All-zero bonds → times equal `chorusOrder`; no pairs, no late.
- [x] Mutual best friends → partner at leader + stride/2 (±1), first pip strictly between the leader's
  pip 0 and pip 1.
- [x] One-sided closeness is not a pair.
- [x] Loners come in `LATE_BEAT_MS` after every non-loner ends, a beat apart, in energy order; nobody
  moves when nobody is bonded.
- [x] `chorusLine` none / pair / late / both.
- [x] E2E: founding save stepped with `__stepWorld` only (no bond writes) until a Bowl pair exists;
  crossing into the Grove and back through `__setPlayer` + `__tryCross` → `__lastArrival` is the Bowl,
  its cues are exactly the Bowl's residents, ≥1 pair, each partner within one stride behind its leader,
  any loner after everyone; ticker `🎶 Pocket Cretaceous calls as you arrive — X & Y as one`; a ♪ per
  Bowl singer.
- [x] E2E: re-crossing inside `ARRIVAL_REST_MIN` sings nothing; after 181 in-game minutes it sings again.
- [x] E2E: muted — the Grove line posts, two ♪ pop (Bramble, Pip), `__lastSound` unchanged.
- [x] E2E: `__setZone` is not an arrival.
- [x] Dawn chorus spec green.

**Design deviation, verified rather than waved through:** pairs are read *among the singers* with a
meetings tie-break, not mutual `closestFriend` over the whole cast. The measurement behind it (a throwaway `__bonds` dump spec, run this session and deleted):
by 80 `__stepWorld` steps most bonds are at the 100 cap, and a whole-cast bond-only read gave every Bowl
dino a "best friend" of Bramble or Ember by alphabet, so the Bowl never sang a pair in 600 steps. The
deviation is what makes criterion 6 pass at all; the unit suite pins the tie-break
(`at the bond cap, the pair is the two who have met the most`).

**15 criteria, 15 pass / 0 fail.**
