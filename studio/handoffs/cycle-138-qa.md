# Cycle 138 — QA

**Build:** ✅ clean (`npm run build`, type-check passes)
**Unit tests:** ✅ **1964 passed / 1964** across 200 files (`npx vitest run` from the repo root — the root
config covers `tests/unit` *and* the co-located `game/src/**/*.test.ts`)
**E2E tests:** ✅ **568 passed / 2 failed**, both accounted for below (`npx --yes kill-port 5173` then
`npx playwright test`). Re-run after adding the grief spec: the four `cycle-138-haunt` specs and the two
`cycle-138-billcall` specs all pass.

**Boundary check:** `@mlc-ai/web-llm` is imported from `ai/deviceProbe.ts`, `ai/webllm.worker.ts` and
`ai/webllmBrain.ts` only. ✅

### The two e2e failures

1. `mobile-minds.spec.ts:79` — long dialogs page GBA-style. **BACKLOG-430, red on a clean HEAD.** Not this
   cycle's, not re-diagnosed.
2. A single rotating victim of the parallel-load flake, a *different spec each full run*:
   `cycle-122-struck.spec.ts:107` on the first run, `cycle-044-sound.spec.ts:26` on the second. Both pass on
   an isolated re-run (8/8 and 5/5 respectively). This is the pattern BACKLOG-430's notes already name.
   Noted as flake, not regression.

`cycle-122-struck` is the one that deserved a second look rather than a shrug, because it is a **reload**
spec and this cycle changed the save parser. It was isolated, re-run, and passes 8/8; the save round-trip is
independently covered by the new `cycle-138-save-coverage` suite.

---

## Lore track — BACKLOG-421

