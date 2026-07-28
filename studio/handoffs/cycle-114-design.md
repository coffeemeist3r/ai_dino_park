# Cycle 114 — Design

Two tracks this cycle, no file overlap: the lore track touches the step-loop's daytime **socialize** roll and
the `seasons` module; the structure track touches **away/spoilage** and the restore path. The Coder can build
them in either order.

---

## Lore track — BACKLOG-178: Migrating warmth

### Item
BACKLOG-178 [emergent] — winter raises the cluster-drift bias (the cast seeks company in the cold, the den
fills earlier) while summer lowers it (they spread out and laze), so the bowl's daytime social density breathes
with the year.

### Why this cycle
Milestone 8 is about the calendar gaining consequence. 173 gave the year a *voice*, 461 a grip on the *stores*;
178 gives it a grip on **behaviour you can watch** — the bowl visibly tighter in winter, looser in summer.
The night den already tightens with the season (171: winter lowers the huddle bar and opens the window at
dusk). 178 is that mechanic's **daytime twin**: the ambient "drift to the cluster" roll (the `socializing`
branch of the step loop) leans up in winter and down in summer. All the foundation is present — the season
derives from the clock, the socialize roll already exists — so this is one clean, pure seasonal modifier, the
social mirror of 461's `seasonGrip`.

