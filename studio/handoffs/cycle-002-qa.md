# Cycle 2 — QA

Verifying BACKLOG-008 (day/night palette) against the cycle-002 design acceptance criteria.

- **Build:** ✅ exit 0 (`npm run build` — only the pre-existing Phaser chunk-size warning, not new)
- **Unit tests:** ✅ 14/14 passed (2 brain + 6 clock + 6 dayNight)
- **E2E tests:** ✅ 5/5 passed on the **default** `playwright.config.ts` — the `.qa-override` hack from cycle 1 was NOT needed; vite `host: true` (BACKLOG-046) resolved the IPv6/127.0.0.1 mismatch (BUG-001 fixed)

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Noon alpha ≤ 0.05 | ✅ PASS | unit `tintFor › noon is effectively clear`; e2e `__forceHour(12)` → alpha ≤ 0.05 |
| 2 | Midnight alpha ≥ 0.45, blue > red | ✅ PASS | unit `tintFor › midnight is a dark blue tint`; e2e `__forceHour(0)` → alpha ≥ 0.45 |
| 3 | Dawn 07:00 & dusk 19:00 warm (red > blue), 0.1 ≤ alpha ≤ 0.45 | ✅ PASS | unit `dawn (07:00) is warm` + `dusk (19:00) is warm` |
| 4 | Continuous — `|Δalpha| ≤ 0.05` between adjacent minutes incl. midnight wrap | ✅ PASS | unit `is continuous` — asserts all 1440 adjacent-minute pairs |
| 5 | Overlay above grass, below HUD; HUD readable at midnight | ✅ PASS | overlay depth 5 vs grass depth 0 / HUD depth 10 (code review, `WorldScene.setupDayNight`); HUD text white + drop shadow stays legible over a 0.55-alpha overlay |
| 6 | `__forceHour(0)` ≥ 0.45 then `__forceHour(12)` ≤ 0.05 | ✅ PASS | e2e `forcing midnight darkens and noon clears the overlay` |
| 7 | Z-key dialog with Rex still works (no regression) | ✅ PASS | overlay created without `setInteractive()` so it cannot intercept input; `smoke.spec.ts` keyboard test green; dialog wiring in `handleInteract` untouched in diff |
| 8 | Build clean; unit + e2e green | ✅ PASS | see header |

## Bugs found
None. Diff is tight — one new pure module, one `setupDayNight()` block in WorldScene, two test files. No changes to the clock, dialog, or movement code. The clock's `onTick` is reused (no second timer). NPCBrain boundary untouched.

## Recommendation
**APPROVE.**
