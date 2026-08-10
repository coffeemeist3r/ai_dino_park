# Cycle 127 — QA

**Verdict recommendation: PASS on both tracks.** 25 of 25 acceptance criteria pass (2 with a note).

## Suite

| gate | result |
|---|---|
| `npm run build` | clean (type-check passes) |
| `npx vitest run` | **1664 / 1664 green**, 177 files (was 1651 / 177 at cycle 126 — +13 this cycle) |
| `npx playwright test` (run 1) | 481 / 482 — `cycle-122-distance.spec.ts:41` timed out in `boot()` at `page.goto`; **7/7 green re-run isolated** |
| `npx playwright test` (run 2, fresh) | 481 / 482 — `cycle-062-resource.spec.ts:43` failed; **2/2 green re-run isolated** |
| `@mlc-ai/web-llm` outside `game/src/ai/` | no hits (grep) |
| save format | unchanged — neither track adds a field |

**On the e2e reds.** Two full runs, one failure each, and it was a **different spec each time** — neither
of them touched by this cycle's diff (122-distance is the hop table; 062-resource is the cycle-62 resource
spawn). Each passed when re-run isolated. That is the catalogued parallel-load flake (BACKLOG-456 built
the hold seam for exactly this family), and the fact that it *moved between runs* is the strongest
available evidence it is load and not logic. **Recorded plainly rather than dressed up: this cycle did
not produce a single fully-green 482-spec run.** The honest read is 482/482 achievable but not observed
in one pass; the same was true at cycle 125 and 126 for different specs. It is not a regression, and it
is also not nothing — the flake rate is now visibly ~1 spec per full run, up from "occasional".

BACKLOG-430 (`mobile-minds` long-dialog paging) **passed in both runs** — its third and fourth
consecutive green. The standing red it was filed for has not reproduced in three cycles.

## Lore track — BACKLOG-402 (the manner at the hatch)

| # | criterion | result |
|---|---|---|
| 1 | `hatchManner([])` / `mannerLine([])` are null | PASS — `manner.test.ts` "shows nothing…", also asserts unrelated memories (`you ate alongside…`, `you brought down a meal`) don't count |
| 2 | yield-only ring → `generous` | PASS |
| 3 | gobble-only ring → `greedy` | PASS |
| 4 | stand-only ring → `unbowed` | PASS |
| 5 | slink-only ring → `timid` | PASS |
| 6 | the 385 repay counts generous | PASS — `mannerTallies` asserted `{generous: 2, …}` for yield + repay |
| 7 | two generous + one greedy → `generous` | PASS, and the mirror (two greedy + one generous → greedy) |
| 8 | generous/timid tie → generous | PASS, asserted in **both** memory orders — the rule is not order-luck |
| 9 | greedy/unbowed tie → unbowed | PASS, both orders |
| 10 | `mannerLine` shape per manner | PASS — all four exact strings pinned |
| 11 | `bookLines` renders the row only when set | PASS — plus a **byte-identical** whole-render assertion for a row without a manner, which is the strongest form of "nothing else moved" |
| 12 | e2e: book shows the line for a dino with the memory, not for one without | PASS — `cycle-127-manner.spec.ts`, block-scoped so the assertion is about *that dino's* block and not the page |
| 13 | zero console errors | PASS |

**QA note (not a defect).** The e2e drives the manner through `__remember`, not through an actual
contested drop — a real gobble-vs-stand at the hatch needs two dinos, a drop and specific hunger/bravery
values, which no existing hook stages. The **derivation** is fully proven and the **memory strings are
proven to be the real ones** (`manner.test.ts` imports `slunkOffMemory` from `feeding.ts` rather than
re-typing it, so a reworded 394 memory fails the unit test). What is *not* observed end to end is the
path from a live contested drop to a book line. Same class of gap as cycle 126's "organic path
hook-proven but never observed"; worth a Validator eye on whether that gap is now a pattern.

## Structure track — BACKLOG-479 (more than one voice on the call)

| # | criterion | result |
|---|---|---|
| 1 | `zoneCouncil([], 'grove')` is `[]` | PASS |
| 2 | all-zero banks → `[]` (fresh park seats nobody) | PASS — unit **and** e2e (`__councils()` empty for every ground on a fresh boot) |
| 3 | 1 resident with ≥1 banked → that dino | PASS, with the 0-banked twin asserted `[]` |
| 4 | 4 eligible → top 2 | PASS |
| 5 | 6+ eligible → exactly 3 (cap) | PASS (8 residents) |
| 6 | residents of other zones never seated | PASS — a 99-banked outsider does not sit |
| 7 | a 0-banked dino never seated even with seats free | PASS |
| 8 | banked-desc, alphabetical tie, stable across calls | PASS — **this expectation was corrected during the fire** (see below) |
| 9 | the provider is seat 1 | PASS — asserted as `zoneProvider(...) === zoneCouncil(...)[0]` on one roster, in unit **and** e2e |
| 10 | `zoneMapModel` at the old arity → `council: []` | PASS |
| 11 | ` 👥N` shows only at N ≥ 1 | PASS — e2e asserts the map text has no `👥` on a fresh boot and `👥1` after banking |
| 12 | `bookLines` renders the seat row only when set | PASS |
| 13 | e2e: banking seats a voice on that ground; fresh boot shows none | PASS — `cycle-127-council.spec.ts` |
| 14 | zero console errors | PASS |

**The finding worth carrying to the Validator.** The structure handoff predicted the sharp question would
be *sizing and storage*, and it was, but the interesting part landed in the **test**, not the code: the
first draft of criterion 8 expected three seats from four residents, i.e. the assertion was written to a
rule (top-3) the item does not have. That is precisely the M10 lesson recurring at a smaller scale — an
assertion narrower (here, *looser*) than the system it guards — and it was caught only because the seat
rule was extracted as `councilSeats()` and unit-tested independently of the roster path. Had seat-sizing
stayed inline in `zoneCouncil`, the wrong expectation would have been "fixed" by making the code match it.

**Degenerate cases are covered by construction and by spec:** unsettled ground (no residents) → `[]`;
the 460-floor single resident → seated only if it has banked; fresh save → empty park-wide, which is the
inertness standard 476 set and the sharpest spec in the cycle.

## Cross-track

- The two derivations share no module and no book row, as the design required. `ui/lenses.ts` carries both edits in separate symbols; `WorldScene.bookRows()` carries both fields, three lines apart.
- `zoneCandidates()` is the one place the roster is shaped for both standings reads. `providerFor` and `zoneCouncils` cannot drift — the "provider is seat 1" criterion is now structural, not incidental.
- The planned `councilFor()` was deleted as dead code (the type-check caught it). Correct call: `zoneCouncils()` serves both callers, and a singular wrapper with no caller is the kind of thing that rots.
