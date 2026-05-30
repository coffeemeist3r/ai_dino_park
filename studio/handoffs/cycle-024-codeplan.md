# Cycle 024 — BACKLOG-058 The Plaque — code plan

**Goal:** an engraved nameplate under the bowl that sells the "kept specimen" feel and surfaces a live emergent stat (family-tree depth).

## New pure module — `game/src/ui/plaque.ts` (no Phaser, Node-tested)
- `Lineaged { name; parents? }`.
- `generationOf(name, byName, memo, seen)` — founders gen 1; born = 1 + deeper parent; memoized + cycle-guarded.
- `maxGeneration(born)` — deepest generation across all born (1 when none).
- `plaqueLines({population,day,generations})` → `['VIVARIUM · Pocket Cretaceous', 'Day N · M specimens · G generations']` with pluralization.

## Integration — `game/src/scenes/WorldScene.ts`
- `setupPlaque()` (end of `create()`): brass-styled Text bottom-center (origin 0.5,1; depth 11; serif, gold on dark-brown). `refreshPlaque()` on every clock tick. `__plaque()` hook → `{population, day, generations}`.
- `generations = maxGeneration(this.born)`.

## Tests
- `tests/unit/plaque.test.ts` (5): gen 1 founders, gen 2 child, gen 3 grandchild, self-parent no-loop, plaqueLines pluralization.
- `tests/e2e/cycle-024-plaque.spec.ts` (1): plaque reports population ≥5 / day ≥1 / gen ≥1, then population +1 and generations ≥2 after a forced hatch.

## Notes
- Recurring parallel-load e2e flake (hooks read before create() attaches) — filed an out-of-scope task to add a shared "scene ready" boot wait.

## Verdict
APPROVED. 125 unit / 48 e2e green (isolated flakes only, green on confirm run). web-llm boundary clean.
