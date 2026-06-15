# Cycle 52 — QA

**Item:** BACKLOG-234 — The bowl self-corrects

**Build:** ✅ `npm run build` clean (type-check passes).
**Unit tests:** ✅ `npm run test:unit` — 471 passed (46 files, +9: self-correct in `cold.test.ts`, `forget` in `memory.test.ts`).
**E2E tests:** ✅ `npx playwright test` — 172 passed in a fresh full run (1.7m), no flake. The first full run had one red (`cycle-044-sound` "a greeted dino answers in its own voice", a chirp-pitch assertion) — re-ran isolated **5/5 green**, then a fresh full run **172/172 green**: the catalogued parallel-load/audio-timing flake, not a regression (the change touches `converse`, not the greet path). Both new `cycle-052-self-correct` specs green; the `cycle-050-sympathy-visit` pin (3/3) green — the sympathy branch is byte-unchanged for non-recovered sufferers.

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `recovered(store,name)` true iff a shareable memory contains `WARM_NEWS_TOKEN` | ✅ PASS | unit: "recovered is true only for a dino carrying a first-hand warm memory" (warm→true, cold→false, empty→false) |
| 2 | `reliefLine` has both names + 😌; `reliefMemory` first-hand + distinct | ✅ PASS | unit: "the relief line carries both names and 😌; the relief memory is first-hand and distinct" (vs cameToFind/cold/warm/neglect) |
| 3 | `selfCorrect` fires on carrier+recovered; direction-agnostic; null on not-recovered / neither / `a===b`; `dropped === coldWordLine(sufferer)` | ✅ PASS | unit: "fires when the carrier holds the cold word AND the sufferer recovered", "direction-agnostic", "does NOT fire while the sufferer has not recovered", "returns null when neither… and a===b", "the dropped string is exactly the planted cold word" |
| 4 | `forget` removes exactly the entry, leaves siblings/other dinos, no mutation, no-op on unknown | ✅ PASS | unit (memory.test.ts): "forget removes exactly the named entry…"; "forget is a no-op for an unknown dino or a missing entry" |
| 5 | Recovered sufferer at the seam: cold word dropped, relief memory filed, 😌 line+log, sympathy visit suppressed (bond unchanged) | ✅ PASS | e2e: "a carrier meeting a recovered sufferer drops the worry with relief — and is not a pity visit" (drop + relief memory + 😌 log + `bondAfter === bondBefore`) |
| 6 | Non-recovered sufferer byte-unchanged: sympathy visit fires + bumps bond | ✅ PASS | e2e control: "a carrier meeting a still-cold sufferer pities it — the sympathy visit fires, no drop" (🫂 log, `bondAfter > bondBefore`, cold word still present); cycle-050 pin green |
| 7 | After a self-correction the corrector no longer carries the cold word | ✅ PASS | e2e: `memory[carrier]` no longer contains `coldWord`; `forget` strict-equality unit pin |
| 8 | No `SAVE_VERSION` change; boundary clean; build+unit+e2e green | ✅ PASS | `SAVE_VERSION = 1` unchanged; no `@mlc-ai/web-llm` outside `game/src/ai/`; three suites green |
| 9 | E2E recovered-drop + non-recovered control | ✅ PASS | both `cycle-052-self-correct` specs green |

**9/9 PASS.**

## Bugs found

None. The sympathy block moved verbatim into the `else` branch, so for a non-recovered sufferer the seam is byte-identical — proven by the cycle-050 pin staying green. The precedence (selfCorrect before sympathyVisit, on the same pre-meeting snapshot) is what makes a recovered sufferer get the all-clear instead of a stale pity visit, pinned by the recovered-vs-control e2e pair.

## Recommendation

**APPROVE.** All 9 acceptance criteria pass; build + 471 unit + 172 e2e green in one fresh full run with no flake; the one transient red was the catalogued audio-timing flake (green isolated + green on the fresh run). No save change, no new dependency, boundary intact, no regressions in the pinned specs.

State → phase: validator-pending.