| criterion | status | evidence |
|---|---|---|
| `tic.ts` exports `HAUNT_RETURN_RANGE`, `HAUNT_DRIFT_NOTED`, `driftHaunt`, `hauntAnchor`\* — pure, Node-testable | **PASS** | `game/src/world/tic.ts`; the anchor function shipped as `ticAnchorFor` (the codeplan's name), not `hauntAnchor` — same function, the design's name was the older one. Exercised entirely in Node by `tests/unit/cycle-138-haunt.test.ts` (11 tests), so no Phaser/WebLLM reaches it. |
| `driftHaunt` moves exactly one tile, stays in bounds, is deterministic | **PASS** | `cycle-138-haunt.test.ts` — "moves exactly one tile and counts the drift", "is deterministic", "stays on the grid from either corner, however long it walks" (20 drifts from both corners). |
| four consecutive drifts are not all the same direction | **PASS** | `cycle-138-haunt.test.ts` — "meanders". Also "two dinos wear their own paths", which pins that the drift is name-seeded rather than shared. |
| a first stretch anchors where the dino stands (pre-421 unchanged) | **PASS** | unit "a first stretch anchors where the dino stands"; e2e "the second stretch is not the first" asserts `haunt === {9,6,drifts:0}` and `anchor === {9,6}`. |
| a second stretch within range anchors adjacent to the first, not on it | **PASS** | e2e "the second stretch is not the first" — `anchor !== first.anchor`, Chebyshev distance 1, and the anchor equals the *haunt*, not the tile the dino was standing on. |
| a stretch beyond `HAUNT_RETURN_RANGE` re-seats the haunt underfoot | **PASS** | unit "a habit wandered away from is lost"; e2e "a habit wandered away from is lost, not trekked back to". Also pinned at the boundary: unit "exactly at the return range it still walks back". |
| a grieving dino still anchors on the edge tile, and its haunt is unchanged | **PASS** | e2e "grief is not a habit — an aimed ritual leaves the haunt alone" (added by QA; the Coder shipped the behavior with no spec for the second half). The pre-existing `cycle-094-grief-tic` suite covers the aim itself and is green. |
| after `HAUNT_DRIFT_NOTED` drifts the memory + ticker line fire exactly once | **PASS** | e2e "the path wears its way across the ground, and says so once" — six stretches, `drifts >= 4`, exactly one matching ticker line. |
| `ticHaunts` round-trips through `saveGame`; absent → `{}` | **PASS** | `tests/unit/cycle-138-save-coverage.test.ts` — "ticHaunts survives a reload", "a save that predates either field still loads", "a malformed haunt is refused rather than half-restored". |
| e2e: two forced stretches, second anchor differs | **PASS** | as above. |
| build / unit / e2e green | **PASS** | see header. |

**Bugs found:** none in this track.

**Note for the Validator, not a defect:** the anchor helper shipped as `ticAnchorFor`, where the design's
criterion says `hauntAnchor`. It is the same function under the codeplan's own name; flagging it so the
verdict does not have to discover the mismatch itself.

**Recommendation: APPROVE.**

---

## Structure track — BACKLOG-489

| criterion | status | evidence |
|---|---|---|
| `gates.ts` is pure and unit-tested for all three rules | **PASS** | `game/src/world/gates.ts`; `tests/unit/cycle-138-gates.test.ts` (10 tests) covers same-value-silent, virgin+seeding-silent, virgin+non-seeding-announces, **seeded key + new cause announces**, seeded cause + changed value announces, key isolation, work/spend isolation, and non-mutation of the input log. |
| `checkCouncilCall` uses `recordCall` for both calls; the old fields and the `!seeding \|\| lean === call` branch are gone | **PASS** | `WorldScene.ts` — `lastWorkCallByZone` / `lastSpendCallByZone` replaced by one `callLog: CauseLog<string>`; grepped, no occurrences remain (the `__foundingFixture` hook's reset was moved onto the new field). |
| regression: first council work call silent, first spend call silent, a flip still announces in the existing wording | **PASS** | the pre-existing `cycle-133-bill-call`, `cycle-137-ballot` and the governance/upkeep e2e specs are green unchanged, including `cycle-137-ballot`'s "a hungry seat turns its ground back to feeding, and the ticker says so", which is exactly the seed-then-flip sequence. |
| **the reachable beat** — a ground with a standing `gather` call that goes derelict emits the bill line once | **PASS, with the direction corrected** | See below. |
| regression test on `soundsDiscontent` with `lastDay === null` | **PASS** | `cycle-138-gates.test.ts` — "a ground that has never sounded is heard the first time it qualifies", plus its twin for the same-day suppression. |
| `parseSave` restores `catchWarmth`; whole-shape coverage; a save without the key still loads | **PASS** | `tests/unit/cycle-138-save-coverage.test.ts`. |
| build / unit / e2e green | **PASS** | see header. |

### On the reachability criterion

The design named the beat as *council-first, then the ruin arrives*. On a fresh save that sequence is not
reachable — the Grove ships its ruin at boot (488), so the **bill** is always the first authority to speak,
and a landmark going derelict later needs upkeep decay across an in-game day boundary, which is the exact
"needs six residents / fires on the day boundary" answer CHARTER v7 rejects.

The reachable sequence is the same defect from the other end, and it is better:

> Boot. The Grove's bill records `gather` and says so — its walls are coming down. The player walks a
> resident over and **mends the founding ruin** (488's errand, the first structure a new player ever
> inspects). The bill falls silent, the ground goes back to deciding for itself, and its council calls
> `gather` — *"fills its stores first"*. **That is the same value the bill recorded**, so the pre-489 gate's
> `last !== call` test was false and the ground said nothing at all: the player watched an emergency end and
> was never told who was in charge afterward.

`tests/e2e/cycle-138-billcall.spec.ts` proves it on a fresh save, and asserts the exact line
(`🗳️ the The Grove's council calls it: fills its stores first`) so the *reason* it used to be silent — the
values being equal — is recorded in the spec rather than in a handoff. It also asserts zero council lines
before the mend and exactly one after, and that a further step announces nothing.

**Bugs found beyond the acceptance set:**

- **Confirmed and repaired in-cycle:** `catchWarmth` (BACKLOG-422) was declared, written, and never parsed.
  Every reload refunded the lifetime being-found ceiling. QA verified the new coverage spec is not
  decorative by deleting `catchWarmth` from the parser's return literal and re-running: **2 tests fail**, the
  static coverage check and the round-trip. Restored.
- **Cosmetic, filed not fixed:** the ticker line reads "the The Grove's council calls it" — the zone's
  display name already carries its article and the template adds another. Pre-existing (481's wording, not
  this cycle's), visible in every governance beat, and outside both tracks' scope. **BACKLOG-499.**

**Recommendation: APPROVE.**

---

**Criteria: 18/18 pass.** Both tracks APPROVE.
