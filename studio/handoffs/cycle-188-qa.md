# Cycle 188 — QA

**Build:** ✅ clean.
**Unit tests:** ✅ 3376 passed (327 files, 3 pre-existing skips).
**E2E tests:** ✅ **915 passed** on the third full run.

**The road there, recorded because it was a real find, not a flake:**
- Full run 1: 914/915 — `cycle-018-huddle` ("bonded dinos huddle at the den at night") failed: Rex missing from
  `__huddlers`. Passed isolated, failed again in full run 2 (with two cold-boot timeouts, 079 / 126, which are the
  known boot flake), and failed **16/16** under `--repeat-each`. Not a flake.
- Checked out the pre-coder `game/src`: 16/16 green. So this cycle's change flipped it — but not by breaking huddles.
  Rex is an **owl** (BACKLOG-109, since cycle ~45) and is *awake* at 22:00: its activity at every step of the spec, on
  old and new code alike, is `wandering`/`socializing`, never `huddling`. On the old code its random walk simply
  happened to end on the den tile. This cycle's witness walk takes Bramble off the wander rolls for a few steps after
  Pip's molt, which shifts the shared random stream, and Rex's walk ends somewhere else.
- Fix (test only, QA's lane): the spec now bonds **Sunny** and Mossback, two day-dinos who genuinely rest at 22:00,
  with a comment saying why Rex was wrong. 16/16 under repeat; full run 3 green.

## Structure track — BACKLOG-604

| criterion | status | evidence |
|---|---|---|
| S1 `moltWitnesses` order / ground filter / self / dedup | PASS | `cycle-188-witness.test.ts` (3 tests) |
| S2 fresh save 14:01 → Bramble → Pip as `friend` | PASS | `cycle-188-seen-grown` test 1 |
| S3 Bramble's visit resolves within the step budget | PASS | test 1: visit clears in ≤32 `__stepWorld` |
| S4 hatchling young, scale 0.5, has a record | PASS | test 3 |
| S5 hatchling's molt queues both parents as `parent` | PASS | test 3: Rex + Sunny |
| S6 old saves untouched; only `greeted` added | PASS | diff: `growth.ts` one optional field; founders seeded unchanged |

**Bugs found:** none in the track. The huddle-spec premise bug above is pre-existing.
**Recommendation:** APPROVE.

## Lore track — BACKLOG-605

| criterion | status | evidence |
|---|---|---|
| L1 `witnessLine` registers; `stageOpener` four cases | PASS | `cycle-188-witness.test.ts` (2 tests) |
| L2 Bramble files `saw Pip grow up`; ticker `Bramble → Pip: Look at you, Pip!` | PASS | test 1 |
| L3 young opener before; `I'm grown` once after; `greeted` kept across reload | PASS | test 2 |
| L4 Rex greets with neither opener | PASS | test 2 |

**Bugs found:** none.
**Recommendation:** APPROVE.
