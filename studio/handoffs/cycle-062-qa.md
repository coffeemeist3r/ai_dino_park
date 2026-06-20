# Cycle 62 — QA

**Build:** ✅ clean (vite, 10s). **Unit tests:** ✅ 588 passed (58 files, +12). **E2E tests:** ✅ 196 passed
(196/196, full run, no flake on the repeat-each=2 re-run of the touched specs).

A regression surfaced under the full suite and was fixed forward in a coder-fixup (see below) before
this report — the green numbers above are post-fix.

## Lore track — BACKLOG-278: Earned the nickname

| Criterion | Status | Evidence |
|---|---|---|
| `nicknameOf` → Aki/Vix/Lux for the three keepers | PASS | `cycle-062-nickname.test.ts` |
| `nicknameOf` falls back to designation when unquoted | PASS | same (synthetic `NOMAD-7` keeper) |
| `keeperAddress` nickname at ≥ NICKNAME_MIN (10), designation below | PASS | same (10→Aki/Vix; 8,9→AETHER-1) |
| 10-heart dino greeted → fond line has the nickname, not the designation | PASS | `cycle-062-nickname.spec.ts` (Twitch@10 → "There you are, Aki!", no "AETHER-1") |
| 8-heart dino greeted → fond line has the designation (cycle-61 preserved) | PASS | `cycle-062-nickname.spec.ts` 2nd test + `cycle-061-keeper-name.spec.ts` (pinned to 8) |
| `ai/` imports nothing from `keeper/` (boundary) | PASS | address computed in WorldScene, passed as `keeperName`; `ai/brain.ts` unchanged signature |
| Build + unit + e2e green; no save/world change this track | PASS | keepers.ts + 2 greet-site swaps only |

**Bugs found:** none on this track. **Recommendation:** APPROVE.

## Structure track — BACKLOG-146: Resource gathering spine

| Criterion | Status | Evidence |
|---|---|---|
| `noticeResource` fetch in range + curious; ignore out of range / incurious | PASS | `cycle-062-resource.test.ts` |
| `resourceLanding` always in-bounds, off the rim | PASS | same (200 seeded calls in [1,18]×[1,13]) |
| `rollResource`/`pickKind` deterministic for seeded rand | PASS | same |
| Spawn on a dino + one step → tally +1, resource cleared | PASS | `cycle-062-resource.spec.ts` (gather total 0→1, `__resource()` null) |
| Only one resource at a time | PASS | `cycle-062-resource.spec.ts` 2nd test (2nd spawn replaces) |
| Gather tally persists (save round-trip) | PASS | `cycle-062-resource.test.ts` (gathered round-trips; absent → {}) |
| Old save without `gathered` loads → {} | PASS | same + `saveGame.test.ts`/`cycle-061-save-version.test.ts` baselines updated |
| Build + unit + e2e green; feeding still works (food > resource) | PASS | full e2e green incl. feeding specs; resource ranks below food + huddle |

**Bugs found (fixed forward this fire):**
- **Regression — resource overrode the night huddle.** The fetch step originally sat above the huddle
  branch in `forceStep`, so a random night resource spawn pulled a bonded dino out of the den —
  `cycle-042-winter-huddle` failed. Fixed: the fetch now ranks **below** food and the huddle (sleep beats
  gathering), above idle drift. Re-ran winter-huddle + the cycle-062 specs ×2: stable.

**Recommendation:** APPROVE.

## Notes
- One in-fire test fixup beyond the coder's own: `cycle-060-fond-greeting` drove hearts to the cap, which
  is now the nickname rung — pinned to 8 hearts (designation), matching the cycle-061 fix.
- The coder's lighter pre-commit checks (build + unit + a spot-check of the new specs) passed; the full
  e2e suite (this stage) is what caught the huddle-priority regression — the safety net working as intended.
