# Cycle 103 — QA

**Verdict: PASS both tracks.** Recommend APPROVE / APPROVE.

## Gates
- `npm run build` — clean (tsc -b + vite build, no errors).
- `npx vitest run` — **1164 / 1164 green** (130 files). +11 over cycle 102's 1153: `feeding.test.ts` (4, new)
  + `foodstore.test.ts` (5, new) + `lenses.test.ts` (2, banked-food).
- `npx playwright test` (full, warm) — **331 passed**, 2 failed on the parallel run
  (`cycle-077-carry`, `cycle-097-carry-pressure`). Re-run isolated `--workers=1` → **3/3 green**. Both are
  the catalogued parallel-load flake (cross-zone `__migrate`/`__setZone` state races between workers); the
  cycle-103 diff never touches resource carry (`resource.ts`/`crossDino` untouched). Not a regression.
- WebLLM boundary: `@mlc-ai/web-llm` still imported only under `game/src/ai/` (no new import added).
- Saves additive-only: `foodPileByZone?` is additive-optional; a pre-446 save loads it as `{}`.

## Acceptance — Lore (BACKLOG-373 · shared meal)
- **L1** ✅ Two different dinos eating within the window → bond +3 (`SHARED_MEAL_BOND`), a 🍽 + "ate
  together" ticker line (e2e: `__bond` before/after, `__events`).
- **L2** ✅ Same dino eating twice → no self-pair, no bond move, no "ate together" event (e2e).
- **L3** ✅ Stale prior meal (> window) → no pairing (unit `feeding.test.ts`).
- **L4** ✅ `sharedMeal` unit-tested: pair / self / stale / null-prev.
- **L5** ✅ build + vitest green; e2e drives two feeds + the self case.

## Acceptance — Structure (BACKLOG-446 · a zone banks its harvest)
- **S1** ✅ Harvesting a ripe plot banks one crop unit into the zone food pile; the drop into the feeding
  loop is unchanged (`__zoneFoodPile('bowl').berries === 1`, `__food().foodId === 'berries'`).
- **S2** ✅ Banked food reads on the zone-map lens (`__zoneMap()` bowl `banked === '🍓 1'`); empty pile → ''.
- **S3** ✅ `bankFood` clamps at `FOOD_STOCKPILE_CAP` and never mutates input (unit `foodstore.test.ts`).
- **S4** ✅ Save round-trips `foodPileByZone` (additive; absent → `{}`).
- **S5** ✅ build + vitest green; e2e harvests + asserts the bank + lens.

phase → validator-pending.
