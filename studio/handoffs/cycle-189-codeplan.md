# Cycle 189 — Code plan

## Structure track — BACKLOG-607 (lands first: owns the shared seam)

**Item:** a youngster keeps to its guardian.

**Files to create:** `tests/unit/cycle-189-guardian.test.ts`, `tests/e2e/cycle-189-guardian.spec.ts` (both tracks' specs).

**Files to modify:**
- `game/src/world/growth.ts` — add `guardianOf({ name, parents, friend, groundOf })`, `TETHER_TILES = 3`,
  `tetherStep(cur, guardian, wander)` (pure Chebyshev leash over a precomputed wander step).
- `game/src/scenes/WorldScene.ts` — private `guardianNow(d)` (young + `guardianOf` over `born` parents,
  `bestFriendOf`, `dinoZones`); the final `else` of the `forceStep` movement ladder runs the wander through
  `tetherStep` when a guardian exists; `__guardian(name)` + `__tether()` hooks.

**Reuse list:** `stageOf` (growth.ts), `moltWitnesses`'s same-ground read shape (molt.ts), `wanderStep`/`stepToward`
(movement.ts), `zoneOf(this.dinoZones, n, BOWL_ID)`, `bestFriendOf`, `born[].parents`, `chebyTiles`.

**New dependencies:** none.

**Test plan:** unit — guardianOf precedence/ground/self/none; tetherStep beyond/within/hold. e2e — `__guardian('Pip')`
is Bramble on a fresh save; 40 steps, on every step where Pip's activity is `wandering`, Chebyshev(Pip, Bramble) ≤ 3
after a settle-in of a few steps; after `__moltNow('Pip')` guardian is null.

**Risks:** Pip's path changes → meetings with Bramble change → bond values move; any spec that pinned Pip's bonds via
the walk could shift (cycle-188 lesson). The dir roll is still drawn, so RNG count is unchanged.

**Estimated touch count:** ~4 files.

## Lore track — BACKLOG-320 (reshaped)

**Item:** the youngster copies its guardian's idle quirk.

**Files to modify:**
- `game/src/world/fidget.ts` — `copyLine(guardian, label)` → `copies <G> — <label>`; `stopCopyingTicker(name, g, ownLabel)`;
  `copiedMemory(g, label)`.
- `game/src/scenes/WorldScene.ts` — `refreshActivityMarks`: wandering glyph uses the guardian's `fidget` when
  `guardianNow(d)` and no mood/lift; book `quirk:` uses `copyLine` for a guarded youngster; `moltDino`: read the
  guardian before the molt, then `liftMood`-style window (`liftedUntil`) + ticker + memory.

**Reuse list:** `fidget`, `reliefFlourish`, `liftedUntil`/325 window, `logEvent`, `remember`.

**Test plan:** unit — copy strings; Pip's and Bramble's founding quirks differ. e2e — `__activityMark('Pip')` equals
Bramble's `__fidget` glyph on a fresh save (after a refresh frame); book row quirk `copies Bramble`; after molt the
ticker line, the memory, and Pip's own quirk in the book.

**Risks:** `__activityMark` only updates on a refresh tick — poll it.

**Estimated touch count:** ~3 files (shared WorldScene/test files).