### What ships
- A pure per-season **social bias** multiplier layered onto the existing socialize chance: **winter > 1**
  (more clustering), **summer < 1** (more spreading), **spring / fall = 1** (the year's hinges, unchanged).
- Threaded into the step loop's `socializing` roll so that, across a run, dinos drift together more often in
  winter and less in summer — the same roll, the year colouring its odds. The result is **clamped** to the
  same `[0.05, 0.95]` band the intent roll already uses, so no season can ever peg the roll to always/never.
- A dev hook `__socialBias()` returning the current season's multiplier so QA can read the year's grip on the
  social roll without a flaky probabilistic count (mirrors how `__foodCap` exposes 461's grip).
- Spring (day 1, a fresh clock) is **byte-identical to every build since the socialize roll existed** — the
  spring multiplier is exactly 1.0, so nothing changes for the default season (same discipline as 461/171).

### Acceptance criteria
- [ ] `seasonSocialBias('winter') > 1` and `seasonSocialBias('summer') < 1`; `spring` and `fall` are exactly `1`.
- [ ] `seasonalSocializeChance(base, 'spring')` equals `base` (clamped) for any in-range base — spring unchanged.
- [ ] `seasonalSocializeChance(0.45, 'winter') > seasonalSocializeChance(0.45, 'summer')` — winter clusters more than summer.
- [ ] `seasonalSocializeChance` never returns outside `[0.05, 0.95]` (a high base × winter can't exceed 0.95; a low base × summer can't drop below 0.05).
- [ ] E2E: `__socialBias()` reads > 1 after `__setClock` to a winter day, < 1 in summer, and exactly 1 in spring.
- [ ] Build clean, full unit + e2e suite green, no regression in the existing huddle/season specs.

### Out of scope
- The **night den** already carries its own seasonal window/bar (171) — 178 does **not** touch huddle.ts.
- No new persisted state (the season is derived from the clock; nothing new lands in the save).
- No change to *who* migrates between zones — 178 is about intra-zone daytime clustering density, not the
  cross-zone migration decision (that's the scarcity/homesick systems).
- No LLM path — this is a deterministic weight nudge; the `NPCBrain` boundary is untouched.

### Constraints
- Apply the bias **on top of** `socializeChanceFor(intent)` (the 393 intent lean), not instead of it — the two
  compose. Keep the clamp so the roll can never freeze.
- `season` is already in scope at the socialize roll in `stepWorld` (`const season = this.currentSeason()`).
- No file overlap with the structure track.

---

## Structure track — BACKLOG-462: Spoilage while you're away

### Item
BACKLOG-462 [core] — fold spoilage into the offline catch-up so a hoard left through a long absence bleeds the
elapsed in-game days on the same capped, self-limiting decay a watched pile does, surfaced in the "while you
were away" digest.

### Why this cycle
455 gave the food economy a *cost* (a hoard at/near cap spoils one unit per in-game day) — but it rides an
`onHour` day hook, and `onHour` **never fires on a restore/away `clock.set`** (by design, so a restore doesn't
double-fire beats). The away catch-up (106) fast-forwards bonds and the clock but not the stores, so a glut a
keeper banks and walks away from survives a week-long absence *untouched* while everything else moved on. 462
closes that: when the clock jumps a gap, apply the elapsed whole in-game days of the same `spoilFood` decay per
zone and name it in the digest. Deterministic (day-count in, no rolls), never below the safe floor — the honest
completion of 455's live-only spine and Milestone 8's final structure arc.

### What ships
- A pure `spoilFoodOverDays(pile, days, cap, margin)` in `spoilage.ts`: applies up to `days` passes of the
  existing `spoilFood` (each pass is one in-game day's decay), self-limiting so it settles at the floor no
  matter how large `days` is (an early-out when a pass no-ops keeps it cheap and bounds the loop).
- The away catch-up applies it per zone using each zone's **granary- and season-aware** cap + spoil margin
  (the same `foodCapFor` / `spoilMarginFor` the live pass uses), so a hoard left through winter bleeds sooner
  and deeper than one left through summer — the away path honours 461's grip exactly like the live path.
- Every id that loses a unit adds a 🥀 line (reusing `spoiledLine`) to the homecoming **digest**, so the loss
  is never silent ("🥀 The Fernreach's 🍓 spoiled").
- The away pass re-arms `lastSpoilDay` to the post-jump day, so the next live hour doesn't double-decay what the
  catch-up already spoiled.
- Wired into **both** the real restore path (`setupSave` → `fastForward`) and the `__catchUp` dev hook, so the
  e2e drives the exact same code the boot restore does.

### Acceptance criteria
- [ ] `spoilFoodOverDays(pile, 0, cap, margin)` returns the input pile unchanged (same ref) — a sub-day absence spoils nothing.
- [ ] `spoilFoodOverDays({berries: cap}, 3, cap, SPOIL_MARGIN)` bleeds to the floor (`cap - margin - 1`) and no lower — 3 days can't over-spoil past the self-limiting floor.
- [ ] `spoilFoodOverDays` is pure (never mutates its input) and settles at the same floor `spoilFood` iterated by hand reaches.
- [ ] E2E: seed a zone pile at cap, `__catchUp` several in-game days, and the pile has bled toward its floor (strictly less than it started) — the current build leaves it untouched, so this is the regression the arc fixes.
- [ ] E2E: after that catch-up, `__awayDigest()` (and the returned digest) contains a 🥀 "spoiled" line naming the zone.
- [ ] E2E: a sub-day `__catchUp` (< 1 in-game day) leaves the hoard untouched and adds no 🥀 line.
- [ ] Build clean, full unit + e2e suite green; the live `checkSpoilage` path and the existing away/spoilage specs are unregressed.

### Out of scope
- No change to the **live** `checkSpoilage`/`runSpoilage` path or its once-per-day guard — 462 only adds the
  away/jump path.
- No per-crop or per-season *new* behaviour beyond reading the existing `seasonGrip` (461 already owns that).
- No change to the bond-drift half of the away catch-up (106) — only the food stores are new.
- The digest line reuses `spoiledLine`; no new copy or a per-zone summary line this cycle.

### Constraints
- The pure decision (`spoilFoodOverDays`) lives in `spoilage.ts` and is unit-tested; WorldScene owns the
  per-zone cap/margin lookup, the digest append, and persistence (Coder keeps logic out of the Phaser glue).
- Additive save changes only — nothing new is persisted (spoilage reads the already-persisted `foodPileByZone`).
- Must run **after** `syncSeason()` on the restore path so `currentSeason()`/`spoilMarginFor()` read the
  restored day, and set `lastSpoilDay` to the post-jump day so the live hook doesn't re-spoil.
- No file overlap with the lore track.
