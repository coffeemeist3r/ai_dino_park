# Cycle 44 — Code Plan

**Item** — BACKLOG-191 [core] Audio spine: per-dino trait-pitched chirp synthesis + tap-glass thunk, autoplay-safe, persisted mute.

## Files to create

- `game/src/audio/chirp.ts` — PURE (no Phaser/DOM/AudioContext).
  - `export interface ChirpParams { pitchHz: number; lengthMs: number; wobble: number; notes: number }`
  - `export function chirpParams(t: Personality): ChirpParams` — deterministic mapping:
    pitch 120–900 Hz rising with `energy` and falling with `bravery`+size-proxy
    (`1 - sociability*0.2`); length 80–350 ms falling with energy; wobble 0–1 from
    `curiosity`; notes 1–3 from `agreeableness`. Clamp everything; document the mapping.
  - `export const THUNK: ChirpParams` — fixed low blip (≈90 Hz, 120 ms, 0 wobble, 1 note).
  - `export const SOUND_KEY = 'dino.sound'` (mirrors `MINDS_CONSENT_KEY` pattern).
- `game/src/audio/voice.ts` — browser-only WebAudio glue, lazily constructed.
  - module state: `ctx: AudioContext | null`, `muted` initialised from
    `localStorage[SOUND_KEY]` (default ON).
  - `export function unlockAudio(): void` — create/resume the context; called ONLY from
    existing input handlers. No context at module eval (autoplay-safe).
  - `export function playChirp(p: ChirpParams): void` / `export function playThunk(): void` —
    oscillator (triangle for chirps, sine for thunk) + gain envelope, master gain 0.12,
    `notes` short pips with `wobble` as pitch bend. No-op when muted or no ctx.
  - `export function setSoundMuted(on: boolean)` / `export function soundMuted(): boolean` —
    persist via localStorage with the same try/catch tolerance as the minds consent.
  - `export function audioReady(): boolean` — ctx exists and state === 'running'.

## Files to modify

- `game/src/scenes/WorldScene.ts`
  - import the two audio modules; add `private chirpFor(d: Dino): void` (≈3 lines:
    `playChirp(chirpParams(d.traits))` + record `lastSound` for the hook).
  - **Greet reply seam (~line 1833):** call `this.chirpFor(target)` beside `dialog.show`.
  - **Convo seam (~line 1246):** call `this.chirpFor(a)` beside the bubble.
  - **Glass seam (`tapGlass`):** `playThunk()` beside `spawnRipple`; record for hook.
  - **Unlock seam:** call `unlockAudio()` inside the existing `markActive` idle hook
    (`setupIdle`, line ~253) — it already fires on every keydown AND pointerdown; one line.
  - **M key:** bind next to the other key bindings → `setSoundMuted(!soundMuted())`.
  - **More sheet:** `case 'sound': setSoundMuted(!soundMuted()); break;` in `onTouchButton`.
  - **Hooks:** `__lastSound()`, `__soundMuted()`, `__audioReady()` (in `setupGovernor`'s
    hook block or beside it).
- `game/src/input/touch.ts` — add `['sound', '🔊 sound']` row to `sheetRows` (after `minds`).

## Reuse list

- `Personality` type + name-seeded traits — `game/src/ai/personality.ts` (the voice IS the traits).
- localStorage on/off pattern with try/catch — `governor.ts` `MINDS_CONSENT_KEY` + WorldScene `readMindsConsent`.
- `markActive` (setupIdle) as the single first-gesture seam — already wired to keyboard + pointer.
- Single-dispatch touch taps (`onTouchButton`) — chips/sheet race fix from BACKLOG-189; do NOT add per-object handlers.
- `showBubble` / `dialog.show` seams stay untouched — chirp calls sit BESIDE them, not inside.

## New dependencies

none — WebAudio is a browser built-in. (Adding an audio library would need a CHARTER amendment; explicitly not requested.)

## Test plan

- Unit `tests/unit/chirp.test.ts` (vitest, pure):
  - determinism: same traits object twice → deep-equal params.
  - bounds: trait corners (all 0, all 1, alternating) stay in 120–900 Hz / 80–350 ms / 0–1 wobble / 1–3 notes.
  - distinctness: founder traits (seed via `personality.ts` name-seeding for the 5 roster names) give Twitch ≥ 100 Hz above Sunny; ≥ 4 distinct pitches among 5 founders.
  - THUNK is low + short ( < 150 Hz, ≤ 150 ms).
  - SOUND_KEY === 'dino.sound'.
- E2E `tests/e2e/cycle-044-sound.spec.ts` (desktop chromium, headless WebAudio exists):
  - boot → `__audioReady()` false (no gesture yet — boot() must not synthesize input first; goto only), after a key press → true; no pageerrors.
  - warp to Rex, greet via E + tone pick → `__lastSound()` is `{kind:'chirp', name:'Rex'}`.
  - `__forceConverse()` → chirp recorded for the speaker.
  - tap canvas (mouse click on open ground) → `__lastSound()` thunk.
  - press M → `__soundMuted()` true → greet → `__lastSound()` unchanged/null; reload → still muted (localStorage); M again → unmuted.
- Touch unit: update `tests/unit/touch.test.ts` sheet ids (insert `sound`).

## Risks

- **Autoplay-policy console noise:** creating an AudioContext before a gesture logs a warning
  in Chrome. Guard: context construction ONLY inside `unlockAudio()`, which only runs from
  `markActive`. The boot-is-clean e2e criterion pins this.
- **Headless audio:** headless Chromium supports AudioContext but may keep state 'suspended';
  `audioReady()` may legitimately read false. Hooks therefore record INTENT (`__lastSound`)
  at the call site regardless of context state — sound assertions never depend on actual
  playback. (`playChirp` records, then no-ops gracefully.)
  → record the hook value in the SCENE (chirpFor), not inside voice.ts, so the pure/browser
  split stays clean.
- **e2e first-gesture ordering:** `boot()` helper only `goto`s + waits — no synthetic input —
  so the pre-gesture assert is safe; but `__warpTo` etc. are evaluate() calls, not gestures —
  they don't unlock audio, which is correct and expected.
- **Idle/ambient:** chirps during ambient drift could be eerie — convo chirp fires only when
  a convo fires, which the governor already pauses when hidden; acceptable.
- The dino↔dino convo seam fires from async `converse` — chirp before the await (when the
  bubble shows), not when the request starts.

## Estimated touch count

~5 files (2 new, 2 modified, 2 test files — one new, one edited). Within budget.
