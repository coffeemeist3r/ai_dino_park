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

## Shipped (coder)
Both tracks as planned. `circle.ts` builds the ladder out of `topBy`, so book #1 = homecoming pick.
`driftBonds` runs once per ambient step under `!ambientHeld`, before the meetings. Build clean; unit
3128 pass (294 files); e2e 846/847 on the first full run — the one red, `cycle-155-departure` (blur then
visibility change), passes 5/5 isolated; it touches nothing either track changed. New specs green warm
(their first cold run hit the boot ceiling, the known cold-Vite class).
