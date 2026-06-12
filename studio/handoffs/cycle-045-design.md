# Cycle 45 — Design

## Item
BACKLOG-192 [emergent] Dawn chorus — at the dawn boundary the cast greets the day each in
its own voice (191's trait-pitched chirps), staggered by energy: early risers first,
night-owls last and grudging.

## Why this cycle
Cycle 44 shipped the voices (191); they currently only sound on a player greet, a dino↔dino
meeting, or a glass tap. The dawn chorus is the first time the bowl makes sound *on its own
clock* — a daily ritual the keeper can catch, where the order is a personality read drawn from
the same `energy` trait that already clips each voice's length. It's the queued spine for the
whole audible-day arc (196–200), one-cycle sized, and leans entirely on shipped pieces: the
`onHour` seam (reflection, season turn), the `chirpFor` voice path, and the `energy` axis.
No new systems — just *when*.

## What ships
- When the in-game clock **ticks live across the dawn boundary** (crossing into hour 7, the
  warm visible dawn already painted by the day/night overlay), the whole cast greets the day:
  each dino plays its own trait-pitched chirp (BACKLOG-191), **staggered by energy** — the
  highest-energy dino chirps first (≈immediately), the lowest-energy last (after a short
  spread), so you hear the morning roll across the bowl from the eager risers to the grudging
  night-owls.
- A single faint **🌅 dawn** line in the event log marks the moment (one line, not five
  bubbles — the *sound* is the beat; the cast stays uncluttered).
- The chorus fires **at most once per in-game day** and **only on a live tick crossing** — boot,
  save-restore, and the away fast-forward (which use `clock.set()`, bypassing `onHour`) are
  silent. Muting (M / the 🔊 sheet row) silences playback exactly like every other voice.
- Order is computable from a **pure function** (`audio/chorus.ts`) so QA can assert *who sings
  when* without playing or hearing anything; the scene records the last-fired order on a dev
  hook.

## Acceptance criteria
- [ ] `chorusOrder(dinos)` (pure, in `game/src/audio/chorus.ts`) returns the dinos ordered by
      descending `energy` (highest-energy first), each paired with a `delayMs ≥ 0`.
- [ ] The first entry has `delayMs === 0`; `delayMs` is **non-decreasing** down the order; the
      last (lowest-energy) entry has the largest delay (`> 0` whenever the cast's energies differ).
- [ ] Ties in `energy` break **alphabetically by name**, so the order is deterministic /
      stable across runs.
- [ ] For the name-seeded founders, the computed order places the highest-`energy` founder
      first and the lowest-`energy` founder last (assert against their actual seeded traits, not
      a hand-picked name).
- [ ] A **live** hour-tick crossing into hour 7 fires the chorus exactly once: a dev hook
      `__lastChorus()` returns the fired order (array of `{name, delayMs}`) and `__dawnCount()`
      increments by 1.
- [ ] Crossing the same boundary again within the *same* in-game day does not re-fire
      (`__dawnCount()` unchanged); a fresh day's dawn fires again.
- [ ] Staging the clock to hour 7 via the restore-style `__setClock` (no live tick) does **not**
      fire the chorus (`__dawnCount()` stays 0) — boot/restore/away are silent.
- [ ] With sound muted, the chorus still computes its order (`__lastChorus()` populated) but
      plays nothing (`__audioState()` shows no running playback / no chirp intent recorded as
      heard) and raises zero page errors.
- [ ] A 🌅 dawn line appears in the event log when the chorus fires.
- [ ] Build clean; full unit + e2e suite green.

## Out of scope
- The closing **night hush** (196), the **keeper-joinable** call-back (197), the **off-key
  loner** (198), the **book lead** (199), and **harmonized pairs** (200) — all queued follow-ups.
- Any visual wake beat / ⤴ stretch (that's the unshipped BACKLOG-108) — 192 is audio + one log
  line only.
- Diurnal/nocturnal temperament (BACKLOG-109) as a *separate* trait — "night-owl" here means
  simply low `energy`; 109 stays a future axis the chorus can later read instead.
- Per-dino harmony/pitch-blending, volume ducking, or any change to `chirp.ts`/`voice.ts`
  synthesis. Reuse `chirpFor` / `playChirp` unchanged.

## Constraints
- **Live-only**: fire from the existing `onHour` listener (it does not fire on `clock.set()`),
  guarded so boot/restore/away are silent. Mirror the season-turn (159) / cold-morning (179)
  discipline.
- **Stagger via the scene scheduler**: use `this.time.delayedCall(delayMs, …)` for each dino's
  chirp; keep the total spread short (a desk companion, ≤ ~2 s across the whole cast).
- **Audio boundary**: play only through the existing `chirpFor`/`playChirp` path; respect
  `soundMuted()` and the unlocked AudioContext. No new WebAudio code; `voice.ts` stays the only
  file touching `AudioContext`.
- **No save-format change** — the once-per-day guard is transient scene state (last-dawn day),
  re-derived from the clock; do not bump `SAVE_VERSION`. Additive only.
- **NPCBrain untouched** — no inference in play. `@mlc-ai/web-llm` stays only under `game/src/ai/`.
- Must not disturb the existing hour-6 reflection or the hour-driven season turn / autosave.
