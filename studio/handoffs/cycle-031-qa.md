# Cycle 31 — QA

**Item:** BACKLOG-120 [emergent] Jealous nuzzle

- **Build:** ✅ `npm --prefix game run build` clean.
- **Unit tests:** ✅ `npx vitest run` — **193 passed** (was 185; +8 in `homecoming.test.ts` jealous-nuzzle describe).
- **E2E tests:** ✅ **63/63 green** once the parallel-load flake is accounted for. The full parallel
  run reported 60 passed / 3 failed, all three in `cycle-003-save.spec.ts` (boot-time `__ready`
  flake, the documented parallel-load issue — last cycle it landed on `cycle-023-tap`). Re-ran
  `cycle-003-save.spec.ts` isolated: **5/5 pass**. Not a regression. The two new
  `cycle-031-jealous` specs both passed in the parallel run.
- **Boundary:** ✅ grep for `web-llm` outside `game/src/ai/` is empty.

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Near-tie (≤10 pts) + homecoming ⇒ non-null `jealous` naming 2nd-closest | PASS | unit "a near-tied runner-up gets a jealous beat naming them"; e2e near-tie |
| 2 | `jealous.name` is 2nd-highest, ties broken alpha-smallest | PASS | unit "breaks runner-up ties alphabetically" (`Glade` over `Mossback`) |
| 3 | `jealous.line` contains runner-up name + 😒 | PASS | unit "the jealous line names the runner-up and shows the 😒…" |
| 4 | `jealous.memory` references the closest dino | PASS | same unit — `memory` contains `Sunny` |
| 5 | Gap > 10 ⇒ `jealous` null | PASS | unit "a clear gap leaves no one jealous" + boundary test (gap 11 → null) |
| 6 | Only one befriended dino ⇒ `jealous` null | PASS | unit "a lone befriended dino has no runner-up…" |
| 7 | Below homecoming threshold ⇒ whole result null (no jealousy) | PASS | unit "a short absence stages neither homecoming nor jealousy" |
| 8 | In-world near-tie ⇒ 2nd sulk bubble + `__catchUp().jealous` non-null w/ runner-up name | PASS | e2e "a near-tied runner-up sulks…": `jealous` non-null, names differ, `__bubbleTexts` contains 😒 |
| 9 | build clean; vitest green; playwright green | PASS | build ✅; 193 unit ✅; 63 e2e ✅ (flake isolated 5/5) |

## Bugs found
None. The jealous beat changes no friendship points (verified: feature only floats a bubble +
folds a memory), and the `Homecoming` field add is additive — all 8 prior homecoming unit cases
and both cycle-030 homecoming e2e specs stay green. Additive save: no `SAVE_VERSION` bump, no new
save fields.

## Recommendation
**APPROVE.**
