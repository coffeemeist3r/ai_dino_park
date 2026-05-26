# Cycle 1 — Design Handoff

## Item

**BACKLOG-007 [core] World tick clock** — in-game minute every real second, hour event broadcast

## Why this cycle

Nothing in the backlog below BACKLOG-007 can land without authoritative in-game time. Day/night (008), daily NPC plans (012), reflection (014), sleeping huddles (041), catchphrase logging (045) — all need a clock. A `clock.ts` stub already exists with the right `GameTime` shape and pure `advanceMinutes()` helper. This cycle promotes that stub to a real Phaser-driven ticker and wires it into the scene. Small, contained, high leverage.

## What ships

A `WorldClock` class that integrates with Phaser's timer system. When the scene starts, the clock ticks once per real second, advancing game time by one in-game minute. On each hour boundary (minute 59 → 0), the clock emits an `'hour'` event carrying the new `GameTime`. A HUD text label in the top-left corner shows the current day and time (e.g., `Day 1 — 08:00`). A unit test confirms the tick math and event firing.

A QA tester should:
1. Launch the game.
2. Wait ~10 real seconds.
3. See the HUD clock advance by 10 in-game minutes.
4. Wait until the clock crosses an hour boundary (or start at 08:50 in a test build and wait 10 seconds).
5. Confirm the HUD updates to the next hour.

## Acceptance criteria

- [ ] Launching the game shows a HUD text element at the top-left reading `Day 1 — 08:00` at start.
- [ ] After 1 real second the HUD reads `Day 1 — 08:01` (±100 ms).
- [ ] After 60 real seconds the HUD reads `Day 1 — 09:00`.
- [ ] `WorldClock` emits an `'hour'` event (Phaser EventEmitter) each time the in-game hour advances.
- [ ] The `'hour'` event payload is a `GameTime` object with correct `{ day, hour, minute: 0 }` values.
- [ ] `clock.now()` returns the correct current `GameTime` after any number of ticks.
- [ ] Vitest unit test: advance clock 60 times × 1 minute; assert `hour` event fired once with `hour === 9` and `minute === 0`.
- [ ] `npm run build` exits 0.
- [ ] `npm run test:unit` exits 0.

## Out of scope

- Pausing the clock during dialog (future QoL).
- Persisting clock state to IndexedDB (BACKLOG-009).
- Day/night palette shift (BACKLOG-008, next cycle priority after clock).
- NPC behaviors driven by time (BACKLOG-012, needs clock as foundation — now unblocked).
- Clock speed setting (debug option, future infra item).

## Constraints

- **Must not break** existing `now()` export from `clock.ts` — return type `GameTime` stays identical.
- **No new npm packages.** Phaser's built-in `Phaser.Events.EventEmitter` is available in-browser; Vitest tests may use Node's native `EventEmitter` if `Phaser` is not available in the test environment.
- **Must not break** Z-key dialog flow in `WorldScene`.
- `WorldClock` should be a singleton (one per scene) — export a `createClock()` factory or a class; Code-planner chooses.
- HUD font: white, size 12, shadow offset (1, 1) dark — matches Gen3 aesthetic without new assets.
- Clock starts at `{ day: 1, hour: 8, minute: 0 }` — same as the stub default.
