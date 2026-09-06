# Cycle 152 — QA

## Gates

| Gate | Result |
|---|---|
| `npm run build` | clean |
| `npx vitest run` | **2502 passed**, 3 skipped, 239 files (from 2475 / 237) |
| `npx --yes kill-port 5173 && npx playwright test` | **670/670 passed** (from 666) |
| `@mlc-ai/web-llm` outside `game/src/ai/` | none — grep returns nothing |
| Working tree | clean at commit |

The full e2e suite was run twice in its final shape and came back 670/670 both times. **No flake was
observed this cycle** — the usual `cycle-011-movement` parallel-load flake did not appear, which is
recorded because it is the exception rather than the rule here.

Two intermediate red runs are recorded below rather than only the green one, because the shape of the
red run is the measurement this cycle was run to produce.

---

## Lore track — BACKLOG-113

| # | Criterion | Result |
|---|---|---|
| 1 | `apartFor` pure, monotone, 0 below the threshold, 1 at five minutes and at one day, capped | **PASS** — `cycle-152-drift.test.ts`, first three cases |
| 2 | `driftFor` reproduces today's value at every whole-day input 1..7 | **PASS** — pinned as a literal table `[2,4,6,8,10,12,12]` |
| 3 | An acquaintance pair (0 < bond < 8) loses `apartFor(minutes)` | **PASS** |
| 4 | A pair at 0, or absent, is untouched and no entry is invented | **PASS** — unit and e2e both |
| 5 | A bond never goes below 0 | **PASS** — 7 days against a bond of 1 lands on 0, not −5. `strengthen` already clamped; no call-site floor was needed |
| 6 | The warm path is unchanged | **PASS** — 3 days on a bond of 20 still gives 26 |
| 7 | Both dinos get a memory, in their own direction, from one builder | **PASS** — `apartMemory` |
| 8 | At most two cold lines, furthest-apart first | **PASS** — three drifting pairs yield exactly `[E&F, C&D]` |
| 9 | Warm-only cast prints exactly what it printed before | **PASS** |
| 10 | **Reachable** — a five-minute step away prints a warm line *and* a cold line | **PASS** — `cycle-152-drift-apart.spec.ts`, first-hand: bonds move 8→9 and 4→3 and both digest lines appear |

**14 of 14 assertions across 10 criteria.** Criterion 10 is the one that matters and it is answered by a
spec that actually steps the park away and reads the digest, not by arithmetic about what would happen.

## Structure track — BACKLOG-528

| # | Criterion | Result |
|---|---|---|
| 1 | `played` optional; existing twelve entries unchanged and passing | **PASS** — no existing entry was edited except to gain a `played` sibling on 488 |
| 2 | `afterOneSession()` pure, routed through production functions | **PASS** — two calls compare equal; the mend goes through `runUpkeep(pile, 0, 1)`, which is *the same call* `WorldScene.resolveMend` makes |
| 3 | `darkEntries()` reports the frame | **PASS** — all four founded/played combinations asserted against an injected register |
| 4 | The played claims are in the register and hold | **PASS** — three claims across two entries (see note) |
| 5 | The Grove ships a second landmark, standing, on an asserted-clear tile | **PASS** — grass by `groveTileAt`, clear of the ruin and `BANK_TILE` |
| 6 | Post-mend upkeep due ≥ 1 | **PASS** — `upkeepDue(2) = 1` |
| 7 | Every existing entry holds; `FOUNDING_PILE_STEPS` unchanged | **PASS** — steps still `{1,2,3}` |
| 8 | An old save gains nothing | **PASS** — `cycle-136-mending`'s restore case: save, reload, still two landmarks, not four |
| 9 | **Reachable** — an e2e spec reads two landmarks on the Grove and a non-zero bill | **PASS** — `cycle-152-founding-skyline.spec.ts` |
| 10 | The structure handoff's prediction answered explicitly | **See below** |

**Note on criterion 4.** The design asked for three claims and named three; they shipped as **three
claims across two entries** rather than three entries. The mend and the heap-drop are one `played` block
on the existing `BACKLOG-488` entry because they are one thing a player watches in one moment — the cairn
goes up and the heap goes down in the same beat — and splitting them would have produced two predicates
that can never disagree. The bill is its own entry (`BACKLOG-480/528`) because it has a founded half of
its own. QA is recording this as a deviation from the design's letter, judged to serve its stated rule:
*"the register is a list of claims, not a normalised table."*

---

## Criterion 10 — the prediction, answered

The Structure-smith's handoff made a falsifiable prediction and invited the chain to disprove it:

> the founding park places one landmark, it is derelict, so `upkeepDue(0) = upkeepDue(1) = 0` and the
> entire upkeep economy of BACKLOG-480 is dormant on every fresh save in this park's history.

**The prediction was correct**, and QA confirmed it independently of the fix. `cycle-136-mending`'s own
first case — written at cycle 136 and green ever since — asserted `standing('grove') === 0` and
`runUpkeep(1) === []` on a fresh park, and its comment described that as *"480's rule is unchanged"*
rather than as a system that could never fire. Every other ground had no landmark at all. So the daily
bill, the lapse, and the disrepair state that four Artist fires have now drawn ruins for were unreachable
from boot, in a park that had been shipping them for sixteen cycles.

## The red runs, recorded

**Unit: 2 red.** Both in `tests/unit/away.test.ts`, both asserting the sub-day silence, one of which
carried the parenthetical *"no away-drift on a sub-day span"*. Repair category 1 — the item's own
subject, reproduced by the suite on the night the item shipped.

**E2E: 15 red**, and how they split is the finding:

- **6 repaired by one edit and no spec touched.** They call the `empty-grounds` fixture, whose declared
  contract is *"no founding ruin, no founding piles, no founding bank ledger"* — and the founding state
  grew a landmark. Teaching `__clearFounding` and its postcondition about the lean-to fixed all six.
  This is BACKLOG-495's seam catching a founding-constant move one cycle after it was built, which is
  the first evidence anyone has that the seam does what its verdict claimed.
- **5 repaired by naming a fixture** (`cycle-109-scarcity`, `cycle-111-plentywelcome`). Their subject is
  appeal ordering, and a built structure is one of prosperity's own signals, so *"Rex alone in the poor
  grove"* silently stopped being true. Category 2, exactly as the plan's repair order anticipated.
- **4 repaired by moving expectations** (`cycle-136-mending`). Category 1: their subject genuinely is
  the founding skyline. One is a real behavioural change and is asserted rather than papered over — a
  week-long absence used to end with the cairn patched and the ground finished; it now patches, pays a
  bill, cannot pay the next, and lets one landmark back down.

**Nothing was re-flattened and nothing was deleted.** No founding constant was moved back to make a spec
green, no ad-hoc test helper was written, and no register entry was removed.

## For the Validator

Two things QA wants on the record.

1. **Sixteen red in cycle 136, three in 151, fifteen tonight.** That is not a regression in discipline —
   tonight moved *two* founding facts at once (a landmark and an away threshold) where 151 moved one, and
   eleven of the fifteen were repaired without editing the spec's own subject. The number that matters is
   the six the fixture absorbed on its own.
2. **The reachability answer for the structure track is the first frame, not the bill.** The bill lands
   at the day boundary, which is twenty-four real minutes at `ACTIVE_SCALE` and inside `SESSION_MINUTES`
   but outside the bar's literal ten. The answer QA is putting forward is the one visible immediately:
   walk one edge east and there is a built thing standing beside a broken one, where this park has only
   ever shipped the broken one. The Validator should judge that claim on its own merits.
