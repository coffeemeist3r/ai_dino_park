# Cycle 110 — QA

**Build:** ✅ `npm run build` clean (type-check passes).
**Unit tests:** ✅ `npx vitest run` — 1295/1295 passed (142 files), incl. new `plentyword.test.ts` (7),
`granary.test.ts` (7), extended `foodstore.test.ts` (raised-cap + carry) and `saveGame`/`cycle-061` (granary field).
**E2E tests:** ✅ `npx playwright test` — 377/377 passed. New `cycle-110-plenty.spec.ts` (2) + `cycle-110-granary.spec.ts`
(3); `cycle-074-shelter.spec.ts` updated to 454's intended behaviour and green. No flake (single clean full run).

---

## Lore track — BACKLOG-458 Word of plenty

| Criterion | Status | Evidence |
|---|---|---|
| `plentyMemory` shareable, `plentyWordLine` carries `RUMOR_MARK` | PASS | `plentyword.test.ts` "the first-hand seed is shareable, the rumor is not" |
| `spreadPlentyWord` plants only from a first-hand carrier (1 hop) | PASS | `plentyword.test.ts` "plants word…" + "does not re-spread a merely-heard rumor" |
| `spreadPlentyWord` null for self / no plenty news | PASS | `plentyword.test.ts` "is a no-op for self, or a speaker with no plenty news" |
| `plentyTarget` returns newest non-current named zone, null otherwise | PASS | `plentyword.test.ts` 3 `plentyTarget` cases |
| After spread, listener's `__plentyTarget` is the zone id | PASS | e2e `cycle-110-plenty` "a thriving zone seeds…and primes a target" |
| Primed dino picked by `pickMigrant` + crosses to the named zone | PASS | e2e `cycle-110-plenty` "hearsay of plenty chooses the migration destination over the richer neighbour" |
| Grove-pull tiers untouched (076/078) | PASS | full e2e green incl. `cycle-076`/`cycle-078` migrant-identity specs |
| Build/unit/e2e green | PASS | see header |

**Bugs found:** none.
**Recommendation:** APPROVE.

---

## Structure track — BACKLOG-454 The granary

| Criterion | Status | Evidence |
|---|---|---|
| `canBuildGranary` truth table (hasGranary / landmarks / affordability) | PASS | `granary.test.ts` 4 gate cases |
| `buildGranary` spends recipe, no mutate, null when unaffordable | PASS | `granary.test.ts` 2 spend cases |
| `granaryFoodCap(true/false)` | PASS | `granary.test.ts` "lifts the flat cap…" |
| `foodAtCap`/`bankFood`/`pickFoodCarry` honour an optional cap, default byte-identical | PASS | `foodstore.test.ts` raised-cap + carry-accept cases; all pre-existing default-arg tests green |
| ≥3 landmarks + recipe → granary placed, recipe spent; <3 → bias landmark | PASS | e2e `cycle-110-granary` tests 1 & 2 + `cycle-074-shelter` |
| A granary'd zone banks a harvest past 6 (→9); no granary stalls at 6 | PASS | e2e `cycle-110-granary` "bank past the flat cap of 6" |
| Granary persists round-trip; old saves load `[]` | PASS | unit `saveGame.test.ts` "round-trips granaries, defaults absent, rejects malformed" |
| Build/unit/e2e green | PASS | see header |

**Bugs found:** none. Note: the granary gate legitimately changes the bowl's post-3-landmark behaviour (it saves
toward a granary instead of a 4th cairn); `cycle-074-shelter.spec.ts` was updated to assert the new, intended flow
(3 cairns → granary, still never a lean-to). Not a masked regression — a corrected expectation.
**Recommendation:** APPROVE.
