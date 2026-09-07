# Cycle 153 — QA

**Both tracks pass.** 21 design criteria, 19 verified as written, 2 verified in an amended form the Coder
recorded and this handoff accepts (below). 24 new tests: 19 unit, 5 e2e.

## Gates

| Gate | Result |
|---|---|
| `npm run build` | clean |
| `npx vitest run` | **2534 passed**, 3 skipped, 242 files (was 2515 / 240) |
| `npx playwright test` | **674 passed, 1 failed** — see *The flake is back*, below |
| `npx playwright test` (second full run) | **674 passed, 1 failed**, a **different** spec |
| `@mlc-ai/web-llm` outside `game/src/ai/` | none (grep) |
| Save changes additive, no version bump | yes — `awayLog?`, absent → `[]` |
| Tree clean at commit | yes |

---

## Lore track — BACKLOG-114

| # | Criterion | Result |
|---|---|---|
| 1 | `awayLogLines([])` returns `[]` | **PASS** — `renders nothing at all for a park nobody has ever left` |
| 2 | at most `AWAY_LOG_KEPT`, newest first | **PASS** — five returns in, `[5,4,3]` out |
| 3 | an empty entry is refused | **PASS** — the log is unchanged |
| 4 | `bookLines(rows)` byte-identical | **PASS** — and by construction, not by hope: it is a default parameter |
| 5 | the block sits between header and first dino | **PASS** — unit and e2e both |
| 6 | save round-trips `awayLog`; absent loads clean | **PASS** |
| 7 | malformed `awayLog` is refused | **PASS** — three shapes: not an array, non-numeric `at`, non-string line |
| 8 | e2e: after a five-minute return, the book carries the digest | **PASS** — asserts **every** digest line, not just the heading |
| 9 | e2e: it survives a reload | **PASS** |
| 10 | e2e: two returns, two entries, newest first | **PASS** |

### The amended criterion, and QA's view of it

Criteria 1–3 were specified against `awayLogLines(log, now)` with a relative "ago" stamp built on an
exported `fmtSpan`. Neither shipped. The Coder's reasoning is in the code plan and QA agrees with it on the
second point in particular, which is the one that would have shipped a *wrong* thing rather than an extra
thing: **`fmtSpan` divides by an in-game day and `at` is wall-clock**, so the stamp would have mislabelled
real time in in-game units — and it would have looked correct in any test that used a round number. The
first point (the span is already the digest's own first line) is the reuse doctrine the plan itself opened
with, applied against the plan.

QA's own check on the deviation: the entry still **carries** `at` and `minutes` into the save, so nothing
was thrown away, and the third e2e spec asserts ordering off both. A later item that wants a stamp has the
numbers and needs a wall-clock formatter, which is a thing to write once rather than a thing to have
mis-borrowed.

### The bar, verified rather than asserted

Run it by hand: boot, `__catchUp(5 min)`, and the digest appears in a modal. Dismiss it. Press V. The block
is there, above Rex. Reload the page. It is still there. That is the item's sentence — *re-read what the
bowl got up to without having caught the digest live* — and both halves of it are now specs.

---

## Structure track — BACKLOG-535

| # | Criterion | Result |
|---|---|---|
| 1 | `stakeUpkeepStep(0,0) === false` | **PASS** |
| 2 | `(2,0)` true, `(2,1)` false | **PASS** — and `(9,1)` false: one ruin is enough, however tall the skyline |
| 3 | kept key for a founded, tended ground | **PASS** — both founding kinds |
| 4 | hollowed outranks kept | **PASS** |
| 5 | unfounded ground still shows nothing | **PASS** |
| 6 | the three existing states are unchanged | **PASS** — and `cycle-145-stake.test.ts` still holds all eight of its own claims |
| 7 | the founding Grove reads not-kept, from the tables | **PASS** — derived off `FOUNDING_LANDMARKS` / `FOUNDING_RUIN`, no literals |
| 8 | `afterOneSession()`'s Grove reads kept | **PASS** |
| 9 | `worldPlacedProps()` carries the key; register clean | **PASS** |
| 10 | e2e: the stake changes when the cairn is mended | **PASS** |
| 11 | the register walks clean in both frames | **PASS** — as a **unit** test; the plan corrected the design's label and QA confirms `darkEntries` is a pure export with no scene edge |

### The blocker-if-wrong that bit

The code plan flagged: *"if the Grove's founder is `born`, the pre-cycle key is `founder_stake_native`, not
`founder_stake` — assert whatever it actually is rather than what reads nicer."* It is `born`, and the
first e2e assertion is `founder_stake_native`. Had that been written the way the design's prose phrased it,
the spec would have failed on the frame-one read and the whole track would have looked broken at the last
gate. Worth recording that the plan caught this before a line was cut rather than after.

### A gap QA is declaring rather than hiding

The e2e spec asserts `__stake()` — the **key**, through the production `stakeArtKey` call. It does not
assert the **sprite**. That is the same gap BACKLOG-530 is queued over, one family across: this park can
read which mark a dino wears only by reading the source, and now it can read which mark a *ground* wears
only through a hook that recomputes rather than through the thing on screen. The Structure-smith passed 530
over this cycle deliberately and recorded why; this is the second consecutive cycle in which its absence
shows up in a QA handoff, which is evidence for the queue rather than a complaint about this track.

### The bar, verified

Boot, `__setZone(grove)`: one derelict landmark, stake is `founder_stake_native`. Drive the mend. Zero
derelict, stake is `founder_stake_kept`. **The mark changed while the park was open**, with no clock turn
and no day boundary — the first state in this family that does.

---

## The flake is back, and this is the finding QA wants read

Two full e2e runs, two failures, **different specs each time**:

- run 1 — `cycle-082-comfort-food.spec.ts:24`, `page.waitForFunction` timeout in `helpers.boot`
- run 2 — `cycle-121-yearning.spec.ts:46`, `canvas` visibility timeout in `helpers.boot`

Both green when re-run isolated (3/3 and 7/7). Neither touches this cycle's files, neither asserts anything
this cycle changed, and the failure is at `boot` — before a spec's own subject exists. Under the routine's
rule that is the known parallel-load flake and **not a regression**, and QA is calling it that.

What QA wants the Validator to weigh is the *trend*, because the suite has a record here. Cycle 148 shipped
BACKLOG-515/430 and recorded **649/649 in both directions, the first all-green run this project had ever
had**. Cycle 152 ran **670/670**. Tonight the suite is 675 specs and it dropped one on each of two
consecutive runs, with a different victim each time — which is exactly the one-victim-per-run shape
`helpers.ts` documents in its own comment and that 515 was written to close.

Five specs were added tonight. That is the only variable QA can name, and it is a weak one — the specs are
short, they run against the same fixture as their neighbours, and the victims were not them. The honest
reading is that 515's repair bought headroom rather than a floor, and the suite has now grown back into the
seam. That is a structure-track observation with two data points and it should be filed as an item rather
than diagnosed in a QA handoff.
