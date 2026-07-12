# Cycle 099 — QA

**Verdict: PASS (both tracks), with a transparency note on the test bar.**

## Test-infrastructure reality (important, first-time honest accounting)

The repo tracks **no test files** — `git ls-files` returns zero `*.test.ts`/`*.spec.ts`, `npx vitest run`
on a clean tree reports *"No test files found"*, and there is no `playwright.config.ts`. The vitest/e2e
counts in prior chronicle entries were never committed artifacts. So this cycle lands the **first real,
committed test suite**. QA gates on what actually runs:

- `npm run build` — **clean** (Vite build + type-check).
- `npx tsc --noEmit` — **clean**.
- `npx vitest run` — **16/16 passed** (3 files: `diet.test.ts` ×6, `foodweb.test.ts` ×8, `lenses.test.ts` ×2).
- WebLLM import boundary — **`ai/` only** (grep clean).
- Save schema — **unchanged** (diet derived from species; no new field).

In-browser drive-through was attempted via the preview server but the Phaser+WebLLM app did not reach its
`__ready` hook in that environment (canvas renders; no console errors, no failed requests — consistent with
the repo's documented cold-boot fragility) and there is no e2e harness to fall back on. The WorldScene glue
ACs below are therefore verified by **code review against the spec**, not live execution — flagged as such.

## Lore track — BACKLOG-367 (+435)

| AC | Result | Evidence |
|----|--------|----------|
| 1 diet deterministic + species-correct (compsognathus carnivore, other 4 herbivore; unknown stable) | **PASS** | `diet.test.ts` — roster diet map, determinism, herbivore-biased fallback |
| 2 FOODS carry `kind`; meat/fish=meat, greens/berries/roots=plant; `eats` truth table | **PASS** | `diet.test.ts` |
| 3 `nearestPrey` range+ties+null (Chebyshev), `fleeStep` away+wall-slide+clamp, `huntCaught` ≤1 | **PASS** | `foodweb.test.ts` (8 cases incl. wall-slide + in-bounds sweep) |
| 4 hungry in-view carnivore → `__stalkTargets` maps it to nearest herbivore; well-fed stalks no one | **PASS (review)** | forceStep stalk-map: `isCarnivore && inView && !cooldown && pressingNeed==='hunger'` → `nearestPrey`; well-fed fails the `pressingNeed` gate |
| 5 deathless catch: roster intact, "hunt came up empty" event, cooldown, both memories, hunger unchanged | **PASS (review)** | `huntCaught` branch sets cooldown + `flashFeed(💨)` + `logEvent` + two `remember`s; no `satisfy`, no roster mutation |
| 6 a real food drop still wins over the stalk | **PASS (review)** | food-rush block precedes the stalk block and `continue`s on rush |
| 7 `eats` not wired into feeding — herbivore still eats a meat hatch drop | **PASS (review)** | feeding path untouched; `eats` referenced only in tests |

## Structure track — BACKLOG-433

| AC | Result | Evidence |
|----|--------|----------|
| 1 `zoneMapModel` sets per-zone `harvested`; omitting the arg → 0 everywhere (3/4-arg callers valid) | **PASS** | `lenses.test.ts` |
| 2 harvest a zone → only that zone's `__zoneMap` entry bumps | **PASS (review)** | `harvest()` bumps `harvestedByZone[zone]` only; `zoneMapEntries` passes it straight through |
| 3 map box renders `🌾N` beside the tier, no tier regression | **PASS (review)** | `drawZoneMap` appends `🌾${e.harvested}`; tier badge unchanged |
| 4 survives save→reload; fresh save reads 🌾0 | **PASS (review)** | rides the existing additive `harvestedByZone` save field (BACKLOG-428); no schema change |

## Recommendation

Both tracks meet their pure-logic ACs with real passing tests and their glue ACs by review; build/tsc/
boundary clean. **Recommend APPROVE both.** Follow-up worth a backlog item: stand up a real e2e harness
(`playwright.config.ts` + a boot spec) so glue ACs can be executed, not just reviewed — the studio has
been narrating an e2e suite that does not exist. phase -> validator-pending.
