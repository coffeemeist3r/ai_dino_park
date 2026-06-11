# Cycle 44 — QA

**Build:** ✅ `npm --prefix game run build` clean (tsc + vite, PWA precache generated).
**Unit tests:** ✅ 361/361 (40 files; +7 new `chirp.test.ts`).
**E2E tests:** ✅ 131/131 in a fresh full parallel run (+5 new `cycle-044-sound.spec.ts`).
One spec (`mobile-minds` paging) failed in the FIRST full run, passed isolated, and the
fresh full run was green — catalogued parallel-load flake per the quality bar, noted, not a
regression.

## Acceptance criteria

| Criterion | Status | Evidence |
|---|---|---|
| `chirpParams` deterministic + bounded at trait corners (120–900 Hz / 80–350 ms) | PASS | `chirp.test.ts` "is deterministic" + "stays bounded at every trait corner" (4 corners) |
| Distinctness: Twitch ≥ 100 Hz above Sunny; ≥ 4 distinct founder pitches | PASS | `chirp.test.ts` "five founders spread" — actual spread Mossback 148 / Rex 343 / Glade 513 / Sunny 521 / Twitch 797 (Twitch−Sunny = 276 Hz; 5 distinct) |
| Greet (E → tone → reply) records chirp with the dino's name | PASS | e2e "a greeted dino answers in its own voice" (`__lastSound()` = chirp/Rex, params in range) |
| `__forceConverse` records a chirp for the speaker | PASS | e2e "a dino↔dino conversation chirps in the speaker's voice" |
| Glass tap records thunk, ripple/startle unchanged | PASS | e2e "rapping the glass thunks"; cycle-023 tap specs green untouched |
| Mute via M stops sounds, survives reload (localStorage `dino.sound`), unmutes | PASS | e2e "M mutes, persists across reload, and unmutes" (greet under mute records nothing) |
| No AudioContext before first gesture; appears after; boot clean | PASS | e2e "no AudioContext before the first gesture" (`__audioState()` 'none' → not-'none'; zero pageerrors) |
| Suites green + touch sheet unit covers the `sound` row id | PASS | `touch.test.ts` sheet ids updated (10 rows incl. `sound`); 361/131 green |

8/8 PASS.

## Bugs found

None. Checked beyond the criteria:
- Boundary: `@mlc-ai/web-llm` imports only under `game/src/ai/` (grep). `chirp.ts` pure —
  imports only the `Personality` type. `voice.ts` is the only WebAudio file.
- Save format untouched; eggs/sky/huddle/cold untouched; the BACKLOG-189 single-dispatch
  pattern respected (no per-object handlers added).
- Sheet re-base (y 96→64 for the 10th row) verified against the ⋯ button by the existing
  layout unit tests + touch e2e (sheet→hearts still green).
- Mobile autoplay: context creation is reachable ONLY through `markActive` — the same seam
  the touch layer's first tap hits, so phone unlock is the first stick-touch or button-tap.

**Recommendation:** APPROVE
