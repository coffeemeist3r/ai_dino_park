# Cycle 023 — BACKLOG-057 Tap the glass — code plan

**Goal:** the keeper raps the vivarium wall (a click); nearby dinos startle by temperament. First "touch the bowl" interaction.

## New pure module — `game/src/world/startle.ts` (no Phaser, Node-tested)
- `StartleReaction = 'bolt' | 'investigate' | 'ignore'`, `STARTLE_RANGE = 6` tiles.
- `reactionFor(bravery, distTiles)` — out of range → ignore; bravery ≥ 0.55 → investigate, else bolt.
- `fleeStep(from, tap, cols, rows)` — one tile directly away along the dominant axis, clamped; a same-tile tap still nudges off.
- `startleStep(from, tap, reaction, cols, rows)` — investigate → `stepToward`, bolt → `fleeStep`, ignore → stay.

## Integration — `game/src/scenes/WorldScene.ts`
- `setupTap()` (end of `create()`): `this.input.on('pointerdown', p => this.tapGlass(p.worldX, p.worldY))` + `__tapGlass(px,py)` hook.
- `tapGlass(px,py)`: ripple ring at the tap; convert px→tile; for each dino compute Euclidean tile distance → `reactionFor`; apply 2× `startleStep`; flash ❗/❓ + label color; write a "the glass shook…" memory (so it feeds gossip). Returns `[{name,reaction}]`.
- `spawnRipple` (tween expanding ring, depth 9), `flashStartle` (❗/❓ mark + label tint, 700ms).

## Tests
- `tests/unit/startle.test.ts` (6): range gate, bold/timid split, flee direction + edge clamp + same-tile nudge, startleStep dispatch.
- `tests/e2e/cycle-023-tap.spec.ts` (2): tap on a dino → reacts (non-ignore) + remembered + no errors; tap across the bowl → a far dino ignores.

## Verdict
APPROVED. 120 unit / 47 e2e green (one known cycle-002 parallel flake, green isolated + on confirm run). web-llm boundary clean. Live eyeball skipped — preview tooling flaky; behavior covered by e2e.
