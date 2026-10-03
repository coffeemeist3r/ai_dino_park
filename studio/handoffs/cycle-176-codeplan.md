# Cycle 176 — Code Plan

## Lore track — BACKLOG-395

**Files to create:**
- `game/src/world/cycle-176-admire.test.ts` — unit.
- `tests/e2e/cycle-176-admire.spec.ts` — e2e.

**Files to modify:**
- `game/src/world/pecking.ts` — `ADMIRE_BAR`, `ADMIRE_BOND`, `admirers`, `ADMIRE_ART_KEY`, `ADMIRE_GLYPH`,
  `admiredMemory`, `admireLine`.
- `game/src/scenes/WorldScene.ts` — `resolveContest` stand branch: onlookers in view within `FEED_RANGE` of the food
  → `admirers` → bond/memory/ticker/`popMark` per admirer; `lastAdmire` field reset wherever `lastStand` is reset to
  null; `__lastAdmire` hook beside `__lastWait`.
- `game/src/world/reachability.ts` — `out.add(ADMIRE_ART_KEY)`.

**Reuse list:** `popMark` (WorldScene), `strengthen` / `bondPoints`, `remember`, `chebyTiles`, `FEED_RANGE`, the
cycle-175 cowed spec's staging helpers (`__placeDino`, `__setNeed`, `__setTrait`, `__dropFood`, `__stepWorld`),
`__memories`-style read hooks already present, `foundingState(page, 'strangers')`.

**Risks:** a stand staged in founding state with a friend in range now writes into a third dino's ring — gossip
specs that read "the most recent first-hand memory" of a bystander could see it. QA watches 084–086, 127–131, 175.

## Structure track — BACKLOG-573 (+483)

**Files to modify:**
- `game/src/input/touch.ts` — `SHEET_COLUMN_ROWS = 9`, pitch 35, comment.
- `tests/unit/touch.test.ts` — clearance over all rows; first-column pin to the new geometry; `export` heads col 2.
- `game/src/world/feeding.ts` — `yieldedMemory`, `repaidMemory`, `snatchedMemory`, `stoodMemory`, `hatchPattern`.
- `game/src/world/manner.ts`, `game/src/world/pecking.ts` — patterns via `hatchPattern`.
- `game/src/scenes/WorldScene.ts` — the four template literals become builder calls.
- `game/src/world/cycle-176-admire.test.ts` — the builder/pattern round-trip cases live with the lore unit file.

**Check first:** `tests/e2e/cycle-173-sheet-columns.spec.ts` and any spec tapping sheet rows by coordinate.

**New dependencies:** none. **Estimated touch count:** ~10 files.
