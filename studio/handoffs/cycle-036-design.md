# Cycle 36 — Design

**Item** — BACKLOG-144 [emergent] World-scale night event

## Why this cycle

Every emergent beat the bowl has shipped so far is *pairwise*: one dino comforts one other, the
keeper greets one at a time, a jealous runner-up sulks at a single rival. The park has never
reacted to anything *as a crowd*. BACKLOG-144 is the first collective moment — a rare clear-night
spectacle (a meteor shower or an aurora) that pulls the **whole cast** out of their wandering to
gather under it and share one memory. It's pure emergence: nobody scripts who's there; whoever's
alive in the bowl that night looks up together. It reuses the clock/day-night gating (008), the
movement spine (018), and the memory store (011), so it's a thin, high-delight addition — and it
opens the five follow-ups the Lore-smith just seeded (150–154).

## What ships

- On a **clear night** (the existing night phase — no weather system yet), there is a small
  per-in-game-hour chance that a **sky event** begins. When it does:
  - A shimmering full-map **sky overlay** (tinted to the event — bluish meteors, greenish aurora)
    fades in above the night tint and pulses for the duration.
  - Every dino **abandons its wander and drifts toward a shared gather spot** (an open tile in the
    centre of the bowl, distinct from the den).
  - As each dino reaches the gather spot it throws a floating **✨ awe bubble** and files a single
    **shared memory line** ("the whole sky rained falling stars, and we all watched together").
  - The event **ends** when its duration elapses *or* night passes into dawn; the overlay fades out
    and the cast resumes ordinary wandering.
- Only one sky event runs at a time. The spectacle is rare enough to feel special when left running
  in realtime, but a dev hook forces it on demand for testing.
- The shared memories persist through the **existing** memory store (already saved) — **no save
  format change, no version bump.**

Dev hooks (Playwright, mirroring the existing `__`-hook style):
- `__skyEvent()` → the active event id (`'meteors'`/`'aurora'`) or `null`.
- `__triggerSky(id?)` → force-start an event (default/by id), returns the active id. Bypasses the roll.
- `__skyGazers()` → array of dino names that have gathered + filed the shared memory this event.

## Acceptance criteria

- [ ] `rollSkyEvent` returns `null` when it is **not** a clear night (no daytime sky events).
- [ ] `rollSkyEvent` returns `null` when an event is **already active** (never two at once).
- [ ] On a clear night with no active event, `rollSkyEvent` returns an event iff the chance-roll is
      under the configured chance; `pickSkyEvent` maps a 0..1 roll across all `SKY_EVENTS` (each
      event reachable).
- [ ] `__triggerSky()` activates an event: `__skyEvent()` returns its id and the sky overlay becomes
      visible (alpha > 0).
- [ ] With an event active, pumping the world (`__stepWorld` repeatedly) draws every dino toward the
      gather tile; `__skyGazers()` eventually lists the **entire** cast.
- [ ] Each gazer files the **same** shared memory line, and that line is present in the exported
      save's `memory` store for a gathered dino (persists).
- [ ] The event ends when its duration elapses or night passes: after expiry `__skyEvent()` → `null`,
      the overlay is hidden (alpha 0 / invisible), and dinos resume normal wandering.
- [ ] No regression: boot is console-error-clean; the tone-greet menu (142), feeding (059), huddle
      (041), and homecoming (112) flows still pass their existing specs.
- [ ] Boundary + additivity: `world/skyEvent.ts` imports nothing from `@mlc-ai/web-llm`; `SAVE_VERSION`
      is unchanged and no field is added to `SaveData`.

## Out of scope

- Weather/seasons (BACKLOG-028) — a sky event is a *discrete* emergent moment, not a weather system.
- Personality-shaded reactions (150), slept-through-it gossip (151), book line (152), wishing (153),
  and the star-fragment keepsake (154) — all seeded as follow-ups; this cycle ships the spine where
  the whole cast reacts uniformly.
- Persisting an in-progress event across reload — the beat is transient (like homecoming/comfort);
  only the *memory* of it persists. A reload mid-event simply doesn't resume the spectacle.
- New art / particle sprites — the shimmer is a tinted overlay + emoji bubbles, no Artist work.

## Constraints

- Logic lives in a pure, Node-testable `world/skyEvent.ts` (no Phaser, no WebLLM); WorldScene glue
  stays thin, mirroring how huddle/feeding overrides already gate `forceStep`.
- The gather override must sit **above** the food/huddle overrides in `forceStep` so the spectacle
  wins, then cleanly hand movement back when the event ends.
- Must not break the tone menu / dialog flow, the `E`/`Z` interact path, or the `__stepWorld`
  /`__advanceMinutes` hooks the e2e suite depends on.
- Additive only: reuse `stepToward`, `remember`, `getWorldClock`, `dayPhase`/`isNight`. No new deps.
