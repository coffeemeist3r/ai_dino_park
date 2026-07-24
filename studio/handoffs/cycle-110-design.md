# Cycle 110 — Design

Two tracks: the lore beat **BACKLOG-458 (Word of plenty)** and the structure spine **BACKLOG-454 (The
granary)**. Both serve Milestone 7 ("The economy has weight").

---

## Lore track — BACKLOG-458 Word of plenty

**Item:** BACKLOG-458 [emergent] Word of plenty — a dino that *hears* a neighbour zone is thriving is primed
to migrate there, so plenty travels by talk before a body follows.

**Why this cycle:** 450 moves mouths toward plenty on a live prosperity read; 457 gave that mover a voice.
458 closes the loop the milestone wants — plenty becomes something the *cast spreads*, not just a number the
sim consults. It reuses two proven spines: the 1-hop gossip cascade (019/342/453) and the grove-news
migrant pull (345/355). A dino that heard "The Fernreach is thriving" is dragged toward it on the next
migration roll, ahead of a coin-flip — hearsay moving a body, exactly like grove-news does, but pointed at
the food economy instead of a pond.

**What ships:**
- A resident of a zone that currently reads `thriving` (prosperity tier) files a **first-hand plenty
  memory** naming its own zone ("🌾 The Fernreach is thriving") on the migration cadence — the seed.
- When two dinos meet, a dino carrying a first-hand plenty memory **lets it slip** as word-of-plenty to the
  listener (a rumor line, `RUMOR_MARK`, 1-hop), slotting into the existing gossip cascade below the provider
  word and above generic gossip. A `🌾 <B> heard <zone> is thriving from <A>` ticker line fires.
- A dino carrying word of a *thriving neighbour* (a zone that isn't its own home) is **primed to migrate
  there**: on the ambient migration roll it's preferred over the scarcity/random fallback (its own tier,
  below the grove-pull tiers so the 076/078 grove specs stay byte-identical), and when it crosses it heads
  for the **named** thriving neighbour rather than the pure richest-neighbour pick.
- The primed crossing still rides 457's greener-ground beat (dest richer than home → 🍃 + memory), so a
  gossip-drawn migrant *also* names the ground it left — the two arcs compose.

**Acceptance criteria:**
- [ ] `plentyMemory(name)` is first-hand/shareable (no `RUMOR_MARK`); `plentyWordLine(speaker, name)` carries `RUMOR_MARK`.
- [ ] `spreadPlentyWord` plants word on the listener **only** when the speaker carries a first-hand plenty memory; a listener who merely *heard* it does not re-spread (1 hop).
- [ ] `spreadPlentyWord` returns `{rumor: null}` for speaker===listener, or when the speaker carries no first-hand plenty memory.
- [ ] `plentyTarget(events, currentZoneId)` returns the zone id named in the newest plenty memory that isn't the current zone, and `null` when none / only the current zone is named.
- [ ] After `__spreadPlentyWord(A, B)` where A carries first-hand plenty about a thriving neighbour of B, B's `__plentyTarget` is that zone id.
- [ ] A dino primed toward a thriving neighbour is chosen by `pickMigrant` ahead of the scarcity/random fallback, and `__scarcityDest`/its crossing destination is the named zone.
- [ ] Build clean, `vitest run` green (new `plentyword.test.ts` included), full e2e green.

**Out of scope:** the arriving-side welcome (459, next arc); multi-hop plenty (stays 1-hop like all rumors);
plenty pulling a dino toward a *non-neighbour* zone (priming only applies to a reachable neighbour); any LLM
path (deterministic memory strings only — the `NPCBrain` boundary is untouched).

**Constraints:** Do **not** reorder the grove-pull tiers in `pickMigrant` — the cycle-076/078 specs pin them;
insert the plenty tier *after* grove, *before* the poorest-residents fallback. The plenty destination pick
must be **deterministic** (no `Math.random` in the destination path — BACKLOG-456 flake family). Reuse
`RUMOR_MARK`/`isShareable` from `social/gossip.ts` and `zoneNeighbors`/`ZONES` from `world/zones.ts`.

