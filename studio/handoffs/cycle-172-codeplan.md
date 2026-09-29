# Cycle 172 — Code plan

## Lore track — BACKLOG-127
- **New** `game/src/social/circle.ts`: `innerCircle`, `circleLine`, `joinedLine`, `newcomers`,
  `CIRCLE_ART_KEY = 'circle'`, `CIRCLE_GLYPH = '♛'`. Reuses `topBy` (world/homecoming.ts) and
  `heartsFromPoints` (social/friendship.ts) — no second tie-break.
- `game/src/ui/lenses.ts`: `bookLines(rows, away = [], circle?: string)` — circle line under the title.
- `game/src/world/reachability.ts`: `out.add(CIRCLE_ART_KEY)`.
- `game/src/scenes/WorldScene.ts`: `circleNames: string[] | null`, `checkCircle()` called at the top of
  `update()`; `popCircleMark(d)` (popCallNote shape); reset to null on save restore; both book call sites
  pass `circleLine(...)`; hooks `__innerCircle`, `__circleJoins`.
- Tests: `game/src/social/cycle-172-circle.test.ts` (L1–L4, L7); `tests/e2e/cycle-172-circle.spec.ts` (L5, L6).

## Structure track — BACKLOG-570
- `game/src/social/bonds.ts`: `BOND_DRIFT`, `driftBonds(bonds, rest, rate = BOND_DRIFT)`. Rest is a
  parameter (the scene passes `LONER_FLOOR`) because `world/loner.ts` imports `bonds.ts` — importing the
  floor back would be a cycle.
- `WorldScene.forceStep`: `this.bonds = driftBonds(this.bonds, LONER_FLOOR)` under `!ambientHeld`, before
  the meeting loop. Hook `__bondDrift`.
- Tests: `game/src/social/cycle-172-drift.test.ts` (S1–S4); e2e S5 in `cycle-172-drift.spec.ts`.

## Reuse
`topBy`, `heartsFromPoints`, `makeHourMark`, `logEvent`, `inView`, `strengthen`/`bondPoints`,
`pairKey`, e2e `boot` helper.
