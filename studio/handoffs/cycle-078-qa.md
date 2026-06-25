# Cycle 78 — QA

**Build:** `npm run build` clean (tsc + vite, built in 9.4s).
**Unit:** `npx vitest run` → **796 passed / 796** (82 files), +9 over cycle 77 (5 grove-pull grading +
4 zone-bias).
**E2e:** `npx --yes kill-port 5173` then `npx playwright test` → **244 passed / 244** on a clean full
run (the +2 new cycle-078 specs included). The first full run showed a lone `cycle-040-seasons` restore
failure (`summer` vs `spring`); it passes **4/4 isolated** and the clean re-run was **244/244** — the
documented rotating parallel-load flake, and untouched by this diff (the change is in
`curiosity.ts`/`resource.ts`, nothing seasonal/clock/save). Not a regression.
**Boundary:** `@mlc-ai/web-llm` imported only under `game/src/ai/` (grep clean); `curiosity.ts` and
`resource.ts` import no backend.

---

## Lore track — BACKLOG-355 Drew them across

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Strong tier: fresh telling → `grovePull === 2` | **PASS** | curiosity.test.ts "a freshly-told dino … has the strong pull, 2" |
| 2 | Weak tier: aged telling → `grovePull === 1` | **PASS** | "an ambient dino (telling pushed back) … weak pull, 1" + the `GROVE_TELL_RECENT` boundary case |
| 3 | No pull: no token / visited / grove-home → 0; `groveCurious === pull>0` | **PASS** | "no grove news → 0; visited → 0; grove-home → 0" + "groveCurious is exactly pull > 0" (the 4 existing 345 cases still green) |
| 4 | Pick prefers fresh (2) > ambient (1) > none | **PASS** | e2e cycle-078-grove-pull: Sunny (freshly told) chosen over Mossback (aged to ambient) by `__maybeMigrate` |
| 5 | `groveword.ts` untouched — grove news stays 1 hop | **PASS** | `git diff` shows no change to groveword.ts; cycle-075 groveword.test.ts ("a heard grove rumor is not re-shared") green |
| 6 | No save change; web-llm not in curiosity.ts | **PASS** | no save-field touched; grep clean |

**6/6 PASS.**

## Structure track — BACKLOG-348 Zone resource bias

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Grove leans branch (~75%) | **PASS** | cycle-062-resource.test.ts "the grove leans branch" (rand 0.1/0.5 → branch) |
| 2 | Bowl leans stone (symmetric) | **PASS** | "the bowl leans stone" (rand 0.1/0.5 → stone) |
| 3 | Off-kind still appears past BIAS_WEIGHT | **PASS** | "a lean, not a lock" (rand 0.9 → off-kind; 0.5 < BIAS_WEIGHT < 1) |
| 4 | Back-compat: no/unknown zone stays 50/50 | **PASS** | "no zone (or an unknown zone) keeps the uniform 50/50"; the 146/314/328/329 resource specs unchanged + green |
| 5 | Wired: `maybeSpawnResource` passes the spawning zone | **PASS** | `pickKind(Math.random, zone)` at the spawn callsite; e2e cycle-078-zone-bias proves the production bundle biases grove→branch / bowl→stone via `__biasKind` |
| 6 | No save change; web-llm not in resource.ts | **PASS** | the kind is a transient per-zone spawn property (already round-tripped); grep clean |

**6/6 PASS.**

---

**Result:** both tracks clean — 12/12 acceptance criteria pass, build green, 796 unit / 244 e2e green,
no regressions, boundary intact. Recommend **APPROVE / APPROVE**.
