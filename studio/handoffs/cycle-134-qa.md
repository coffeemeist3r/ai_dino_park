# Cycle 134 — QA

**Build:** `npm run build` clean.
**Unit:** `npx vitest run` — **1821 passed / 1821**, 187 files (was 1803; +13 for 409, +5 for the rng module).
**E2E:** `npx playwright test` — **527 passed / 527**, three consecutive times (evidence below).
**Boundary:** `@mlc-ai/web-llm` appears nowhere under `game/src` outside `game/src/ai/`.
**Save:** additive only — `ticsFormed`, `ticEchoFrom`; `SAVE_VERSION` unbumped; a pre-409 payload parses clean.

---

## Lore track — BACKLOG-409

| # | Criterion | Result |
|---|---|---|
| 1 | `ticBookLine(t)` renders `<glyph> ritual: <label>` | **PASS** |
| 2 | `ticBookLine(t, 'Thornback')` appends `— caught off Thornback` | **PASS** |
| 3 | `null` / omitted source render identically, no dangling separator | **PASS** (`''` too) |
| 4 | `bookLines` shows the line when present, omits it entirely when absent | **PASS** |
| 5 | Quirk line stays above it, `today:` / `plans:` stay below | **PASS** |
| 6 | Every pre-409 `BookRow` literal still type-checks and renders unchanged | **PASS** — zero existing assertions amended, third cycle running |
| 7 | A dino driven through `__inventTic` shows its ritual in `__book()` | **PASS** |
| 8 | A dino that has never ticced shows no `ritual:` line | **PASS** — asserted across the whole fresh park, not one dino |
| 9 | A 407 watcher shows `— caught off <performer>`; the performer shows no suffix | **PASS** |
| 10 | The line survives a save/reload round-trip | **PASS** |
| 11 | A pre-409 save loads clean; a dino carrying an echo still shows a ritual | **PASS** (unit: back-fill union) |
| 12 | Malformed `ticsFormed` / `ticEchoFrom` rejected rather than half-loaded | **PASS** |
| 13 | The line outlives the stretch that made it (the lifetime-vs-per-stretch split) | **PASS** — e2e crowds the cast back in until `invented` drops and the book line is still there |

13/13. New coverage: `tests/unit/cycle-134-tic-book.test.ts` (13), `tests/e2e/cycle-134-tic-book.spec.ts` (5).

---

## Structure track — BACKLOG-486 — two rework loops, and three causes

### The measurements, in order

| run | config | result | wall |
|---|---|---|---|
| baseline | `--workers=6 --timeout=30000` (the old behaviour, reproduced deliberately) | **1 failed** — `cycle-129-berth` | 9.4m |
| 1 | attempt 1: `workers=4`, `timeout=60000` | **2 failed** — `cycle-077-carry`, `cycle-129-berth` | 8.8m |
| 2 | attempt 1 | 527/527 | 8.7m |
| 3 | attempt 1 | **1 failed** — `cycle-110-plenty` | 8.6m |
| 4 | + seeded dice (rework 1) | **1 failed** — `cycle-121-yearning` | 9.0m |
| 5 | + seeded dice | 527/527 | 8.7m |
| 6 | + seeded dice | 527/527 | 8.7m |
| **F1** | + flushed saves (rework 2) | **527/527** | 8.7m |
| **F2** | + flushed saves | **527/527** | 8.9m |
| **F3** | + flushed saves | **527/527** | 9.2m |

**Three consecutive clean full runs, 527/527 each.** The success condition is a number and the number is met.

### Three causes, not one

The item was written on the premise that the failure "is a property of the run." That was half right — it is
not a property of any particular spec, as four cycles of distinct victims proved — but it was never *one*
thing, and each attempt this cycle found a different mechanism:

1. **A boot ceiling equal to the per-test budget.** `helpers.ts` waited 30s for `__ready` while Playwright's
   default per-test timeout was also 30s, so a boot that legitimately took 22s under six-way cold load could
   only ever surface as whichever assertion the clock landed on. Fixed by an explicit worker cap
   (`E2E_WORKERS` overridable) and `timeout: 60_000`, with the invariant documented at both ends. Real, and
   insufficient on its own.
2. **Assertions over live dice.** `cycle-129-berth` fell `127.999 → 96` — **exactly one tile**. The spec
   asserts a wary dino does not close on the food during a world step in which it wanders in a randomly
   chosen direction. No cap and no re-run can make that informative. Fixed by giving the world's randomness a
   seam (`game/src/world/rng.ts`): `rand()` is `Math.random()` verbatim when unseeded — production untouched,
   and every unit test that stubs `Math.random` still works — and an LCG when seeded. All 35 real randomness
   sites route through it, including the four modules whose injectable `rand` parameter defaulted straight
   back to `Math.random`. `boot()` seeds every spec with one fixed value.
3. **A race against a write that had not landed.** `cycle-121-yearning` reloads and asserts the departure
   clock survived, but `__migrate` auto-saves fire-and-forget, so under load the reload beat the IndexedDB
   write. 456 documented this and `cycle-121-work-priority` already carried the fix; three specs had the same
   shape and no `__flushSave()` — 121-yearning, 122-struck, **123-wandering**. That last one is a recorded
   victim from cycle 130, so this closes that case retroactively.

| # | Criterion | Result |
|---|---|---|
| 1 | Explicit `workers`, `E2E_WORKERS` overrides | **PASS** |
| 2 | Per-test `timeout` strictly > `BOOT_TIMEOUT` | **PASS** (60s > 30s, documented at both ends) |
| 3 | `rand()` is `Math.random()` unseeded, incl. for a stubbing caller | **PASS** |
| 4 | Same seed replays; different seeds diverge; every draw in [0, 1) | **PASS** (5000-draw sweep) |
| 5 | No `Math.random` left in a decision path under `game/src` | **PASS** (comments and `rng.ts` aside) |
| 6 | The historical victims pass repeated runs | **PASS** — berth/carry/plenty/wandering 33/33, the three reload specs 63/63 |
| 7 | Three consecutive full runs green, wall times recorded | **PASS** — 527/527 × 3 |
| 8 | No assertion weakened, no skip, no `test.slow()`, no retries | **PASS** — three specs gained a `__flushSave()`; not one `expect` changed |
| 9 | Build + unit unaffected | **PASS** |

9/9.

### Standing note for the next cycle

Eleven other `page.reload()` sites were audited; the remaining ones either re-`boot()` (so nothing is pending)
or assert a *derived* value that needs no save. Only the three `__migrate`-then-reload specs carried the race,
and all three are patched. Worth re-auditing whenever a new hook starts auto-saving.
