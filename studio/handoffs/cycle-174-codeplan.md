# Cycle 174 — Codeplan

## Structure track — BACKLOG-574

**Item:** BACKLOG-574 the park keeps grudges.

**Files to create**
- `game/src/social/grudges.ts` — `RIVAL_BAR`, `GRUDGE_PER_CONTEST`, `GRUDGE_DRIFT`, `worstRival`, `rivalLine`.
- `game/src/social/cycle-174-grudges.test.ts` — unit.
- `tests/e2e/cycle-174-grudges.spec.ts` — e2e.

**Files to modify**
- `game/src/world/founding.ts` — `FOUNDING_GRUDGES`, `foundingGrudges()` beside `FOUNDING_BONDS`.
- `game/src/world/saveGame.ts` — `SaveData.grudges?: Bonds`; parse block copied from `bonds` (optional, malformed → null); returned.
- `game/src/ui/lenses.ts` — `BookRow.rival?: string`; render under `friend`.
- `game/src/scenes/WorldScene.ts` — `grudges` field; seed in `seedFounding` (respects `bondsCleared`); `__clearBonds`
  also empties grudges; `resolveContest` strengthens the pair; `forceStep` drifts grudges beside the bond drift;
  `currentSaveData` + load restore; `bookRows` `rival`; hooks `__grudges`, `__setGrudge`.

**Reuse list:** `strengthen`, `bondPoints`, `driftBonds`, `closestFriend` (`social/bonds.ts`); `pairKey`
(`social/meetings.ts`); the `bonds` save-parse block; `seedFounding`'s `bondsCleared` guard.

**New dependencies:** none.

**Test plan**
- Unit: founding table names roster dinos on one spawn zone; `worstRival` floor + pick; `rivalLine`; drift slower
  than bonds and reaching toward 0; save round-trip / missing / malformed.
- E2E: fresh save `__grudges` = founding feud; book lines for Mossback/Twitch and none for Rex; `__forceContest`
  raises the pair by `GRUDGE_PER_CONTEST`; `strangers` empties it.

**Risks:** the book line adds a row under the friend line — specs that slice a fixed number of lines from a page
(`cycle-171-closest-friend`) read the friend line inside the first four, which stays true.

**Estimated touch count:** ~7 files.

## Lore track — BACKLOG-024

**Files to create**
- `game/src/social/standoff.ts` — constants, `squareOff`, `backOffTile`, `standoffDue`, `standoffLine`,
  `heldMemory`, `backedMemory`.
- `game/src/social/cycle-174-standoff.test.ts` — unit.
- `tests/e2e/cycle-174-standoff.spec.ts` — e2e.

**Files to modify**
- `game/src/scenes/WorldScene.ts` — in the ambient meeting loop, before the meeting body: rival pair off cooldown →
  `squareOffPair(a, b)` and `continue`. New `squareOffPair` (holder/yielder, back-off move, memories, ticker, pop
  marks, cooldown stamp in `standoffAt[pairKey]`, `lastStandoff`). Hooks `__lastStandoff`, `__forceStandoff`.
- `game/src/world/reachability.ts` — `worldPlacedProps` adds `STANDOFF_ART_KEY`.

**Reuse list:** `makeHourMark` (pop, the `popComfortMark` shape); `remember`; `logEvent`; `pairKey`; `worstRival`'s
`RIVAL_BAR`; `worldSteps` as the cooldown clock.

**Test plan**
- Unit: `squareOff` bravery + tie; `backOffTile` direction/clamp/same-tile; `standoffDue` cooldown; placed props.
- E2E: Mossback and Twitch nudged 3 tiles apart on a fresh save, ordinary `__stepWorld` until a `💢` line appears
  (≤ 200 steps = 10 minutes); `__forceStandoff` back-off distance + both memories; under-bar pair (Rex/Sunny) never
  squares off when forced adjacent and stepped.

**Risks:** collision with the structure track in `WorldScene.ts` — structure first. Existing specs that step the
world with Mossback and Twitch adjacent now see a standoff in place of one meeting; the full suite decides.

**Estimated touch count:** ~5 files (WorldScene shared).
