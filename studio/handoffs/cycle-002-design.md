# Cycle 2 — Design

## Item
BACKLOG-008 [core] Day/night palette shift — tint overlay based on in-game hour.

## Why this cycle
Cycle 1 gave the world a clock but the park looks identical at noon and midnight. This cycle makes time *visible*: a single full-screen tint overlay whose color and opacity track the in-game hour, lerping smoothly from midnight blue → dawn warmth → clear day → dusk amber → night again. It is cheap (one rectangle, no shaders) and it lights the runway for every later hour-keyed feature (sleeping huddles, dawn plans, dusk reflection).

## What ships
A tint overlay covering the whole 20×15 map, sitting above the grass but below the clock HUD. Boot the game at 08:00 — overlay is effectively clear. Let the clock run (1 real sec = 1 in-game min); as the in-game hour climbs toward evening the screen warms then deepens to blue at night, then lightens back at dawn. The clock HUD text stays readable at all times. Talking to Rex (Z) is unaffected.

A QA tester can verify without waiting a real-world day via two dev-only hooks exposed on `window`:
- `window.__readTint()` → `{ color: number, alpha: number }` of the *live* overlay object.
- `window.__forceHour(h)` → drives the live overlay to the tint for hour `h` (0–23) and returns the new `{ color, alpha }`. Dev-build only, same pattern as the existing `__clockNow` hook.

## Acceptance criteria
- [ ] At in-game 12:00 (noon) the overlay alpha is ≤ 0.05 (effectively clear).
- [ ] At in-game 00:00 (midnight) the overlay alpha is ≥ 0.45 and the color reads blue (blue channel > red channel).
- [ ] At dawn (07:00) and dusk (19:00) the color reads warm (red channel > blue channel) at moderate alpha (0.1 ≤ alpha ≤ 0.45).
- [ ] The tint is continuous: between any two adjacent in-game minutes the alpha changes by ≤ 0.05 (no hard pops).
- [ ] The overlay renders above the grass map and below the clock HUD — HUD text remains visible at midnight.
- [ ] `window.__forceHour(0)` then `window.__readTint()` returns alpha ≥ 0.45; `window.__forceHour(12)` then `window.__readTint()` returns alpha ≤ 0.05.
- [ ] Pressing Z within 2 tiles of Rex still opens the dialog (no regression).
- [ ] `npm run build` clean; vitest + playwright green.

## Out of scope
- Per-tile or per-sprite lighting; shaders; bloom. One flat overlay only.
- Weather, seasons, or color grading beyond time-of-day (those are BACKLOG-028).
- Changing NPC behavior by time of day (later cycles).
- Smooth sub-minute animation/tweens — minute-granular updates off `onTick` are enough.

## Constraints
- Must reuse the existing `WorldClock` (`getWorldClock()`, `onTick`, `now()`) — do not add a second timer.
- Tint math must live in a pure module (no Phaser import) so it is unit-testable in Node, mirroring `clock.ts`.
- Must not break the Z-key dialog flow or the clock HUD readability.
- No new npm dependencies. No new framework.
- TypeScript strict; no `any` except the documented dev-hook pattern already used in `WorldScene`.
