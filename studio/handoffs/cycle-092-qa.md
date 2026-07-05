# Cycle 92 — QA

**Build:** ✅ clean (`npm --prefix game run build`).
**Unit tests:** ✅ 1005 passed (111 files) — `npm run test:unit`.
**E2E tests:** ✅ 297 passed on the full parallel run. Two specs dropped in that run —
`cycle-028-realtime.spec.ts:25` (scale-knob toggle) and `mobile-minds.spec.ts:79` (long-dialog
paging) — both **7/7 green when re-run isolated**, and neither is touched by this cycle's diff
(save-migration + daily-plan). Catalogued as the known parallel-load / cold-boot flake class,
not a regression. All four new `cycle-092-plan.spec.ts` tests passed in the full run.

One authoring bug in the new e2e was caught and fixed during QA (not a product bug): the
day-phase test read `__plan` at day 1 while forcing the clock to day 2, so it compared two
*different days'* plans; the plan re-rolls per day by design. Fixed to read the plan for the
same held day — the production path (`ensureIntent` derives from `ensurePlan(d, currentDay)`)
was correct throughout.

## Lore track — BACKLOG-012 (NPC daily plan)

| Criterion | Status | Evidence |
|---|---|---|
| `proceduralPlan` deterministic; different day/name changes it | PASS | `cycle-092-plan.test.ts` "is deterministic" / "a different day or name changes" |
| Plan covers all four `DayPhase` with a closed-set kind | PASS | unit "covers all four day-phases"; e2e "every dino carries a full four-phase plan" |
| Traits lean the per-phase pick | PASS | unit "traits lean the pick" (max-social > loner over 200 days) |
| `activeIntent(plan,phase,day)` → `{kind:plan[phase], note:INTENT_NOTES[..], until:day}` | PASS | unit "activeIntent reads the current phase" |
| In-game the active intent tracks the forced day-phase | PASS | e2e "the active intent … tracks the current day-phase" (all 4 phases: active === plan[phase]) |
| Book shows a `plans:` shape line, dawn→night | PASS | unit "planShape"; e2e "collection book shows the day's shape" (`plans: ` + ` → `) |
| Deterministic floor headless, zero console errors | PASS | e2e "every dino carries a full four-phase plan with no model present" asserts `errors == []` |
| Build clean; web-llm boundary ai/-only; no save change | PASS | build ✅; `grep @mlc-ai/web-llm` → ai/ only; no `SaveData`/`SAVE_VERSION` change from this track |
| The lean is not flat across the day | PASS | e2e "the lean is not flat across the day" |

**Bugs found:** none beyond the test-authoring fix above.
**Recommendation:** **APPROVE.**

## Structure track — BACKLOG-426 (root the save rail at v0)

| Criterion | Status | Evidence |
|---|---|---|
| `migrate({no version})` → non-null, `version===SAVE_VERSION` | PASS | `cycle-092-save-v0.test.ts` "reads a missing version as v0" |
| `migrate({version:0})` handled identically | PASS | "handles an explicit v0 identically" |
| Versionless payload with a modern field (personas) round-trips | PASS | "a versionless payload with a personas cache survives … intact" |
| Newer / non-integer / negative still rejected | PASS | "still rejects a newer, negative, or non-integer version"; `null` version rejected |
| v0→v1 step is a pure no-op on shape (adds only `version`) | PASS | "the v0→v1 step is a pure no-op on shape"; "never mutates its input" |
| Build clean; existing save tests still green; no `SaveData`/`SAVE_VERSION` change | PASS | build ✅; `cycle-061-save-version` + `saveGame` specs green (3 stale assertions updated to the reversed contract) |

**Bugs found:** none. The three older assertions that pinned the *now-overturned* "versionless/v0
rejected" contract were updated to the rooted-at-v0 behaviour (an intended spec change per 426,
not a silenced failure).
**Recommendation:** **APPROVE.**
