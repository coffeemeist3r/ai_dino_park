# Cycle 102 — QA

**Build:** ✅ `npm run build` clean (tsc + vite).
**Unit tests:** ✅ `npm run test:unit` — **1153/1153** (128 files; +12 new: foodweb/lenses/need-seek).
**E2E tests:** ✅ `npx playwright test` — **330/330** on a full warm run (5.8m), including `cycle-102-book-foodweb` (1) and `cycle-102-need-seek` (3), plus the historically-flaky `mobile-minds` long-dialog spec (green). The parallel cold-first-boot `__ready` timeout seen on an initial isolated run is the documented Vite/Phaser boot flake (BACKLOG memory) — the full suite is green.

---

## Lore track — BACKLOG-443: Predator/prey in the book

| Criterion | Status | Evidence |
|---|---|---|
| Carnivore with catch memories shows `🦖 brought down N meal(s)`, N matching | PASS | e2e `cycle-102-book-foodweb`: Twitch → `🦖 brought down 2 meals`; unit `foodwebStanding` |
| Herbivore with escape memories shows `💨 slipped N hunt(s)`, N across all hunters | PASS | e2e: Rex → `💨 slipped 1 hunt`; unit `escapeTally` counts across hunters |
| Singular/plural correct | PASS | unit `foodwebStanding pluralises` (1 meal / 2 meals, 1 hunt / 2 hunts) |
| A dino with no food-web memory shows no line | PASS | e2e: Glade `foodweb` undefined; unit `bookLines omits when unset` |
| Carnivore reads catches only, herbivore escapes only (keyed on `dietOf`) | PASS | unit `foodwebStanding is null when the relevant tally is 0` (stray cross-diet memory → null) |
| No regression to the other book lines | PASS | `bookLines` render loop only appends; unit lens suite + full e2e green |

**Bugs found:** none. **Recommendation: APPROVE.**

---

## Structure track — BACKLOG-436: Need pulls the body

| Criterion | Status | Evidence |
|---|---|---|
| Pressing hunger → seek target at the hatch feeding zone (any zone) | PASS | e2e `cycle-102-need-seek`: `__needTarget('Rex')` non-null with hunger=1 |
| Pressing thirst in the grove → target the pond water block | PASS | e2e: after `__migrate('Rex','grove')`, `__needTarget` non-null; unit `grovePondTile` lands on a `water` tile |
| Pressing thirst outside the grove → no target (wanders) | PASS | e2e: bowl thirst → `__needTarget` null |
| No pressing need → no seek target | PASS | e2e `a sated dino has no seek target` → null |
| Seeking step reduces distance to target (clamped) | PASS | e2e: forced `__needStep` loop closes the gap to 0 (body pulled to the hatch) |
| Seek never overrides huddling/gathering/moping/ticcing/socializing | PASS | code: `seekTarget` guarded by `!huddling && !gathering && !moping && !socializing`, and the `else if (seeking)` branch sits below `socializing`; a pressing need makes `undisturbed` false so ticcing can't co-fire |
| Gated (a lean, not a lock): `NEED_PULL_CHANCE ∈ (0,1)` | PASS | unit `needSeeks` boundary + `NEED_PULL_CHANCE` in (0,1) |
| Deathless + additive: no dino removed, no new required save field, old saves load | PASS | no removals; `needs` map already persisted (371), no shape change; full e2e (incl. save/reload specs) green |
| Build + tests green | PASS | build clean; unit 1153; e2e 330 |

**Bugs found:** none. **Recommendation: APPROVE.**
