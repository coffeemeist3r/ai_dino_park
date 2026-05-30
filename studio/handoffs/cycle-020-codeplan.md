# Cycle 020 — BACKLOG-019 Gossip propagation — code plan

**Goal:** a dino who witnessed an event tells the next dino it meets, so news spreads through the park. Builds on memory (cycle 17) + meetings/converse (cycles 11/14).

## New pure module — `game/src/social/gossip.ts` (no Phaser, Node-tested)
- `RUMOR_MARK = 'told me:'` — a memory carrying this is second-hand and won't re-spread.
- `swapPronouns(s)` — first→third person (`you`→`they`, `your`→`their`, `you're`/`you'd`).
- `isShareable(event)` — true unless the event is itself a rumor.
- `pickGossip(events)` — most recent first-hand event, or null.
- `makeRumor(speaker, event)` — `"${speaker} told me: ${swapPronouns(event)}"`.
- `spreadGossip(store, speaker, listener)` → `{ store, rumor }` — plants one rumor in the listener's memory; no-op on self/empty.

## Integration — `game/src/scenes/WorldScene.ts`
- One line in `converse(a,b)`: `this.memory = spreadGossip(this.memory, a.name, b.name).store;` — runs in the existing throttled/guarded conversation path, so gossip spreads at chat cadence (not every adjacency) and naturally rides the save + the "Lately: …" prompt.
- Dev hook `__spreadGossip(a,b)` for deterministic tests.

## Why this is the right size
- 1-hop cap (rumors marked non-shareable) prevents runaway loops/flooding the 6-slot ring buffer.
- No new save field — rumors live in the existing `memory` store.

## Tests
- `tests/unit/gossip.test.ts` — 7 cases (pronoun swap, shareability, pick, makeRumor, spread + no re-spread + self/empty no-op).
- `tests/e2e/cycle-020-gossip.spec.ts` — rumor planted and provably not re-shared; news reaches ≥1 dino over 40 mingling steps.

## Verdict
APPROVED. 99 unit / 41 e2e green (e2e ×2, no flake). web-llm boundary clean.
