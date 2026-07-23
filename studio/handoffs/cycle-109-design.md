# Cycle 109 — Design

Milestone 6 ("No zone stands alone") closes this cycle on its last structure arc; Milestone 7 ("The economy
has weight") opens on its first lore arc. The two picks are the same beat seen twice: the structure track
makes a mouth *move toward plenty*, the lore track puts the reason in its mouth. They share the migration
code path in `crossDino` / `maybeMigrate`, so the diff is one coherent story.

---

## Structure track — BACKLOG-450 (Scarcity moves the herd)

**Item:** BACKLOG-450 [core] Scarcity moves the herd.

**Why this cycle:** the last arc between Milestone 6 and its headline. The two signals it reads — prosperity
index (428) and per-zone food store (446) — both already exist and are already derived. This cycle folds
them into one "appeal" per zone and biases the migration decision by it, so population becomes a consequence
of the economy: the demand read (438) and food flow (447) move *goods* toward need; 450 moves *mouths* toward
plenty.

**What ships:**

**1. A pure module `game/src/world/scarcity.ts`.** Three pure functions, no Phaser:
- `zoneAppeal(prosperity: number, food: number): number` — the fold. `prosperity + food * FOOD_APPEAL_WEIGHT`
  (weight = 1, a named calibration knob). Both inputs are already ≥ 0; a fuller pantry and a richer zone both
  raise appeal, monotonic.
- `richestNeighbor(neighbors: string[], appealOf: (z: string) => number): string | null` — the most
  appealing neighbour. **Deterministic:** highest appeal wins, first-in-list breaks a tie (stable,
  `ZONE_LINKS` order). `null` for an empty neighbour list. A weighted-random pick is exactly the BACKLOG-456
  flake shape; determinism is the bar.
- `poorestResidents<T>(candidates, zoneOf, appealOf): T[]` — the subset of candidates living in the
  least-appealing occupied zone (all of them when no zone is poorer, or ≤1 candidate). The caller still picks
  at random among the returned equals, so *who* leaves a poor zone stays varied.

**2. Destination — mouths move toward plenty.** In `WorldScene.maybeMigrate`, the ambient migrant's
destination changes from `neighbors[Math.floor(Math.random() * neighbors.length)]` to
`richestNeighbor(neighbors, zoneAppeal)`. A private `scarcityDestOf(home)` and `scarcityMigrate(d)` factor
this so `maybeMigrate` and the `__maybeMigrate` dev hook drive the **identical** path (no duplication, and the
hook stays faithful to production).

**3. Who leaves — want empties out.** In `WorldScene.pickMigrant`, the final fallback tier (no homesickness,
no grove-news pulling anyone) draws from `poorestResidents(candidates, …)` instead of uniform-random
`candidates`. **The homesick tier and the grove-pull `told`/`curious` tiers are byte-identical** — the change
touches only the plain-candidates branch. (cycle-076-news-pull and cycle-078-grove-pull pin the grove-pull
tiers by identity; they must stay green unmodified.)

**4. It collapses to the old behavior when zones are equal.** At spawn every dino is in the bowl, so every
zone's appeal is equal, both picks are the old uniform random, and the bias only switches on once zones
actually diverge — which is when it should.

**Dev hooks (e2e):** `__zoneAppeal(zone)` returns the number; `__scarcityDest(name)` returns the destination
the named dino's home zone would send it to (pure read, no side effect).

**Acceptance criteria (450):**
- [ ] `zoneAppeal(p, f)` = `p + f` (weight 1); raising either input never lowers the result.
- [ ] `richestNeighbor` returns the highest-appeal neighbour; ties resolve to the first in the input order; `null` for `[]`.
- [ ] `poorestResidents` returns exactly the candidates whose home zone has the minimum appeal; returns all candidates when every zone ties; returns the input unchanged for ≤1 candidate.
- [ ] With the grove made richer than the bowl (more banked food and/or prosperity), a grove dino's `__scarcityDest` returns the Fernreach or bowl **whichever has higher appeal**, and a fresh setup where the bowl is richest sends a grove dino to the bowl — i.e. the destination tracks appeal, not adjacency order.
- [ ] `__zoneAppeal(zone)` rises when that zone's banked food rises (`__setZoneFood`) with prosperity held constant.
- [ ] With two zones occupied and one made strictly poorer (lower appeal) than the other, and no homesickness/grove-news in play, `__maybeMigrate` picks a resident of the poorer zone across repeated runs (never a resident of the richer zone).
- [ ] cycle-076-news-pull and cycle-078-grove-pull stay green **unmodified** (the grove-pull identity picks are untouched).
- [ ] `npm run build` clean; the full existing migration/crossing e2e suite (073/074/076/078/085/095/106/107) stays green.

**Out of scope:** the hard "zone-exclusive resource" pull (Idea Box framing — a later item on top of this soft
bias); any change to the migrate cadence, cooldown, or chance; the draining-zone spiral (seeded 460, a later
arc); death or a zone fully emptying (deathless — a zone can thin, never vanish).

**Constraints:**
- `world/scarcity.ts` stays pure (no Phaser import) — Node-tested; `WorldScene` is the only consumer that
  reads live prosperity/food.
- `migrationCross`'s value type gains an optional `reason?: 'scarcity'` — additive, so `crossDino`'s existing
  reads (`.dest`, `.edge`) are unchanged and no save shape moves (`migrationCross` is transient, never persisted).
- **File overlap with the lore track:** `WorldScene.ts` (both), and `scarcity.ts` is read by the lore track's
  scarcity tag. The lore track adds `world/greenerground.ts` and the `crossDino` beat; the structure track
  owns `scarcity.ts` + `maybeMigrate`/`pickMigrant`. Sequence coder: structure first (scarcity.ts + the
  `reason` field), then lore (the `crossDino` beat reading `reason`).

---

## Lore track — BACKLOG-457 (Left for greener ground)

**Item:** BACKLOG-457 [emergent] Left for greener ground. Milestone 7's opening lore arc.

**Why this cycle:** 450 makes a dino cross toward plenty, but silently — a sprite slides across the edge with
no reason given. 457 is the voice on it, exactly as courier-pride (451) was the voice on food-flow (447) and
word-of-the-provider (453) the voice on the provider role (448): the milestone's established shape, a
mechanic and the feeling on top of it in one diff.

**What ships:**

**1. A tiny pure module `game/src/world/greenerground.ts`** (twin of `courierMemory`/`courierLine` in
foodstore.ts):
- `greenerGroundMemory(leftZoneName: string): string` → `` `${leftZoneName}'s pantry ran dry, so you went where the food is` `` — names the ground it left.
- `greenerGroundLine(): string` → `'🍃'` — the departure bubble.

**2. The beat fires in `crossDino`, only on a scarcity-tagged crossing that moved toward plenty.** When
`migrationCross[name].reason === 'scarcity'` (set by `scarcityMigrate` only when the destination is genuinely
richer than home), the crossing dino:
- files `greenerGroundMemory(<name of the zone it left>)` via `remember` — which rides the existing
  `recall → recentMemory → greet` path, so its next greeting reads a beat later with the reason (no new greet
  field, NPCBrain boundary untouched, deterministic under stub/fallback);
- shows a `🍃` bubble at the crossing (`showBubble`);
- posts a `🍃 <name> left <leftZone> for greener ground in <destZone>` ticker line.

**A homesick or homecoming crossing earns no greener-ground beat.** Homesickness (toward a friend, possibly
toward a *poorer* zone) and homecoming (back to a root) are not scarcity moves — they never set
`reason: 'scarcity'`. The beat is additionally guarded to not fire when the same crossing is a homecoming
(the two are mutually exclusive reads, guarded with a single local `homecoming` boolean reused from the 452
block).

**Acceptance criteria (457):**
- [ ] `greenerGroundMemory('The Fernreach')` contains `The Fernreach` and reads as the reason it left; `greenerGroundLine()` is `🍃`.
- [ ] A dino that crosses via a scarcity-tagged migration (dest richer than home) files the greener-ground memory naming the zone it left, and it surfaces in that dino's `recall`.
- [ ] A homesick crossing (via `__homesickMigrate`) and a plain grove-pull crossing toward an equal/poorer zone file **no** greener-ground memory (`reason` unset).
- [ ] The `🍃 … left … for greener ground in …` ticker line names the dino, the zone it left, and the zone it entered.
- [ ] e2e: with a neighbour zone made richer, a dino picked by `__maybeMigrate` and stepped across shows the greener-ground memory and the ticker line; a control dino crossing between equal zones shows neither.

**Out of scope:** the arrival welcome (seeded 459), the gossip/hearsay pull (seeded 458), any book row, any
change to *which* dino leaves or *where* it goes (that is 450). No save change — the memory rides the existing
store, `reason` is transient.

**Constraints:**
- `world/greenerground.ts` is pure, imports nothing game-side beyond types; no `@mlc-ai/web-llm` anywhere near it.
- The beat reuses `remember` / `showBubble` / `logEvent` / `recall` exactly as the 451 courier and 452
  homecoming beats do — no new mechanism.
- **File overlap:** `WorldScene.crossDino` (this track's beat) and `maybeMigrate`/`pickMigrant` (structure
  track) are different functions; the shared surface is the `reason` field the structure track adds and this
  track reads.
