# Cycle 194 — Code plan

## Lore track — BACKLOG-621

- `game/src/social/courtship.ts`: `JILT_FLOOR = 10`, `GLAD_GLYPH = '🥲'`, `Jilt` type, pure `jilted(a, b, ctx)` over
  `closestFriend` (every live name, floor 10), skipping the pair and anybody paired; `agreeableness >= 0.5` → glad.
  Line builders: `jiltLine`, `jiltMemory`, `jiltTicker` (one each, branching on mood).
- `game/src/world/expiry.ts`: `FunkKind` gains `'jilted'`, window = the sulk's (`SULK_FADES_AFTER_STEPS`).
- `WorldScene.ts`: `jiltBeat(courter, courted)` called from `courtBeat`'s accept branch. Jealous → `enterFunk(...,
  'jilted')`, grudge raised to `RIVAL_BAR` via `strengthen(grudges, name, rival, RIVAL_BAR - current)`. `checkFunks`
  gets the `jilted` words.
- Reuse: `closestFriend`, `remember`, `showBubble`, `logEvent`, `enterFunk`, `strengthen`, `RIVAL_BAR`.

## Structure track — BACKLOG-622

- `courtship.ts`: `Nest` type; `Pairs` entries gain optional `nest`; `pairUp(..., nest?)`; `berthOf(pairs, name,
  cols)`; `isPairs` validates a present nest.
- `breeding.ts`: `LayOpts.paired?` stands in for the bond bar.
- `WorldScene.ts`: nest from the courted dino's ground + tile at accept; `nestSprites` keyed by pair, drawn by
  `drawNests()` (`nest` prop rig or `🪺`), visibility in `applyObjectVisibility`; `berthNow(d)` read in the wander
  step's resting branch ahead of the den (`huddling` flag for the 💤 glyph); pair loop in `maybeLayEggs`;
  `layEgg(a, b, tile?)`; `__nests()` hook; `drawNests()` on restore.
- shortcut: pair eggs lay only on the bowl (the den's ground — born dinos spawn there); a nest on another ground is a
  bed only. Named in the verdict.

## Tests

- Unit `game/src/social/cycle-194-jilted.test.ts`: criteria 1, 5.
- e2e `tests/e2e/cycle-194-jilted-nest.spec.ts`: criteria 2, 3, 6–9.
