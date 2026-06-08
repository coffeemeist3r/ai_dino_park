# Cycle 35 — QA

**Item:** BACKLOG-142 [social] Player dialogue tones.

## Gate results
- **Build:** ✅ `npm --prefix game run build` (`tsc -b && vite build`) clean.
- **Unit tests:** ✅ **243 passed** / 29 files (was 231; +9 `tones.test.ts`, +3 `saveGame.test.ts`).
- **E2E tests:** ✅ **77/77 green when not racing.** Full parallel run reported 71 passed + 6
  failed; all 6 failures were the documented cold-boot parallel-load flake in
  `cycle-002-daynight` / `cycle-003-save` (timeout in `helpers.ts:22` waiting on `__ready`, the
  classic cycle-002/003 signature — see chronicle 2026-06-07 infra note + memory `e2e-boot-flake`).
  Re-run isolated (`--workers=1`) they pass **11/11**, including all four new
  `cycle-035-tones` specs. Not a regression from this cycle.
- **Boundary:** ✅ `@mlc-ai/web-llm` imported nowhere outside `game/src/ai/`; `tones.ts` imports
  only `ai/personality` (the `Personality` type).
- **Save:** ✅ additive — new `lastTone` map, **no `SAVE_VERSION` bump**; older saves default it
  to `{}` (unit-tested) and still load.

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | E/Z opens a 3-tone menu, not an immediate reply | **PASS** | `cycle-035-tones` "menu opens" — `__openToneMenu` text contains `[1] Warm`/`[2] Tease`/`[3] Honest`, `__toneMenuOpen()===true`, boot error-free. Menu uses the shared `openToneMenu` path that `handleInteract` calls. |
| 2 | 1/2/3 selects, closes menu, shows reply | **PASS** | `cycle-035-tones` "digit key selects" — real `Digit1` keypress → `__toneMenuOpen()===false`, `lastTone.Rex==='warm'`. Reply path unchanged from old greet flow. |
| 3 | `toneReaction` personality-fit, two opposite dinos | **PASS** | `tones.test.ts` — warm/social dino → Warm `loved`/`liked` (+δ); bold/prickly dino → Tease positive; timid/calm dino → Tease `clashed` (−δ); curious dino → Honest positive. |
| 4 | Selecting changes friendship by the tone delta | **PASS** | `cycle-035-tones` "shifts affinity" — `after-before ∈ {−2,1,3,5}` (the four toneReaction outcomes), seeded above the clamp floor so a negative delta is observable. |
| 5 | Selecting files a `the keeper …` memory | **PASS** | specs 2 & 3 — last `__memory` entry equals the tone's memory line (`the keeper greeted me warmly` / `… teased me`). |
| 6 | Last tone persisted + round-trips; old saves default `{}` | **PASS** | `saveGame.test.ts` — round-trip, older-save `{}` default, malformed→`null`; `cycle-035-tones` "persists" — `JSON.parse(__exportSave()).lastTone.Glade==='honest'`. |
| 7 | Next interaction surfaces the remembered trace | **PASS** | `cycle-035-tones` "persists" — reopened menu header contains `Last time you were honest with them.` |
| 8 | BACKLOG-125 repair seam intact | **PASS** | `recordTone` branches on `pendingRepair` *before* the tone delta (→ `repairGain` + 😊 + clear); `recordGreet`/`__greet` untouched; `cycle-032-repair.spec.ts` green in the full run. |
| 9 | Build clean; boundary intact | **PASS** | see Gate results. |

## Bugs found
None. The reply text is intentionally *not* tone-coloured this cycle (BACKLOG-148, out of scope).

## Note for the Validator
Browser-preview screenshot was attempted but the preview tab's RAF loop was throttled
(background tab) so Phaser never stepped `WorldScene.create()` (only the pre-scene `__buildTime`
global was present) — an environment artifact, not a code defect: the Playwright harness boots
the identical code and drives the real tone-menu UI (menu text render + live `Digit1` keypress
selection + persistence) green. Authoritative proof is the e2e suite, not the manual preview.

## Recommendation
**APPROVE.** All 9 acceptance criteria PASS; build + 243 unit green; e2e green isolated with
only the known cold-boot flake in the parallel run; CHARTER boundaries and additive-save rule
respected; no regressions in the diff.
