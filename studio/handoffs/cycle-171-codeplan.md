# Cycle 171 — Code plan

## Structure track — BACKLOG-565 (+567)

**Files.**
- `game/src/social/bonds.ts` — export `BOND_PER_MEET = 4` (moved from WorldScene) and
  `meetGain(bond) = BOND_PER_MEET * (1 - bond / MAX_BOND)`.
- `game/src/world/founding.ts` — `FOUNDING_BONDS` (pair table) + `foundingBonds(): Bonds` via `pairKey`.
- `game/src/scenes/WorldScene.ts` — meet loop uses `meetGain(bondPoints(a,b))`; `seedFounding()` merges
  `{ ...foundingBonds(), ...this.bonds }` (a spec's pre-seed write wins; a `bondsCleared` flag set by
  `__clearBonds` skips it — the `foundingCleared` precedent for the post-`__ready` DB resolve);
  `topBond` rounded in both `bookRows` and the role read's display path (book only).
- `tests/e2e/helpers.ts` — `strangers` fixture (`__clearBonds`, verify `__bonds()` empty).
- Tests: `game/src/social/cycle-171-bonds.test.ts` (meetGain + FOUNDING_BONDS invariants: Twitch
  absent, every other roster dino ≥ LONER_FLOOR somewhere), `tests/e2e/cycle-171-bond-range.spec.ts`
  (S1, S2, S3, S5, S6, S7).

**Reuse.** `pairKey`, `strengthen`, `LONER_FLOOR`, `ROSTER`, `seedFounding`'s one-shot branch, the
BACKLOG-495 fixture table.

## Lore track — BACKLOG-134

**Files.**
- `game/src/social/closest.ts` — `SHIFT_MARGIN`, `bestFriend`, `friendLine`, `shiftLine`; built on
  `closestFriend` + `LONER_FLOOR`.
- `game/src/ui/lenses.ts` — `BookRow.friend?: string`, rendered under the hearts line.
- `game/src/scenes/WorldScene.ts` — `bestFriendOf` map; `refreshBestFriends(log)` at the head of
  `forceStep` (log = true) and once after seeding/restore (log = false); `bookRows` sets `friend`;
  hook `__bestFriends()`.
- Tests: `game/src/social/cycle-171-closest.test.ts`, `tests/e2e/cycle-171-closest-friend.spec.ts`
  (L1–L5).

**Test plan.** Unit for the pure modules; e2e for the scene wiring on a fresh (as-shipped) park;
full suite to find the specs that assumed the zero graph, each read and opted into `strangers`.
