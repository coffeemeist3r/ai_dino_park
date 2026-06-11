# Cycle 44 — Design

**Item** — BACKLOG-191 [core] Audio spine: per-dino trait-pitched chirp synthesis + tap-glass thunk, authored as code (WebAudio), autoplay-safe, persisted mute.

**Why this cycle** — Forty-four cycles of silence. The operator nudged sound the same day the
bowl learned to live on a phone, and the Living-minds lens reshapes it into a distinctness
feature: each dino gets a *voice* derived from its traits, so the first audio in the park is
already a personality tell. Sunny rumbles low and slow; Twitch squeaks high and fast. One pure
module, two existing seams (the greet/convo line, the glass tap), one toggle. Everything in
192–195 leans on this spine.

**What ships**

1. A pure, Node-testable module `game/src/audio/chirp.ts`:
   - `chirpParams(traits)` — deterministic mapping from the 5 personality axes to synth
     parameters `{ pitchHz, lengthMs, wobble, notes }`, bounded and documented. Same traits →
     same params. Low-energy/low-bravery dinos pitch lower and slower; high-energy higher and
     quicker. (Species/size flavor comes free via the name-seeded traits.)
   - `THUNK` — fixed parameter set for the glass rap.
2. A thin WebAudio voice `game/src/audio/voice.ts` (browser-only, lazily constructed):
   - `playChirp(params)` / `playThunk()` synthesizing short oscillator blips (≤350ms,
     master gain ~0.15). **No audio assets, no downloads.**
   - AudioContext created/resumed only after a user gesture (Phaser input event) —
     autoplay-safe on phone Chrome.
   - `setMuted(on)` / `isMuted()` backed by localStorage `dino.sound` ('on'/'off',
     **default on**).
3. Scene glue:
   - A dino chirps its own voice when it speaks: player-greet reply and dino↔dino convo
     bubble both route through one `voiceFor(dino)` call.
   - Tap-the-glass plays the thunk alongside the ripple.
   - Mute toggle: **M** key, and a `🔊 sound` row in the touch More sheet (next to minds).
   - Dev hooks: `__lastSound()` (last played: `{kind:'chirp'|'thunk', name?, params?}`),
     `__soundMuted()`, `__audioReady()`.

**Acceptance criteria**

- [ ] `chirpParams` is deterministic and bounded: identical traits give identical params; pitch stays within 120–900 Hz, length within 80–350 ms, for all trait corners (0s, 1s, mixed).
- [ ] Distinctness is audible in the numbers: params for Sunny's traits and Twitch's traits differ in pitch by ≥ 100 Hz (Twitch higher), and the five founders produce ≥ 4 distinct pitches.
- [ ] Greeting a dino (E → tone pick → reply) records `__lastSound()` = chirp with that dino's name when sound is on.
- [ ] A forced dino↔dino conversation (`__forceConverse`) records a chirp for the speaker.
- [ ] Tapping the glass records `__lastSound()` = thunk (and still ripples/startles as before).
- [ ] Muting via M (or the sheet row) stops new sounds (`__lastSound()` stays null after a greet) and survives a reload (localStorage `dino.sound` = 'off'); unmuting resumes.
- [ ] No AudioContext exists before the first user gesture (`__audioReady()` false on a fresh boot before input, true after a key/tap) — no autoplay-policy console warnings on boot.
- [ ] Boot is clean (no new pageerrors) and the full suites stay green; the touch sheet unit test covers the new `sound` row id.

**Out of scope** — Dawn chorus (192), call-and-answer (193), distress calls (194), book cries
(195); ambient soundscape/night crickets; volume slider; per-species hand-tuned voices beyond
the trait mapping; any audio asset files.

**Constraints**

- WebAudio synthesis only — importing/fetching audio files is a CHARTER violation (medium is code).
- `chirp.ts` stays pure (no `AudioContext`, no Phaser, no DOM) so Vitest runs it in Node;
  all browser audio lives in `voice.ts` and is lazily constructed.
- Autoplay safety: context creation/resume strictly behind the existing first-input paths
  (keyboard handler / pointer handler the touch layer already owns). No context at module eval.
- The mute row joins `sheetRows` in `input/touch.ts` — update the layout unit test ids; the
  More-sheet dispatch goes through `onTouchButton` (single-dispatch — no per-object handlers).
- M key is unbound today (verify with grep) — bind without disturbing existing keys.
- Don't touch the NPCBrain boundary, the save format, eggs/sky/huddle, or the glass-tap guard.
- Keep it QUIET: master gain ≤ 0.15, chirps ≤ 350ms — desk companion, not a noise box.
