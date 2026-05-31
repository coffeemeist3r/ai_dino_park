# Cycle 026 — BACKLOG-060 Idle / ambient mode — code plan

**Goal:** the vivarium as a quiet desktop companion. After a still spell the HUD fades and the camera breathes; any input restores it. Completes the fishbowl furniture set.

## New pure module — `game/src/world/idle.ts` (no Phaser, Node-tested)
- `IDLE_AFTER_MS=12000`, `FADE_MS=1500`, `AMBIENT_ALPHA=0.12`.
- `isIdle(idleMs)` — at/after the threshold.
- `hudAlpha(idleMs)` — 1 until threshold, then monotonic lerp 1 → AMBIENT_ALPHA over FADE_MS, clamped.

## Integration — `game/src/scenes/WorldScene.ts`
- Fields: `hudElements[]` (always-on HUD texts), `lastInputAt`, `ambientActive`, `ambientTween`.
- `setupIdle()` (last in create()): seed `lastInputAt`; collect HUD (clock, brain, gift, plaque, lensLabel + the two controls-hint texts pushed in `addControlsHint`); `keydown`/`pointerdown` → `markActive`. Hooks `__idleAlpha`, `__isAmbient`, `__forceIdle(ms)`, `__nudgeInput`.
- `applyIdle()` (called each `update()`): set HUD alpha = `hudAlpha(idleMs)`; `enterAmbient()` once idle.
- `enterAmbient` — slow yoyo zoom tween (1.0↔1.04, 6s) on the main camera. `exitAmbient` — stop tween, reset zoom, HUD alpha → 1.
- `update()`: held movement keys (`isDown`) count as activity (reset `lastInputAt` + exit ambient), since they don't refire `keydown`.

## Tests
- `tests/unit/idle.test.ts` (5): isIdle threshold; hudAlpha full→fade→clamp, half-fade midpoint, monotonic.
- `tests/e2e/cycle-026-idle.spec.ts` (2): forceIdle → alpha<0.5 + ambient true → nudge → alpha 1 + ambient false; a real `KeyW` press wakes it.

## Verdict
APPROVED. 139 unit / 52 e2e green, no flake. web-llm boundary clean. Save unchanged. Fishbowl set complete (056–060).
