# Cycle 41 — QA

**Item:** BACKLOG-170 [emergent] Seasonal palates

## Results
- **Build:** ✅ `npm --prefix game run build` clean (52 modules, no TS errors).
- **Unit tests:** ✅ 298 passed (35 files). +7 over cycle-40 (6 seasonal-palates in foods.test, 1 in scan.test).
- **E2E tests:** ✅ 105 specs. First full run 104 passed / 1 failed — the failure was
  `cycle-002-daynight.spec.ts` boot timeout (`__ready` not set within 30s at helpers.ts:22), the
  documented cold parallel-load flake. Re-run **isolated → both cycle-002 specs pass in 939ms**.
  No logic failure; nothing in the diff touches the day/night path. All four new cycle-041 specs
  passed in the full run.

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `seasonCraving` maps seasons 1:1 (spring→greens, summer→berries, fall→fish, winter→meat) | PASS | foods.test "the craving maps the four seasons 1:1"; e2e "the seasonal craving table is live to the bowl" |
| 2 | `favoriteFood(traits)` no season = exact cycle-061 result, all roster | PASS | foods.test "omitting the season reproduces the cycle-061 verdict"; existing foods/scan tests still green |
| 3 | Near-tied dino changes across seasons (Rex winter meat / summer berries) | PASS | foods.test "a near-tied dino sways"; e2e "begs differently in winter than in summer" |
| 4 | Strong-fit dino never sways (Twitch greens ×4) | PASS | foods.test "a strong-fit dino never sways"; e2e "stays loyal to its food all year" |
| 5 | Bonus only promotes the craved food (never reorders the rest) | PASS | foods.test "the bonus can only promote the craved food — base or that craving" |
| 6 | In-world eat reads live season; cycle-027 favorites still green | PASS | e2e "the bowl eats by the live season: meat delights a meat-craver in winter"; cycle-027-favorites both specs green in full run |
| 7 | Field Scan favorite line reflects live season; season-less scan test green | PASS | scan.test "the favorite-food line follows the live season" + existing season-less scan assertions green |
| 8 | Build clean; vitest green; playwright green | PASS | see Results above |

## Bugs found
None. No new `pageerror` in the seasonal eat spec (asserted `errors === []`). No save-format change,
no new deps, NPCBrain not in play.

## Recommendation
**APPROVE.** 8/8 acceptance criteria pass. The one red in the full e2e run is the known cold-boot
parallel flake (green isolated), not a regression.
