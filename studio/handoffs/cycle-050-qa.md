# Cycle 50 — QA

**Item:** BACKLOG-217 — Secondhand sympathy spurs a visit.

- **Build:** ✅ `npm --prefix game run build` clean (type-check passes).
- **Unit tests:** ✅ 453 passed (46 files; +7 sympathy-visit in `cold.test.ts`).
- **E2E tests:** ✅ **168/168 passed** in one fresh full run (`npx playwright test`, ~1.6m) — no flake, including the 3 new `cycle-050-sympathy-visit` specs and both pin specs (`cycle-020-gossip`, `cycle-049-cold-word`) green.

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Setup → `__sympathyVisit('Sunny','Mossback')` non-null `{Sunny,Mossback}`, `__memory().Mossback` includes came-to-find line | ✅ PASS | e2e "a dino that heard about a cold night comes to find the sufferer"; unit "the carrier is the visitor and the named one is the sufferer" |
| 2 | Direction-agnostic: args swapped → same visitor Sunny / sufferer Mossback | ✅ PASS | e2e "the carrier is the visitor regardless of who the meeting names first"; unit "is direction-agnostic" |
| 3 | Sub-floor: bond 0 → 2 (`=== COMFORT_BOND`), no floor gate | ✅ PASS | e2e asserts `__bond` 0 before, 2 after; unit "the bump magnitude is pinned to the 130 console bond" (`SYMPATHY_BOND === COMFORT_BOND`) |
| 4 | No word → `null`, no memory, no bond change | ✅ PASS | e2e "no carried word → no visit, no bond change"; unit "returns null when neither carries…" |
| 5 | `heardColdWordAbout` exact (true for carried sufferer, false for other / empty) | ✅ PASS | unit "heardColdWordAbout is exact" |
| 6 | Came-to-find memory distinct (≠ comfort/cold/warm/neglect) + shareable (no RUMOR_MARK) | ✅ PASS | unit "the came-to-find memory is first-hand and distinct from every neighbouring memory" |
| 7 | Bump reuses `COMFORT_BOND` | ✅ PASS | unit `SYMPATHY_BOND === COMFORT_BOND`; e2e bond delta = 2 |
| 8 | Live meeting logs 🫂 when one carries the other's word; fresh word this meeting does not self-trigger (pre-snapshot rule) | ✅ PASS | code: `converse` reads `snapshot` captured before any plant; gossip/log untouched; reviewed in WorldScene diff. (Headless hook drives the detector directly; converse seam reads the snapshot so a same-meeting plant is excluded by construction.) |
| 9 | Build clean; full vitest+playwright green; no SAVE_VERSION bump; no web-llm outside `src/ai/` | ✅ PASS | build ✅; 453 unit / 168 e2e ✅; `SAVE_VERSION = 1` unchanged; boundary grep "none (clean)" |

## Bugs found

None. The gossip plant and its 🥶/🗣️ log lines are byte-unchanged (cycle-020 + cycle-049 specs green), confirming the additive sympathy step did not perturb the existing converse behavior.

## Notes

- **Deferred by design (not a bug):** while the carrier still holds the cold-word rumor, a *repeated* meeting re-fires the bump/memory — the once-per-sorrow freshness gate is BACKLOG-226, explicitly out of scope and flagged with a `ponytail:` comment in `cold.ts`.

## Recommendation

**APPROVE.** All 9 acceptance criteria pass; build + full suite green with no flake this run; boundary and save-format intact; no regressions.
