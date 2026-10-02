# Cycle 175 — Code Plan

## Lore track — BACKLOG-397

**Item:** reputation cows the bully.

**Files to create:**
- `game/src/world/cycle-175-cowed.test.ts` — unit.
- `tests/e2e/cycle-175-cowed.spec.ts` — e2e.

**Files to modify:**
- `game/src/world/pecking.ts` — add `cowedBy`, `cowedGobble`, `WAIT_ART_KEY`, `WAIT_GLYPH`, `waitedLine`. Imports
  `gobblerAmong` from `./feeding` (pecking already imports from feeding; feeding does not import pecking — no cycle).
- `game/src/scenes/WorldScene.ts` — `checkFeeding`: replace the bare `gobblerAmong` call with `cowedGobble(...,
  (n) => recall(this.memory, n))`; new `lastWait` field, `waitTurn(bully, winner)` (mark + ticker, no memory),
  `__lastWait` hook beside `__standFood`.
- `game/src/world/reachability.ts` — `out.add(WAIT_ART_KEY)`.

**Reuse list:** `gobblerAmong` (feeding.ts), `peckingScore` / `PECKING_BAR` / `becauseOf` (pecking.ts),
`makeHourMark` + the `squareOffPair` pop shape (WorldScene), `recall` (ai/memory), `slunkOffMemory` in tests.

**New dependencies:** none.

**Test plan:**
- Unit: `cowedBy` truth table; `cowedGobble` no-history equivalence, re-pick, null re-pick; `waitedLine` tail;
  `worldPlacedProps().has(WAIT_ART_KEY)`.
- E2E: the slink spec's staging (`__placeDino`, `__setNeed`, `__setTrait`, `__dropFood`, `__stepWorld`) run twice:
  first drop → stand; second drop → wait (`__lastWait`, no stand/gobble, winner fed, ⏳ in ticker). Second test:
  a gobbler with no history still gobbles a timid winner.

**Risks:** specs that run two natural contests between one pair (none found — 128/132 use `__forceContest`, 130
stages the *victor's* ring only). QA watches 084/085/086/131 in the full run.

**Estimated touch count:** ~5 files.

## Structure track — BACKLOG-571 (+557)

**Files to create:**
- `game/src/world/cycle-175-hosts.test.ts` — unit.
- `tests/e2e/cycle-175-friend-found.spec.ts` — e2e.

**Files to modify:**
- `game/src/world/loner.ts` — `FRIEND_FOUND_ART_KEY = 'friend_found'`.
- `game/src/world/cold.ts` — `COLD_ART_KEY = 'cold'`, `COLD_GLYPH = '🥶'`.
- `game/src/scenes/WorldScene.ts` — `checkLonerLift` calls new `popFriendFoundMark(d)` (+ `friendFoundPops`
  counter, `__friendFoundPops` hook); `coldMarks` typed `Array<Text | Image>` and pushed via
  `makeHourMark(COLD_ART_KEY, COLD_GLYPH)`.
- `game/src/world/reachability.ts` — add both keys.

**Reuse list:** `makeHourMark`, `popComfortMark` shape, `liftsLoner` (unchanged), existing bond-setting hooks
(`__setBond` or equivalent) for the e2e.

**New dependencies:** none.

**Test plan:**
- Unit: both keys in `worldPlacedProps()`; `COLD_GLYPH === '🥶'`.
- E2E: fresh save — Twitch is a loner; strengthen its bond through the production lift path; `__friendFoundPops()`
  0 → 1; memory carries `found a friend`; a further strengthen does not pop again. The cold mark's existing spec
  stays green in the full run.

**Risks:** any test that reads `coldMarks[i].text` (grep: none in specs). The per-dino family report reads
`.visible` only.

**Estimated touch count:** ~6 files (overlapping WorldScene / reachability with the lore track).

## Shipped (coder)

- 397: `cowedBy` / `cowedGobble` / `waitedLine` / `WAIT_ART_KEY` in pecking.ts; `checkFeeding` routes the gobbler pick through `cowedGobble`; `waitTurn` pops ⏳ + ticker, no memory; `__lastWait`.
- 571: `FRIEND_FOUND_ART_KEY`; `checkLonerLift` pops the mark via a new shared `popMark` (comfort pop now uses it too); `__friendFoundPops`.
- 557: `COLD_ART_KEY` / `COLD_GLYPH`; `coldMarks` built by `makeHourMark`.
- All three keys in `worldPlacedProps`. Build clean; unit 3182 green (+9). New e2e specs 3/3; neighbours (084/085/086/043/081) green.
