# Cycle 177 — Code Plan

## Lore track — BACKLOG-391

**Files to create:**
- `game/src/world/cycle-177-regret.test.ts` — unit (both tracks' pure cases).
- `tests/e2e/cycle-177-regret.spec.ts` — e2e.

**Files to modify:**
- `game/src/world/pecking.ts` — `regretsShove`, `regretMemory`, `sorryMemory`, `heardSorryMemory`, `owedApology`,
  `regretLine`, `sorryLine`, `apologyText`, `REGRET_ART_KEY`, `REGRET_GLYPH`.
- `game/src/scenes/WorldScene.ts` — `resolveContest` shove branch: `regretShove(gobbler, winner)`; `lastRegret` +
  `__lastRegret`; `converse`: after the bubble, `apologise(a, b)` for whichever side owes; `__forceConverse` takes
  optional names.
- `game/src/world/reachability.ts` — `out.add(REGRET_ART_KEY)`.

**Reuse list:** `ADMIRE_BAR` (the friend bar), `bondPoints`, `remember` / `forget` / `recall`, `popMark`,
`showBubble`, `logEvent`, `hatchPattern` (round-trip test), the 176 admire spec's staging, `foundingState`.

## Structure track — BACKLOG-577

**Files to modify:**
- `game/src/world/pecking.ts` — `heldMemory` (+1) / `backedMemory` (−1) into `WEIGHTS` via `hatchPattern`.
- `game/src/world/cycle-177-regret.test.ts` — the standoff-weight cases.
- `tests/e2e/cycle-177-regret.spec.ts` — two forced standoffs → the book's pecking line.

**Risks:** any spec that leaves the founding feud live while staging a Mossback/Twitch contest now sees a history
after two standoffs. Most hatch specs already zero the grudge; QA watches 128 pecking, 174 standoff, 175 cowed.

**New dependencies:** none. **Estimated touch count:** 6 files.
