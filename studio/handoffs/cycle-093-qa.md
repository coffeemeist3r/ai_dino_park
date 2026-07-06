# Cycle 93 — QA

**Gate run:** `npm run build` clean (tsc + vite). `npx vitest run` → **1020 pass / 0 fail** (113 files).
`npx --yes kill-port 5173 && npx playwright test` → **301 pass / 2 fail**; both failures off-diff and
diagnosed below.

## Structure track — BACKLOG-417 (frond thatch)

| # | Criterion | Result |
|---|-----------|--------|
| 1 | `zoneStructure(FERNREACH)==='thatch'`; recipe deep-equals `THATCH_RECIPE`; bowl/grove unchanged | ✅ cycle-093-thatch.test |
| 2 | `buildStructureFor`: frond-4 pile → frond-4; under-recipe → null; bowl parity with `craft`; pure | ✅ cycle-093-thatch.test |
| 3 | `STRUCTURE_BY_BIAS` total over ResourceKind (stone/branch/frond all mapped) | ✅ cycle-093-thatch.test |
| 4 | In-world: Fernreach pile → frond≥4 builds a 🥻 thatch, pile drops by recipe; bowl still cairns; three landmark types | ✅ cycle-093-thatch.spec (both tests) |
| 5 | Thatch renders from the stashed rig (`__thatchIsArt===true`); glyph is code fallback only | ✅ cycle-093-thatch.spec |
| 6 | Additive save: thatch survives serialize→deserialize→restore; pre-417 save loads clean | ✅ cycle-093-thatch.spec (`save.thatches.length===1`, `version===2`) + saveGame.test |

Cross-track guard: `structureRecipe(FERNREACH)` now feeds carry/barter with `{frond:4}`; frond is
Fernreach-exclusive (400), so other zones have no fronds to give and carry falls back to a spare —
verified unchanged by cycle-088-third-zone-bias.test (barter spare-fallback still green) and the full
carry/barter spec set (cycle-077/081/087) all pass.

## Lore track — BACKLOG-341 (home-zone settling)

| # | Criterion | Result |
|---|-----------|--------|
| 1 | `belonging.ts` helpers: purity, defaults, threshold, damp bounds, line format | ✅ cycle-093-belonging.test (6 cases) |
| 2 | In-world: tenure accrues over `__settleTick`; below threshold not settled, at/after settled | ✅ cycle-093-settle.spec (tenure 3 → false, 4 → true) |
| 3 | In-world: settled dino's book text contains `at home in ` + zone display name | ✅ cycle-093-settle.spec (`at home in Pocket Cretaceous`) |
| 4 | In-world: a home-zone change resets tenure to 0 | ✅ cycle-093-settle.spec (post-`__migrate` tenure 0, settled false) |
| 5 | Deterministic floor: no WebLLM dependence; zero new console errors headless; damp unit-pinned | ✅ both specs assert `errors===[]`; damp tested via injected `rand` |
| 6 | Additive save only: a pre-cycle save (no `tenure`) loads clean (empty tenure) | ✅ saveGame.test (defaults `{}`) |

## The two e2e failures (both off-diff, NOT cycle-93 regressions)
- **`cycle-028-realtime` "T toggles the scale knob"** — the catalogued parallel-load cold-boot flake.
  Passed on isolated re-run (`--workers=1`). Note, not a regression (per the daily-cycle flake clause).
- **`mobile-minds` "long dialogs page GBA-style: E forward, ◀ back"** — fails at the ArrowLeft `prev()`
  page-back step. **Confirmed pre-existing:** `git stash` of the entire cycle-93 diff and re-run on clean
  HEAD reproduces the identical failure, and it fails in isolation (so it is *not* the parallel flake the
  cycle-92 verdict logged it as — the environment has shifted or the flake has hardened). It lives in the
  keeper-picker/dialog input path (`WorldScene.ts:448` `cursors.left → dialog.prev()`), untouched by either
  cycle-93 track. Out of scope for 341/417; flagged for a follow-up infra fix (see BACKLOG-430).

## Verdict input
Both tracks meet every acceptance criterion with their own green unit + e2e coverage; the full unit suite
is green and the only e2e failures are off-diff (one confirmed flake, one confirmed pre-existing). No CHARTER
breach (web-llm under `ai/` only; additive saves; deterministic floor + NPCBrain boundary intact).
Recommend **APPROVED / APPROVED**, with the pre-existing `mobile-minds` failure recorded as a known issue.
