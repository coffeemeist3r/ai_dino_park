# Cycle 115 — QA

**Build:** ✅ clean (`npm --prefix game run build`, type-check passes).
**Unit tests:** ✅ **1375/1375** (`npx vitest run` from root; was 1353, +22 new across `thaw.test.ts` 8 + `governance.test.ts` 14).
**E2E tests:** ✅ **394/395** (`npx playwright test`). The lone red — `cycle-094-pause-ambient` boot timeout — is the catalogued cold Vite/Phaser boot flake (memory `e2e-boot-flake`): it and both new cycle-115 specs pass green on an isolated re-run (`cycle-094-pause-ambient cycle-115-thaw cycle-115-governance` → 6/6). Off this cycle's diff, not a regression.

---

## Lore track — BACKLOG-215: Spring thaw relief

| Criterion | Status | Evidence |
|---|---|---|
| `thawedThroughWinter` true for a first-hand cold/neglect memory, false for warm-only, false for none | PASS | `thaw.test.ts` cases 1–4 |
| A dino carrying only a rumor about another's cold night is NOT counted (first-hand only) | PASS | `thaw.test.ts` "excludes a dino merely carrying word of ANOTHER dino's cold night" |
| On the turn, each survivor's friendship rises by exactly `THAW_LIFT`, files the memory, log shows `thawLine` | PASS | e2e `cycle-115-thaw` — Δ = 4 for the cold-slept dino, log contains 🌱 + "made it through the winter" |
| A turn into any season other than spring fires no thaw relief | PASS | `runThawRelief` is gated `if (turned === 'spring')` in `checkSeasonTurn`; spring is only reached from winter on a live tick (restore uses `syncSeason`, no beat) — verified by reading the diff |
| Build clean, suite green, spring-default byte-identical | PASS | build ✅, unit 1375 ✅; the thaw path is unreachable except on the winter→spring turn, so every non-turn tick is unchanged |

**Bugs found:** none.
**Recommendation:** **APPROVE** — all 5 acceptance criteria PASS. Closes the last Milestone 8 lore arc.

---

## Structure track — BACKLOG-463: The provider's say

| Criterion | Status | Evidence |
|---|---|---|
| `providerPriority(traits)` → 'feed' for agreeableness ≥ 0.5, 'bank' below | PASS | `governance.test.ts` "temperament sets the table" (0.5→feed, 0.49→bank, undefined→feed) |
| `feedReserve`: bank→`BANK_RESERVE`, feed→0, null→0 | PASS | `governance.test.ts` "hook 1" |
| `granaryDeferredForFeeding`: true iff feed & total < floor; false for bank & null | PASS | `governance.test.ts` "hook 2" truth table |
| `pickFoodToSpend(pile, fav, reserve)` ignores ids ≤ reserve; reserve default byte-identical | PASS | `governance.test.ts` "pickFoodToSpend reserve" (incl. default-0 identity) |
| In-game: a zone gains a policy once a provider stands; exposed via `__spendPriority` | PASS | e2e `cycle-115-governance` — null before provider, one of feed/bank after Rex banks 3, stable on re-read |
| A zone with no provider returns null and feeds/builds exactly as before (no regression) | PASS | e2e asserts null pre-provider; full foodstore/granary/provider suites (incl. cycle-107/110/111/114) all green — the no-provider seam holds |
| Build clean; suite green | PASS | as above |

**Bugs found:** none.
**Note on e2e scope:** the deterministic reserve/build-defer *behavior* is proved by unit tests, not e2e, because a resident's temperament (which picks feed vs bank) is name-seeded and not controllable from a spec; the e2e proves the integration seam (policy emerges with a provider, is absent without, persists on re-read). This matches the Coder's Shipped note and is sufficient coverage — the pure logic is exhaustively unit-tested and the no-provider compatibility seam is what guards existing specs.

**Recommendation:** **APPROVE** — all 7 acceptance criteria PASS.
