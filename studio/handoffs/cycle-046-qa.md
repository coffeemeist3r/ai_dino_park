# Cycle 46 — QA Handoff

**Item** — BACKLOG-194 distress call

**Build:** ✅ clean (tsc + vite + PWA precache)
**Unit tests:** ✅ 395/395 (+8 `distress.test.ts`)
**E2E tests:** ✅ 149/149 in ONE fresh full parallel run (+6 `cycle-046-distress.spec.ts`), no flake this run. (First full run: 148/149 — see Bugs found; fixed, then isolated 11/11 + the fresh full run above.)

## Acceptance criteria

| criterion | status | evidence |
|---|---|---|
| `distressParams` strictly higher / strictly shorter / ≤1100 / ≥60ms / 2 notes; founders keep pitch order | **PASS** | unit: "strictly higher, strictly shorter…", "stays clamped at every trait corner", "founders keep their pitch order" (Twitch 1076 > Mossback 200) |
| `mostDistressed`: lowest level, alpha tie-break, empty → null | **PASS** | unit: 3 dedicated tests |
| Tap with bolters → exactly one cry, from a bolter, `trigger:'startle'` | **PASS** | e2e "one tap, one cry" — cry name asserted ∈ that tap's bolt set; lowest-bravery pick pinned by unit |
| Tap nobody bolts from → no cry | **PASS** | e2e "a tap nobody bolts from raises no cry" (farthest-corner tap, all reactions `ignore`, `__lastDistress` null) |
| Winter cold morning → one cold cry from the cold set; warm morning silent | **PASS** | e2e "the winter cold morning finds a voice…" — `trigger:'cold'`, name ∈ `__coldSleepers`; summer staging → `__lastDistress` null. (The loneliest-pick math is unit-pinned; e2e asserts membership to stay robust against incidental meet-bonds during staging steps.) |
| Responder = `comforter()` semantics, 👂 bubble, "heard X cry out" memory | **PASS** | e2e "the closest friend hears the cry…" — bonded pair → responder Glade→Twitch, memory in `__memory`; comforter floor/gratitude themselves re-proven by cycle-033/034 specs green in the full run |
| Responder distance strictly decreases; countdown clears on arrival/budget | **PASS** | same e2e — one-step live-tile Manhattan check (d1 < d0 unless already adjacent), `__distressResponder` null after ≤8 steps |
| No friend over the floor → cry unanswered, responder null | **PASS** | e2e "a friendless cry hangs unanswered" |
| Mute gates playback only; the social beat fires regardless | **PASS** | e2e "mute silences the playback, never the bowl" — `__lastDistress` + responder + memory land, `__lastSound` null |
| No save change; no regressions; boundaries clean | **PASS** | no `saveGame.ts`/`SAVE_VERSION` touch in the diff; full run green incl. the sentries (018 huddle, 019 egg, 023 tap, 033/034 comfort, 043 cold, 044 sound, 045 chorus); grep: `@mlc-ai/web-llm` only under `ai/`, real `AudioContext` usage only in `voice.ts` (other hits are comments) |

**10/10 PASS.**

## Bugs found

- **Stale assertion in `cycle-044-sound.spec.ts` ("rapping the glass thunks")** — failed on the first full run. Root cause is the new feature working as designed: a mid-canvas tap now startles a bolter, whose distress cry plays *after* the thunk, and the `__lastSound` hook keeps only the last intent — so the spec read `chirp` where it expected `thunk`. The thunk itself still plays first on every rap (the production path is unchanged ahead of the cry). Fixed **test-side, in-session** (the cycle-037 precedent): the spec now raps the stretch of glass farthest from the cast, so no dino is in startle range and the thunk stands alone — a strictly better isolation of the original 044 criterion. Production code untouched by the fix; re-ran isolated (11/11) and the fresh full run (149/149).

## Recommendation

**APPROVE.**
