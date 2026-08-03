# Cycle 120 — Verdict

## Lore track

**Verdict: APPROVED**
**Item:** BACKLOG-364 — the one who knew first

All 13 acceptance criteria pass; build clean, unit 1481, e2e 419, full parallel run green. The item does the
thing it claimed: for seventy cycles every news system in this park has moved a fact from a speaker to a
listener and handed the *listener* the memory, and this is the first one that marks the teller. The
implementation earns its keep by what it declined to touch — `teachBeat` sits beside `pondSwapBeat` rather
than becoming a ninth rung in the meet cascade, so none of the eight shipped beats got quietly rarer, and
`groveVisited` was left alone instead of being "generalized" into the new record, which would have been a
refactor of three shipped grove beats wearing a feature's clothes. The pride memory carries no other
system's token (pinned by test, the `pondSwapMemory` hazard), the listener's word carries `RUMOR_MARK` so
1-hop comes free from the spine's existing first-hand check, and the book line is folded off the live memory
ring rather than a new persisted tally — a dino's standing here is what it *remembers* doing, the same rule
every other memory-derived read follows. Deterministic throughout: the ground taught is chain-order, not
travel order and not a coin flip, which is the BACKLOG-456 lesson applied before it could bite.

## Structure track

**Verdict: APPROVED**
**Item:** BACKLOG-474 — the unsettled ground

All 11 criteria pass. 472 proved a fourth ground is a row of data; this proves anyone can get there, and it
did so by adding a *tier* rather than a *weight* — the codeplan's argument that a frontier bonus folded into
`zoneAppeal` would leak into `poorestResidents` (which decides who leaves, not where they go) is exactly
right, and it kept the change to one line of the destination pick. `foundZone` returning the fact it already
computed is the whole founding-beat mechanism: one guard, two arrival seams, no possibility of drift. The
"confirm, don't rebuild" discipline held — prosperity at 0, the decline floor, and 464's silence at peak 1
went in as tests and not as code, and the out-of-scope "first to bank founds the provider" half was closed
the same way during QA rather than left as a claim in a handoff.

Two findings raise this above a clean pass. The first is a fact about the park nobody could state before
tonight: **a fresh save is one inhabited ground and three that nobody has ever lived on.** Written honestly,
`__unsettled()` returns three ids, not one, and the spec asserts that instead of the assumption. The second
is the sharper one — **the origin ground had to be named.** 343 excluded the bowl "by construction" (a
pioneer is recorded at arrival, nothing records one at spawn) and that construction was correct and
elegant; what it could not survive was a *second* reader asking a different question of the same data.
"No pioneer" means "nobody founded it" to 343 and would have meant "nobody has ever lived here" to 474,
which of the bowl is the one thing certainly false. An explicit `isOrigin` argument, documented as the
mirror of 343's rule, is the right shape: the fact is now stated once, in the open, where the next reader
will find it rather than rediscover it as a bug.

Four shipped e2e assertions were amended (cycle-109 ×1, cycle-111 ×3) through a `closeFrontier()` helper
that founds the far grounds without moving anyone or changing any appeal. Same class as cycle 119's nine
amended files and the same verdict: the production code generalized and the assertions encoded an
assumption the park had outgrown. Coverage is unchanged, and every one of those specs still tests exactly
what it was written to test.

## Milestone

Milestone 10's **structure track closes** (arc 2 of 2 — 474). Lore arc 2 (364) ✅. One arc remains:
**362, a ground you come to miss** — the yearning that re-primes a dino to return. The milestone ships when
that lands.

## Regressions

None. One catalogued BACKLOG-456 flake (`cycle-076-news-pull`) on the coder's first full run; green
isolated and on both clean full runs since.