---

## Structure track — BACKLOG-454 The granary

**Item:** BACKLOG-454 [emergent] The granary — a zone that has raised enough landmarks builds a granary; a
standing granary lifts that zone's food cap.

**Why this cycle:** The build arc and the food economy have never touched. A granary is the join: a zone
earns a bigger pantry by building, so "the economy has weight" gains a *plenty source* to match 455's coming
spoilage cost.

**What ships:**
- A new **granary** structure with its own recipe (`GRANARY_RECIPE = {branch:3, stone:3}`) and glyph (🏛️),
  placed/persisted/zone-scoped exactly like the cairn/shelter/thatch (drawn in-world, saved, restored,
  visible only in its own zone).
- A zone that has raised **`GRANARY_AFTER_STRUCTURES = 3`** base landmarks (cairns+shelters+thatches, not
  counting granaries) and does **not** yet have a granary stops auto-building its bias landmark and **saves
  toward the granary** — the next affordable build in that zone is the granary. Once built, the zone resumes
  building bias landmarks (mirrors the old `SHELTER_AFTER_CAIRNS` escalation seam).
- A **standing granary lifts that zone's food cap** from `FOOD_STOCKPILE_CAP` (6) to `6 + GRANARY_FOOD_BONUS`
  (=9): the zone banks harvests and accepts ferried food up to the raised cap, so its banked-food line on the
  map lens can climb past 6.
- The granary reads on the map lens (a 🏛️ marker on a zone that has one).

**Acceptance criteria:**
- [ ] `canBuildGranary(pile, landmarks, hasGranary)` is true only when `!hasGranary && landmarks >= GRANARY_AFTER_STRUCTURES && pile affords GRANARY_RECIPE`; false otherwise.
- [ ] `buildGranary(pile)` returns the pile minus `GRANARY_RECIPE` (never mutates), or `null` when unaffordable.
- [ ] `granaryFoodCap(true) === FOOD_STOCKPILE_CAP + GRANARY_FOOD_BONUS`; `granaryFoodCap(false) === FOOD_STOCKPILE_CAP`.
- [ ] `foodAtCap`/`bankFood`/`pickFoodCarry` accept an optional cap defaulting to `FOOD_STOCKPILE_CAP`, so every existing call is byte-identical; with the raised cap a pile at 6 can bank up to 9.
- [ ] After a zone has ≥3 landmarks and a `{branch:3,stone:3}` pile, a gather that triggers a build places a granary (`__granaries` shows one in that zone), spending the recipe; before 3 landmarks, the same gather builds the bias landmark instead.
- [ ] A zone with a granary banks a harvest at 6 up to 7/8/9 (past the flat cap); a zone without one still stalls at 6.
- [ ] Granary persists: `__granaries` survives a save/restore round-trip; old saves (no `granaries`) load as `[]`.
- [ ] Build clean, `vitest run` green (new `granary.test.ts` + foodstore cap tests), full e2e green.

**Out of scope:** spoilage/decay (455, next); per-crop granary bonuses; more than one granary per zone; a
granary recipe that varies by zone (one fixed recipe — a shared build any zone can earn via gather + carry).

**Constraints:** Additive save only (new `granaries` field; absent → []). Thread the food cap through
`foodAtCap`/`bankFood`/`pickFoodCarry` with a **default** = `FOOD_STOCKPILE_CAP` so no existing caller/test
changes. Granaries count toward `zoneSignals.structures` (prosperity), but the granary **gate** counts only
base landmarks. No new npm deps.

## Cross-track collision

Near-zero. Both tracks read `world/prosperity.ts` (neither writes it). 458 touches `pickMigrant` /
`scarcityMigrate` / the gossip cascade in `WorldScene.ts`; 454 touches the gather-build path / food-store
cap threading / structure arrays in `WorldScene.ts` — different methods, same file. Coder: land 454's
food-store + resource changes first (pure modules + build path), then 458's migration/gossip wiring, to keep
the two WorldScene edit regions clean.
