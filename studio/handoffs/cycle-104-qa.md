# Cycle 104 — QA

**Build:** ✅ `npm --prefix game run build` clean (built in 8.96s, type-check passes).
**Unit tests:** ✅ **1187/1187** across 132 files (was 1164 at cycle 103 — +23: 9 wake, 14 stores-feed).
**E2E tests:** ✅ **341 passed** per run, across two full runs. One spec failed in each run — a *different*
one each time, both green isolated. See **Flake analysis** below; not a regression.
**Boundary:** ✅ `@mlc-ai/web-llm` imported only under `game/src/ai/` (`webllm.worker.ts`, `webllmBrain.ts`).
**Saves:** ✅ no save change at all this cycle (`foodPileByZone` already additive from 446;
`lastWokeHungry` transient by design).

## Flake analysis (read before judging the e2e column)

| Run | Failed | Isolated re-run |
|---|---|---|
| Full run 1 | `cycle-010-brain-status.spec.ts` — `boot()` 30s timeout | ✅ 2/2 pass (997ms, 1.7s) |
| Full run 2 (fresh) | `cycle-031-jealous.spec.ts` — `boot()` 30s timeout | ✅ 2/2 pass (934ms, 983ms) |

The failure **moved between runs** (cycle-010 passed clean in run 2), both failures are `boot()`
`__ready`/canvas waits timing out under parallel cold load, and both specs pass in ~1s against a 30s
ceiling when run alone. That is the catalogued cold-boot / parallel-load flake (chronicle: `e2e-boot-flake`;
same shape as cycle 103's two carry flakes), not this cycle's diff: **neither spec's code path is touched
by these 11 files** — brain-status reads `ai/brain` status, jealous reads the homecoming path; the diff is
needs/foodstore/wake/dawn. Per the CHARTER quality bar: noted, not a regression.

The two new specs were also run serially on their own: **9/9 green**.

---

## Lore track — BACKLOG-376 — Woke hungry

### Acceptance criteria

| Criterion | Status | Evidence |
|---|---|---|
| Live crossing into hour 7 with a dino ≥ 0.6 hunger → 🍖 flash + "woke hungry" memory | **PASS** | e2e `cycle-104-wake-hungry.spec.ts:33` — `__wokeHungry()` contains Rex; `__memory().Rex` contains the line. The 🍖 flash rides `flashFeed(d, NEED_GLYPH.hunger)`, the same call every other feed beat uses. |
| Exactly one `🍖 <name> woke hungry…` ticker line per hungry dino | **PASS** | same spec — `hungryLines(events)` has length 1, contains `Rex` + `🍖`. |
| A dino at hunger 0.5 gets no line and no memory | **PASS** | same spec — Twitch seeded 0.1: absent from `__wokeHungry()`, no memory. Unit pins the exact boundary: 0.599 false / 0.6 true (`cycle-104-wake.test.ts`). |
| Line is temperament-shaded — different agreeableness → different text | **PASS** | unit `cycle-104-wake.test.ts` — prickly ≠ warm, and high-energy ≠ placid (two shading axes, not one). |
| Fires once per in-game day; next day re-arms | **PASS** | e2e `:73` — 1 line after day 5 dawn, still 1 after +12h, 2 after crossing day 6's dawn. |
| A restore-style `__setClock` to hour 7 fires nothing | **PASS** | e2e `:89` — `__wokeHungry()` empty, no lines. Inherits the chorus's live-only seam. |
| **No dawn-chorus regression (192)** | **PASS** | e2e `:61` — `__dawnCount` still 1, 🌅 still logs, alongside the wake beat. Full suite's `cycle-045-chorus.spec.ts` green in both runs. |
| `__wokeHungry()` dev hook | **PASS** | used throughout the spec. |
| Unit: threshold boundary, absent dino, deterministic + differing lines | **PASS** | 9 tests, incl. the `pressingNeed` trap (hunger 0.7 / thirst 0.9 → still wakes hungry). |

### Bugs found

None open. One was found and fixed during the Coder fire (the `the The Grove's stores` article bug — that
was the structure track's line, and it's now pinned by a unit test).

**Verified beyond the criteria:** the beat is synchronous at the chorus tail, so `__wokeHungry()` is readable
the instant the crossing returns — no race with the staggered `delayedCall` chirps. `lastWokeHungry` resets
at the top of each fire, so yesterday's hungry dinos don't leak into today's read.

### Recommendation: **APPROVE**

---

## Structure track — BACKLOG-444 — A carrier feeds the hungry

### Acceptance criteria

| Criterion | Status | Evidence |
|---|---|---|
| Starving dino + stocked home zone + no drop → hunger 0, pile −1 | **PASS** | e2e `cycle-104-stores-feed.spec.ts:27` — hunger 0.95 → 0; `{berries:2}` → `{berries:1}`. |
| **The band survives: a dino at 0.7 with a stocked pile is NOT fed** | **PASS** | e2e `:48` — hunger *climbed* past 0.7 (not reset), pile untouched at `{berries:2}`, no line. Unit adds a structural guard: `STARVING > NEED_THRESHOLD`. **This is the criterion that keeps 376 alive; it is genuinely exercised, not asserted trivially.** |
| Starving dino + empty pile → not fed | **PASS** | e2e `:61` — hunger still > 0.9, no line. |
| Keeper drop in play → no spend; once gone, next tick feeds | **PASS** | e2e `:73` — pile untouched while food is down; after `__eat`, the next `__checkNeeds` feeds and decrements. |
| Spend prefers the dino's favorite | **PASS** | unit — `pickFoodToSpend({berries:1, roots:5}, 'berries')` → `berries` (favorite wins over a 5× bigger stock). |
| One ticker line per spend, naming zone + dino; memory filed | **PASS** | e2e `:27` — exactly 1 line, contains `Rex` + `Pocket Cretaceous` (the bowl's display name). |
| Spend takes from the **home** zone, not the viewed zone | **PASS** | e2e `:95` — keeper `__setZone('grove')`, Rex resident in bowl: bowl's pile decrements, grove's `{greens:3}` untouched. |
| Old save without `foodPileByZone` loads clean, never spends | **PASS** | No save change this cycle; `saveGame`'s loader already coerces absent → `{}` (WorldScene ~4676, shipped 446). An empty pile → `pickFoodToSpend` → `null` → `continue`, which is exactly the "empty pantry feeds no one" spec at `:61`. Full suite's save specs green. |
| Unit: `takeFood`, `pickFoodToSpend`, `isStarving` boundary | **PASS** | 14 tests — incl. floor-at-0, no-mutation, FOODS-order tiebreak determinism, empty → null. |

### Bugs found

None open.

**One real bug found and fixed mid-fire** (logged here because the Validator should see it): the ticker
originally read `the ${zoneName}'s stores` → **"the The Grove's stores fed Rex"**, since two of three `ZONES`
display names carry their own article. Fixed by dropping the template's article; pinned by a unit test
asserting no `the The`. Caught by the e2e, which is the system working.

**Noted, not filed:** the same latent awkwardness exists in the cycle-358 barter line
(`WorldScene` ~2844: `at the ${zoneById(zoneB).name} edge` → "at the The Grove edge"). Pre-existing, one
ticker string, outside this diff — flagging for whoever next touches that line rather than growing this cycle.

### Recommendation: **APPROVE**
