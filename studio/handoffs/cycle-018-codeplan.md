# Cycle 18 — Lore+Design+Code-plan (BACKLOG-013 + BACKLOG-041)

## Item
Capstone: **pairwise bonds (013)** + **night sleeping huddles (041)**. Dinos that meet often build a bond; at night, bonded dinos walk to a den tile and huddle, which deepens the bond — self-reinforcing emergent friendship the operator will see in the morning.

## What ships
- Every NPC↔NPC meeting strengthens a symmetric pairwise **bond** (0–100), persisted in the save.
- A visible **den** mat near the lower-centre of the map.
- At **night** (`dayPhase==='night'`), any dino whose strongest bond ≥ threshold walks to the den instead of wandering; clustered dinos show a 💤 and their adjacency keeps strengthening the bond ("affinity boost each shared night"). At dawn they disperse and wander again.

## Files
- `game/src/social/bonds.ts` (new) — pure `Bonds`, `strengthen(bonds,a,b,delta,max=100)`, `bondPoints(bonds,a,b)` (reuses `pairKey` from meetings).
- `game/src/world/saveGame.ts` (mod) — `SaveData.bonds` (additive, version 1, default {}).
- `game/src/scenes/WorldScene.ts` (mod) — bonds field; strengthen on each adjacency meet; den graphic + 5 💤 markers; night-huddle movement branch in `forceStep`; persist/restore bonds; depth fix (den<dinos<overlay); hooks `__bonds`/`__huddlers`/`__bondPair`.
- `tests/unit/bonds.test.ts` (new), `tests/e2e/cycle-018-huddle.spec.ts` (new).

## Constants
`HUDDLE_TILE={10,11}`, `HUDDLE_THRESHOLD=8`, `BOND_PER_MEET=4`.

## Reuse
- `pairKey` (meetings, c11), `stepToward` (c14), `dayPhase` (c2), the save path (c3), `onTick` movement (c11).

## Tests
- unit: `strengthen` symmetric/capped/immutable/self-noop; `bondPoints`; save round-trips `bonds`, v1→{}.
- e2e: `__bondPair('Rex','Mossback')` → advance to night → many `__stepWorld()` → `__huddlers()` includes both (deterministic via `stepToward`); prior suites green.

## Risks
- **Determinism:** huddle movement uses deterministic `stepToward`, and the test force-bonds + runs enough night steps (≥40 ≥ max map distance) to guarantee arrival at the den.
- **Depth order:** den below dinos, night overlay above dinos, 💤/HUD on top — set explicitly.
- **Save growth:** bonds are small numbers; additive, version unchanged.
- Day behavior (attraction/wander) unchanged outside night.

## Touch: 5 files.
