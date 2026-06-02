# Cycle 28 — Design

## Item
BACKLOG-105 [core] Wall-clock-anchored time + configurable scale.

## Why this cycle
The operator's latest ask is literal: "make time realtime so I can just leave it running." Today's `WorldClock` counts ticks — one Phaser timer event = one in-game minute — so in a backgrounded tab (where Phaser's rAF/timers throttle) the clock silently falls behind real time. We re-base time on `Date.now()` so the in-game clock is always correct on return, default it to **1× realtime** (a full day/night = 24 real hours, the true fishbowl), and add a **scale knob** (1× ⇄ 60×) for active watching. This is the cornerstone that unblocks BACKLOG-106 (offline catch-up) and gives the queued realtime rituals (108–111) a real day to hang on.

## What ships
- The clock derives the current `GameTime` from wall-clock elapsed time × a scale multiplier, anchored at an epoch persisted/re-based in memory — not from counting timer fires. `tick()` is preserved as the one-minute boundary primitive (tests + `__advanceMinutes` still use it).
- **Default scale = 1× realtime.** 1 real minute = 1 in-game minute, so a full in-game day takes 24 real hours.
- A **scale toggle** on the **T** key cycles 1× ⇄ 60× (60× = the old feel: 1 real second ≈ 1 in-game minute, 24 in-game hours in 24 real minutes). Toggling never jumps the clock — it re-anchors at the current time.
- The clock HUD shows the active scale, e.g. `Day 1 — 08:00 ·1×`.
- When the tab has been backgrounded (or otherwise not pumped) and is resumed, the next pump catches the clock up to true wall-clock time. Catch-up is **capped** (one in-game day of per-minute listener fires); a gap larger than the cap jumps the clock forward without flooding listeners. (Rich "while you were away" catch-up is BACKLOG-106, not this cycle.)
- `SaveData` gains additive `savedAt` (real epoch ms at save) and `scale` fields — the seed BACKLOG-106 needs. Old saves without them still load.
- On save-restore, the clock re-anchors to the restored time and flows forward in realtime from *now* (it does NOT fast-forward elapsed-since-save — that's 106).

## Acceptance criteria
- [ ] At default scale, advancing wall-clock time by 60 000 ms advances the in-game clock by exactly 1 minute (testable via injected `now()` source / `__advanceWall`).
- [ ] At scale 60×, advancing wall-clock time by 60 000 ms advances the in-game clock by 60 minutes.
- [ ] `tick()` still advances exactly one in-game minute and fires `onTick`/`onHour` as before (existing clock tests stay green unchanged).
- [ ] A wall-clock advance that crosses an hour boundary fires `onHour` once per crossed hour (within the catch-up cap).
- [ ] A single wall-clock advance larger than the catch-up cap jumps the clock to the correct target time without firing more than the cap's worth of `onTick` callbacks (no freeze).
- [ ] Pressing **T** toggles scale 1× ⇄ 60×; `window.__clockScale()` reflects it and the clock HUD text shows the active scale.
- [ ] Toggling scale does not change the currently displayed time at the instant of toggle (no jump).
- [ ] `serialize`/`deserialize` round-trip `savedAt` and `scale`; a save JSON lacking both still deserializes (defaults: `scale` → 1).
- [ ] `npm run build` clean; full vitest + playwright suites green.

## Out of scope
- BACKLOG-106 offline catch-up (using `savedAt` to fast-forward relationships/memory/gossip on load) — only the `savedAt`/`scale` save fields are added here, not the fast-forward.
- BACKLOG-107 inference governor / `visibilitychange` pausing.
- Any new day-rhythm behavior (108–111).
- A scale UI beyond the T toggle + HUD readout (no slider).

## Constraints
- Keep `WorldClock` pure / Node-testable: the wall-clock source must be **injectable** (a `now()` function defaulting to `Date.now`) so unit tests drive time deterministically without a browser.
- Preserve `tick()`, `set()`, `now()`, `onTick`, `onHour`, `getWorldClock()`, `resetClockForTest()` signatures so no existing caller breaks. `__advanceMinutes` must keep working.
- Additive save only — `SAVE_VERSION` stays 1; old saves must still load.
- `@mlc-ai/web-llm` stays out of this code (clock has no AI; trivially satisfied — just don't introduce it).
- Do not regress the day/night tint, autosave-on-hour, or any spec that drives time via `__advanceMinutes`.
