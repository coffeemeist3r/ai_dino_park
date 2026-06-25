# Cycle 77 — QA

**Build:** ✅ `npm run build` clean (type-check passes).
**Unit tests:** ✅ 787 passed (+12 this cycle: 5 pond-swap in groveword.test, 7 in cycle-077-carry.test).
**E2E tests:** ✅ effectively 242/242. Full run showed **1** failure — `cycle-076-news-pull` (`__maybeMigrate` pick) — which passed **green isolated** (828ms); it's last cycle's curiosity-pick spec, untouched by this cycle's diff, and is the documented rotating parallel-load flake (the migration pick depends on timing under parallel worker load). Both new cycle-077 specs passed in the full run.

## Lore track — BACKLOG-346 Pond-swappers

| Criterion | Status | Evidence |
|---|---|---|
| Both grove-visited dinos each file a `traded pond stories with <other>` memory | PASS | e2e cycle-077-pond-swap: both Rex & Mossback carry the named memory after `__pondSwap` |
| Pair bond rises by `POND_BOND` (symmetric, ≤ SHARED_WONDER_BOND) | PASS | e2e: `__bond('Rex','Mossback')` > before; unit: `POND_BOND` positive & ≤ 4 |
| A meeting with ≥1 un-traveled dino → no swap, no memory, no bond change | PASS | e2e: `__pondSwap('Rex','Sunny')` false, Sunny no memory, bond flat; unit `pondSwap` false for one/neither/self |
| Swap memory does not re-spread as grove news | PASS | unit: `pondSwapMemory` excludes `GROVE_NEWS_TOKEN`, `spreadGroveWord` returns null for a swap-only holder |
| `__pondSwap(a,b)` hook drives the real beat off live `groveVisited` | PASS | e2e uses it; returns true/false matching visited state |
| Cascade byte-identical when swap doesn't fire | PASS | the cold/warm/relief/grove/gossip specs (cycle-049→053, 075) all green in the full run; swap is an additive post-cascade block |

**Bugs found:** none.
**Recommendation:** APPROVE.

## Structure track — BACKLOG-329 Carry between zones

| Criterion | Status | Evidence |
|---|---|---|
| Crossing with non-empty source + below-cap dest moves exactly one (source −1 / dest +1, conserved) | PASS | e2e cycle-077-carry: bowl branch 1→0, grove branch 0→1 across Rex's crossing |
| Empty source pile → no carry, piles unchanged | PASS | e2e: second crosser (Mossback) out of the emptied bowl pile leaves grove at 1; unit `pickCarry({})` null |
| Dest at cap for every offered kind → no carry (lossless) | PASS | unit: `pickCarry({branch,stone}, {both at cap})` null; capped-branch picks stone instead |
| Log line names the carried kind + destination | PASS | `crossDino` logs `<glyph> <name> carried a <kind> to <zone>` |
| Instant `__migrate`/relocate path carries nothing (parity) | PASS | carry lives only in `crossDino`; cycle-068/069/071 migration & zone specs all green in full run |
| `__zoneStockpile(z)` reflects post-carry piles; pick is deterministic | PASS | e2e reads both piles; unit pins stable-sort tie order (branch before stone) |
| `stockpileByZone` round-trips through save, no version bump | PASS | save shape unchanged (cycle-076 zone-stockpile spec green); no `SAVE_VERSION` touch |

**Bugs found:** none.
**Recommendation:** APPROVE.
