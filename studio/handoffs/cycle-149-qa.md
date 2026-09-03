# Cycle 149 — QA Handoff

**Gates.** `npm run build` clean (0 TS errors). `npx vitest run` — **2411 passed / 3 skipped across 231
files**. `npx playwright test` — **653/653**, on a fresh full run after `kill-port 5173`.

**The e2e flake, and why it is one.** Two runs in this fire were not green: the vigil spec timed out on
`__ready` on its very first cold-Vite boot, and a later full run lost `cycle-019-egg` and `cycle-129-berth`.
Both were investigated rather than waved through, because the second pair are hatch-adjacent specs in the
run immediately after a system that walks a dino to the hatch was added — the exact shape a real regression
would take. It is not one: **the production tree was byte-identical between the 653/653 run before it and
the 651/653 run**, only a unit-test file changed between them, and a fresh full run is 653/653 again. That
is the catalogued parallel-load flake's signature exactly — a different victim each time, green in
isolation, green on a clean re-run. Both specs pass isolated (5/5 in 6.0s).

**The one thing that was *not* a flake** is recorded under the Coder: `cycle-039-inspect` went genuinely red
and was fixed at the root, not at the spec. Detail in the chronicle.

---

## Structure track — BACKLOG-523

| Criterion | Result |
| --- | --- |
| `FOUNDING_HOUR` exported from `clock.ts`; `grep -rn "hour: 8" game/src` empty | **PASS** — grep returns nothing |
| `FOUNDING_HOUR` adjacent to `ACTIVE_SCALE` under a shared note | **PASS** — `ACTIVE_SCALE`, `AWAY_SCALE`, `FOUNDING_HOUR`, `FOUNDING_DAY`, consecutive |
| A fresh `WorldClock` still reports `{1, 8, 0}` | **PASS** — asserted through the constants, not the numbers |
| Register carries a `BACKLOG-523` entry; `darkEntries()` empty | **PASS** |
| The claim goes false at an hour where the cast agrees with itself | **PASS, with a finding** — see below |
| No numeric hour literal in the entry | **PASS** — `holds: () => castSplitAt(FOUNDING_HOUR)` |
| Existing register entries and tests untouched | **PASS** — `cycle-145-reachability.test.ts` unmodified and green |

**Finding: the constant has one failure mode, not two.** The design (and the item) assumed the hour could
break in two directions — wake the whole cast, or open the park in the dark. Scanning the dial, the first is
real and the test finds it. **The second does not exist as a property of the cast:** `OWL_SHIFT` is 8 against
a rest window of about the same length, so the two halves of the roster are never both down, and no hour
exists at which moving the constant would put every dino to sleep. Opening "in the dark" is a claim about
the *sky*, not about who is up, and would want its own entry. The spec now pins both facts — the reachable
failure mode, and the invariant that some ground always has somebody awake on it, which the lore track leans
on directly. This is a criterion **met differently from how it was written**, and the reason is in the test.

## Lore track — BACKLOG-121

| Criterion | Result |
| --- | --- |
| `noteVisit` caps at 8, newest kept | **PASS** |
| `habitualHour` on empty / single / modal / tie | **PASS** — `[]`→null, `[9]`→null, `[9,9]`→9, `[9,9,21]`→9, `[7,7,21,21]`→7 |
| `hoursApart(23,0)===1`, `hoursApart(0,12)===12` | **PASS** |
| `isAnticipating` in and out of the window | **PASS** |
| `vigilKeeper`: fondest / all-zero name order / empty → null | **PASS** |
| `visitHours` round-trips; absent → undefined; malformed rejected | **PASS** — three cases added to the existing `saveGame.test.ts`, 63 green, no parallel save spec created |
| Founding hour → the vigil is **Glade**, and Rex is not awake | **PASS** — derived through `wakingAt` + `vigilKeeper`, no hour named |
| Night → the vigil is **Rex**, no owl-specific branch | **PASS** — the night hours are *found* by scanning, not named; `grep "'owl'"` over `vigil.ts` and `WorldScene.ts` hits only two comments saying not to write one |
| `darkEntries()` empty; register carries `BACKLOG-121` | **PASS** |
| e2e: a dino walks to the hatch and waits; a far-off history dispatches nobody | **PASS** — 3/3 |
| `@mlc-ai/web-llm` only under `game/src/ai/` | **PASS** — `deviceProbe.ts`, `webllm.worker.ts`, `webllmBrain.ts`, nothing else |

**Gap, declared rather than papered over.** The codeplan flagged mark precedence (👀 must hide 👁 on the dino
keeping the vigil) as *"must be asserted, not assumed"* and it is **not asserted**. The reason is structural
and predates this cycle: mark visibility has never had a dev hook — not for 💤, not for 👁, not for 🥶 —
so there is nothing for a spec to read, and adding one for this beat alone would be the only such hook in the
park. The precedence is implemented (`refreshRouseMarks` hides 👁 when `vigil.keeper` matches, and
`refreshVigilMarks` is called from it, so the two can never both be up) and reviewed by reading, not by a
test. Raised for the Validator: this is the third cycle in a row that an hour-mark claim has been unpinnable,
and it looks like a small `__marks()` hook wants filing.

**Not tested, and deliberately out of scope:** the second-boot path (a real return at a different hour
out-voting the founding pair) needs two sessions an hour apart and is not a thing a spec can sit through. The
unit tests pin the arithmetic that decides it.
