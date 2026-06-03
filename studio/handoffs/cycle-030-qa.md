# Cycle 30 — QA

**Item:** BACKLOG-112 [emergent] Homecoming nuzzle.

**Build:** ✅ `npm --prefix game run build` clean (tsc + vite, 8.3s).
**Unit tests:** ✅ **185 passed** / 25 files (+8 in `homecoming.test.ts`).
**E2E tests:** ✅ **61 tests**, green. The full parallel run showed **60 passed / 1 failed**;
the lone failure was `cycle-023-tap.spec.ts` timing out at the `canvas`/`__ready` boot gate —
the documented parallel-load flake (a different spec each run) — which passed **2/2 isolated**
(`--workers=1`). My own `cycle-030-homecoming.spec.ts` passed both in the full parallel run and
isolated. Not a regression.

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Pure `homecoming()` selects the highest-friendship dino | PASS | unit "picks the highest-friendship dino after a long absence" |
| 2 | Ties broken deterministically (alphabetical) | PASS | unit "breaks ties alphabetically by name" → Glade over Mossback/Twitch |
| 3 | No homecoming below the away threshold | PASS | unit "returns null for a short absence" + e2e "a short absence stages no homecoming" (`__catchUp(60_000)` → null) |
| 4 | No homecoming when no friendship | PASS | unit "returns null when no dino has any friendship" (empty + all-zero) |
| 5 | Line non-empty, contains name + 👋, warmth varies with hearts | PASS | unit "line contains the name and a 👋, and high vs low hearts differ" |
| 6 | Bubble over the chosen dino on a long absence (via `__homecoming()`) | PASS | e2e "a long absence stages a welcome-back beat" — `__catchUp(2 days)` → `homecoming.name === 'Sunny'`, line contains 👋; `playHomecoming()` ran without throwing |
| 7 | Short absence → `__homecoming()` null, no bubble | PASS | e2e "a short absence stages no homecoming" → `result.homecoming === null` and `__homecoming()` null |
| 8 | Chosen dino gains a homecoming memory | PASS | WorldScene folds `hc.memory` via `remember(...)` on both restore + `__catchUp`; `homecoming().memory` non-empty (unit "carries a non-empty homecoming memory string") |
| 9 | Build clean; unit green; e2e green | PASS | see header |

## Bugs found
None. No regression in the away digest path (cycle-029-away.spec green in the full run), no
hearts change (criterion-by-design: homecoming does not bump friendship), boundary intact
(`homecoming.ts` imports only `friendship.ts`).

## Recommendation
**APPROVE.**
