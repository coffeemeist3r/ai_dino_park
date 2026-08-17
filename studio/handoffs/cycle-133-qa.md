# Cycle 133 — QA

**Build:** `npm run build` clean.
**Unit:** `npx vitest run` — **1803 passed / 186 files** (was 1777; +26, all new). **Zero existing
assertions amended in either track** — the second cycle running that this is true, and for the same reason:
both items ship with an explicit unchanged fallthrough, and a still suite is the evidence the fallthrough is
real.
**e2e:** `npx playwright test` — see the flake note below. **522/522 on the second full run.**
**Boundary:** `grep -rn "@mlc-ai/web-llm" game/src --include=*.ts | grep -v game/src/ai/` → empty.
**Save:** additive only. `SAVE_VERSION` unchanged at 2; the two new fields are optional and absent → `{}`.

---

## Lore track — BACKLOG-407 (shared tic)

| # | Criterion | Result |
|---|---|---|
| 1 | `watchingTic` false at ≤3, true 4..8, false 9+ | PASS (unit — both edges pinned separately) |
| 2 | `picksUpTic` needs both bars; 7-bond and 2-watch negatives | PASS (unit) |
| 3 | `signatureAxis` furthest-from-neutral, `signatureTic === TIC_BY_AXIS[signatureAxis]` | PASS (unit, over every axis) |
| 4 | `echoedTic` keeps kind + glyph, changes the label | PASS (unit; also pinned non-mutating) |
| 5 | `echoTicMemory` names friend + ritual | PASS (unit) |
| 6 | Three inventions at 5 tiles, bond ≥ 8 → `__ticEcho` names the performer's ritual, `__ticWatches` is 3 | PASS (e2e) |
| 7 | Same drive at 2 tiles and at 12 tiles → echo null | PASS (e2e, two specs) |
| 8 | Same drive below the bond floor → echo null | PASS (e2e) |
| 9 | The watcher's own tic floats the **performer's** glyph; memory carries the echo note | PASS (e2e) |
| 10 | A dino carrying an echo acquires no second one | PASS (e2e — and its watch tally toward the second friend stays 0) |
| 11 | Save/reload round-trip; a pre-407 save restores on native rituals | PASS (e2e reload; unit-side absent→`{}` seam in `saveGame`) |
| 12 | e2e shows a ritual crossing: ticker line + matching glyph | PASS |

**Notes.**

- The band is asserted at **both edges by construction**, not by a single sample: `watchingTic(3)` false and
  `watchingTic(4)` true, `watchingTic(8)` true and `watchingTic(9)` false. A unit test also walks 0..12 and
  asserts company-range and watching are never simultaneously true, which is the invariant the beat rests on
  — a watcher inside company range is a dino that would have prevented the ritual it is supposedly learning.
- The e2e drives `__watchTic`, which is `performTic`'s own call. A spec that re-derived the scan could pass
  against a `performTic` that never called it; this one cannot.
- **Not a bond source, deliberately.** No spec found a bond change from watching, because there is none: the
  mimicry reads the bond graph and never writes it.

## Structure track — BACKLOG-485 (the bill reaches the call)

| # | Criterion | Result |
|---|---|---|
| 1 | `billLean(0)` null; `billLean(1)`/`billLean(3)` `'gather'` | PASS (unit; also pinned non-scaling) |
| 2 | `calledWork(p, 0) === p` for `'gather' \| 'build' \| null \| undefined` | PASS (unit, all four) |
| 3 | `calledWork('build', 1)` and `calledWork(null, 1)` → `'gather'` | PASS (unit) |
| 4 | Derelict landmark → `__workPriority(zone) === 'gather'`; patched → back to the ground's call | PASS (e2e) |
| 5 | The stored decision is not overwritten | PASS (e2e — the third spec reads the pre-lapse call and asserts the same value returns after the patch-up, which can only hold if the store was never leaned) |
| 6 | Gather regrowth multiplier while derelict | PASS (unit, through `workRegrowMult` on the leaned answer) |
| 7 | `landmarkDeferredForGathering` true below the floor while derelict | PASS (unit) |
| 8 | A park with nothing derelict is bit-identical; existing specs unamended | PASS — **the whole prior suite ran untouched**, including cycle-121-work-priority, cycle-128-upkeep and cycle-129-council-vote |
| 9 | 🛠️ line for a bill-driven turn, 🗳️ only for a vote | PASS (unit on the builder, e2e on the log) |
| 10 | Save format unchanged | PASS (485 persists nothing) |
| 11 | e2e: forced disrepair flips the call and posts the line | PASS |

**Note on criterion 9 — a defect the specs caught, fixed in the Coder fire.** The first draft posted nothing
at all: 481's first-seating guard treats a ground's first recorded call as a seeding, and a ground with no
seated council has never recorded one — so precisely the grounds most likely to be letting their walls fall
down were the grounds guaranteed to say nothing about it. The guard now applies only when a *vote* is what
changed. Recorded cost: a park reloaded while in disrepair posts the line once on its first step.

---

## e2e flake — the third data point for BACKLOG-486

First full run: **521/522**, losing `mobile-minds.spec.ts` "long dialogs page GBA-style". Re-run isolated:
**5/5 green in 5.0s**. Fresh full run: **522/522 green**.

This is the catalogued parallel-load failure, not a regression, and nothing in this cycle's diff is within
reach of the dialog paging path. It is also the **third distinct victim in four cycles** (cycle 130 lost
`cycle-110-plenty` then `cycle-123-wandering`; this run lost `mobile-minds`), which is exactly what
BACKLOG-486 says: the failure is a property of the run, not of any spec. Worth noting for the item's benefit:
the suite has grown 512 → 522 this cycle, and the two consecutive clean runs cycle 132 recorded did **not**
extend to three. 486's success condition (three consecutive clean full runs) is not met and is not close to
being met by waiting; it needs the worker cap the item asks for.

`mobile-minds` is also BACKLOG-430's spec, whose text has said since cycle 129 that its clean-HEAD isolation
failure no longer reproduces. It didn't reproduce here either — it passed isolated on the first try.

**Recommendation: APPROVE both tracks.**
