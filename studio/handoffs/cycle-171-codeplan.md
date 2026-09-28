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

## Shipped (coder)

Both tracks as planned. Findings on the way, each resolved in the spec it surfaced in, not by bulk edit:

- **16 specs opted into `strangers`** — every one a spec whose subject is a bond it builds itself
  (loner, comfort, gratitude, huddle, lean, fetch, tic, warmth, the cold morning). The founding
  declaration ratchet dropped 251 → 236 as a side effect.
- **A bonded owl sleeps at the den.** `cycle-146-hours`' resting-holds-its-tile case: Rex now has a
  friend, so resting-and-bonded is huddling and he walks to the den at 08:00. Correct behaviour; the
  spec's subject is the unbonded sleeper, so it opts out.
- **Rex, carried to the Grove, is homesick** and walks off the resource `cycle-069` put under him.
- **The loner bonus had been paying for warm hellos.** Rex's tone reaction to *warm* is negative; the
  +4 `LONER_BONUS` masked it for every fresh save. `cycle-167` now greets him honestly.
- `cycle-042` asserted huddle on exactly step 45; Rex reaches the den by step 15 and wanders its edge
  tile. It now asserts both at the den on the same step within 45.
- The friend line sits under the voice line, which keeps its slot at the head of the block (168).

Build clean; 3119 unit green.
