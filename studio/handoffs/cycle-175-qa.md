# Cycle 175 — QA

- **Build:** ✅ clean (`npm run build`).
- **Unit tests:** ✅ 3182 passed, 3 skipped (+9 new across `cycle-175-cowed.test.ts`, `cycle-175-hosts.test.ts`).
  One ratchet failure on the first run — `cycle-165-founding-declaration` caught the new friend-found spec without a
  `foundingState` declaration; fixed in the spec (`'as-shipped'`, the founding loner is the subject) before commit.
- **E2E tests:** ✅ **864/864 passed** on the first full run (10.0 min). No flake this cycle.
- **Boundary:** `@mlc-ai/web-llm` imported only under `game/src/ai/` (grep clean).
- **CI going in:** last three runs on `main` `success`.

## Lore track — BACKLOG-397

| criterion | status | evidence |
|---|---|---|
| `cowedBy` truth table (one slink yes; none / other winner / lone yield no) | PASS | `cycle-175-cowed.test.ts` › cowedBy ×2 |
| `cowedGobble` with no history ≡ `gobblerAmong` | PASS | › with no history it is exactly gobblerAmong |
| cowed top gobbler waits, next bully pushes in; none → null | PASS | › a cowed top gobbler… / › with no other bully… |
| `waitedLine` ends with `becauseOf('wary', winner)` | PASS | › says why, in the hatch wording |
| E2E production path: stand at drop 1, wait at drop 2, no stand/gobble, winner fed, bully not, ⏳ in ticker | PASS | `cycle-175-cowed.spec.ts` › a bully stood up to once waits its turn… |
| E2E: no-history gobbler still shoulders a timid winner | PASS | › a gobbler with no history still shoulders… |
| `WAIT_ART_KEY` in `worldPlacedProps()` | PASS | › the mark is placed by the world |

**Bugs found:** none. The neighbouring contest specs (084 gobble, 085 stand-up, 086 slink, 128 pecking, 129 berth,
130 mercy, 131 mealtime, 132 soothing tic) are green in the full run — none drives two natural contests between
one pair, as the codeplan predicted.

**Recommendation:** APPROVE.

## Structure track — BACKLOG-571 (+557)

| criterion | status | evidence |
|---|---|---|
| `FRIEND_FOUND_ART_KEY` and `COLD_ART_KEY` in `worldPlacedProps()` | PASS | `cycle-175-hosts.test.ts` |
| Fresh save: Twitch's first bond over the floor pops the mark once (0→1), memory filed, second lift no pop | PASS | `cycle-175-friend-found.spec.ts` |
| Cold mark still shows for a cold-pending dino (family report) | PASS | `cycle-165-sulk-mark.spec.ts` asserts `cold` in the family report — green |
| No `'🥶'` text literal left in `WorldScene.ts` | PASS | grep count 0 |

**Bugs found:** none. The comfort pop was folded onto the new shared `popMark` (same body); `cycle-173-comfort` specs green.

**Recommendation:** APPROVE.
