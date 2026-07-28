# Cycle 114 — QA

**Build:** ✅ `npm --prefix game run build` clean (type-check passes).
**Unit tests:** ✅ `npm run test:unit` — **1353 passed / 1353** (150 files), +10 this cycle (5 migrating-warmth, 5 spoilFoodOverDays).
**E2E tests:** ✅ **391 passed / 392**. The lone red — `cycle-076-news-pull.spec.ts` — is the catalogued
BACKLOG-456 parallel-load flake (the homesick `pickMigrant` branch picks with `Math.random()`, so the
exact-identity `__maybeMigrate() === 'Mossback'` assert flips under load). It is **off this cycle's diff**
(my changes touch seasons/spoilage/the socialize roll, nothing in the migration/news path) and **passes
isolated on re-run** (`1 passed`). Not a regression.

---

## Lore track — BACKLOG-178: Migrating warmth

### Acceptance criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `seasonSocialBias` winter > 1, summer < 1, spring/fall = 1 | PASS | `migrating-warmth.test.ts` "tightens in winter, loosens in summer, neutral spring/fall" |
| 2 | `seasonalSocializeChance(base, spring)` = base (clamped) | PASS | "leaves the neutral seasons byte-identical to the base" (spring + fall) |
| 3 | `seasonalSocializeChance(0.45, winter) > (0.45, summer)` | PASS | "winter clusters more than summer for the same base" |
| 4 | never outside [0.05, 0.95] | PASS | "never escapes the [0.05, 0.95] band" (0.9×winter caps at 0.95; 0.06×summer floors at 0.05; full sweep) |
| 5 | E2E: `__socialBias` > 1 winter, < 1 summer, = 1 spring/fall | PASS | `cycle-114-migrating-warmth.spec.ts` (green) |
| 6 | Build + full suite green, no huddle/season regression | PASS | build clean; `cycle-018/040/041/042/113` specs all green in the full run |

**Bugs found:** none. The socialize roll stays clamped; spring is exactly 1.0, so the default-season behaviour
is byte-identical (the huddle/season specs are unregressed).

**Recommendation:** **APPROVE**

---

## Structure track — BACKLOG-462: Spoilage while you're away

### Acceptance criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `spoilFoodOverDays(pile, 0/-n)` returns input unchanged (same ref) | PASS | `spoilage.test.ts` "a sub-day span spoils nothing — same ref" |
| 2 | 3 days over cap bleeds to `cap-margin-1` and no lower | PASS | "bleeds a hoard the elapsed days, settling at the floor" (3 and 7 days both floor at 4) |
| 3 | pure (no mutation), matches hand-iterated `spoilFood` | PASS | "is pure — never mutates" + "matches spoilFood iterated by hand" |
| 4 | E2E: seed at cap, `__catchUp` N days → pile bled below start | PASS | `cycle-114-away-spoilage.spec.ts` "bleeds toward its floor" (6 → 4; pre-462 left it at 6) |
| 5 | E2E: digest carries a 🥀 spoiled line naming the zone | PASS | same test asserts both the returned `digest` and `__awayDigest()` |
| 6 | E2E: sub-day catch-up leaves the hoard untouched, no 🥀 | PASS | "a sub-day absence leaves the hoard untouched and adds no spoilage line" |
| 7 | Build + full suite green; live spoilage/away unregressed | PASS | `cycle-111-spoilage` + `cycle-029-away` + `cycle-113-lean-season` all green in the full run |

**Bugs found:** none. The season-aware margin carries into the away path (winter margin bleeds deeper — unit
pinned); the live `checkSpoilage` path and its once-per-day guard are untouched; `lastSpoilDay` is re-armed so
the first live hour after a restore doesn't double-decay.

**Recommendation:** **APPROVE**
