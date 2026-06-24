# Cycle 76 — Design

Two tracks, disjoint code paths. Lore (345) touches migration *selection* + a new pure predicate; structure (328) touches resource *banking* + the stockpile save. Shared file `WorldScene.ts` only, in non-overlapping regions.

---

## Lore track — BACKLOG-345: News pulls a newcomer

**Item:** BACKLOG-345 [emergent] News pulls a newcomer.

**Why this cycle:** Cycle 75 made grove news travel the bowl (342). A rumor that changes nothing is just chatter — this cycle the news *moves a body*: a dino that has only heard about the pond, never crossed, is the one curiosity tugs across next. Gossip shaping where a mind goes is the Project-Sid beat the CHARTER calls for, and it reuses the existing migration spine, so it's one-cycle-sized.

**What ships:** When the ambient migration roll fires (`maybeMigrate`), instead of picking a uniformly random non-crossing dino, it *prefers* a **grove-curious** one — a bowl dino that carries grove news in memory (the 342 token, first-hand or heard) but has never itself crossed (`groveVisited`). If any candidate is grove-curious, the migrant is drawn from that set; otherwise the pick is the old uniform random over all candidates (behavior unchanged when no one is curious). The nudge is naturally **one-time**: once the dino crosses, it joins `groveVisited` and is no longer curious.

**Acceptance criteria (345):**
- [ ] `groveCurious(events, visited, name, homeZone)` is pure and true iff: `homeZone` is the bowl AND `name ∉ visited` AND some event contains the grove-news token; false if any condition fails (grove home, already visited, or no grove news).
- [ ] A bowl dino that has *heard* grove news (carries the `groveWordLine` rumor) but never crossed is grove-curious; a dino that *went* (in `groveVisited`) is not, even though it carries first-hand grove news.
- [ ] When at least one candidate is grove-curious, `maybeMigrate`'s pick comes from the curious set (verified via a `__maybeMigrate()` hook that runs the selection deterministically and returns the chosen name): a single curious bowl dino is the one chosen to start migrating.
- [ ] When no candidate is grove-curious, the migrant is selected from all non-crossing candidates exactly as before (the existing migration/liveliness specs stay green).
- [ ] The nudge is one-time: after the curious dino crosses into the grove (now in `groveVisited`), it is no longer grove-curious.
- [ ] `curiosity.ts` is pure (no Phaser, no `ai/` backend); no save change (curiosity is derived from existing persisted memory + `groveVisited`); build clean.

**Out of scope:** The reluctant-returner reaction on arrival (351), pond rivalry (350), traveler's-book-mark (352) — all seeded, separate cycles. No change to the *visible walk* (334) or cooldown/chance pacing (333) — only *which* dino is picked.

**Constraints:** Preserve the migration cooldown + `MIGRATE_CHANCE` gating in `maybeMigrate` (only the candidate *pick* changes). Keep `__startMigration`/`__migrate` byte-identical (the cycle-073/074 specs drive them directly). Factor the pick into a `pickMigrant()` method so the ambient roll and the `__maybeMigrate()` hook share one path.

---

## Structure track — BACKLOG-328: Per-zone stockpile

**Item:** BACKLOG-328 [emergent] Per-zone stockpile.

**Why this cycle:** Each zone grows its own resources (314) and the split is legible (316), but everything banks into one global pile with one global cap (285/309) — a grove branch and a bowl branch land in the same total. Splitting the pile per zone makes the economy genuinely local and is the prerequisite for carry-between-zones (329, a real transfer) and resource bias (348, divergent piles).

**What ships:** The single shared stockpile becomes a pile **per zone**. A dino banking a gathered resource banks into *its own home zone's* pile; the cap (309) applies per zone (a full bowl pile no longer stalls grove gathering); a craft/shelter (286/315) spends the builder's zone pile. The plaque's `Stores · …` line shows the **keeper's active zone** pile, so crossing into the grove shows the grove's stores. Old saves (one global `stockpile`) migrate into the bowl's pile on load.

**Acceptance criteria (328):**
- [ ] Banking in the bowl raises the bowl pile and leaves the grove pile untouched, and vice-versa (`__zoneStockpile('bowl')` / `__zoneStockpile('grove')` diverge).
- [ ] The cap is per zone: a bowl pile at `STOCKPILE_CAP` for a kind stalls bowl banking of that kind (the 309 drop-log) but does **not** stall grove banking of the same kind.
- [ ] A craft/shelter spends the builder's *zone* pile only (the cairn/shelter build in zone Z reduces Z's pile, not the other zone's).
- [ ] The plaque `Stores` line reflects the keeper's active zone: crossing zones swaps the displayed pile; `__stockpile()` returns the active zone's pile (back-compat — existing bowl-run specs unchanged).
- [ ] Additive save: a save round-trips `stockpileByZone`; an older save carrying only the global `stockpile` loads with that pile assigned to the **bowl** (grove empty); `version` stays 2; a malformed `stockpileByZone` is rejected (null), mirroring the `stockpile` validation.
- [ ] The pure `resource.ts` helpers (`bankResource`/`atCap`/`canCraft`/`craft`/`buildShelter`) are reused unchanged (they already take a pile arg); build clean; full suite green.

**Out of scope:** Carry-between-zones (329) and resource bias (348) — this only splits the pile. No new cap value, no per-zone cap tuning (same `STOCKPILE_CAP` per zone). No UI beyond the existing Stores line showing the active zone.

**Constraints:** `stockpileByZone` is additive in the save (no `SAVE_VERSION` bump); keep writing the legacy `stockpile` field as the bowl pile so old readers and the existing saveGame round-trip tests stay valid. The cairn/shelter saving-branch (315) must keep working — it now reads the gatherer's zone pile (compute `zone` once, before banking, and use it throughout `checkGather`).

---

**Build order:** Independent. Structure (328: `checkGather` banking, plaque Stores line, `stockpileByZone` save) and lore (345: `curiosity.ts` + `pickMigrant` in `maybeMigrate`) touch different regions of `WorldScene.ts` and different modules. Both: no `SAVE_VERSION` bump, no new deps, `NPCBrain` boundary untouched.
