# Cycle 121 — Design

Two tracks. The lore track ships Milestone 10's last arc; the structure track widens governance from one
decision to two.

---

## Lore track — BACKLOG-362

**Item:** BACKLOG-362 [emergent] *A ground you come to miss* (queued as "Grove-struck homesickness";
generalized to any ground, per the milestone arc).

**Why this cycle**

Every migration bias this park has is a **push**. Scarcity empties the poorest ground (450), a hollowing one
makes its remaining residents lean harder to leave (460), a dry pantry sends a mouth toward a fuller one
(457/458), and even homesickness (340) is really a pull toward a *dino*, not a place. Nothing has ever made
a dino leave good ground because somewhere else got under its skin. Cycle 119 taught the park to remember
who set foot on a ground first, cycle 120 taught it that having *been* somewhere is standing you can carry —
both read the same record of where each dino has been. Tonight that record grows a clock: a ground you stood
on and have been away from long enough starts calling you back. That is what turns four grounds from a graph
a dino gets routed across into places it lives among, and it is the last arc in Milestone 10.

**What ships**

- Every time a dino crosses **out** of a ground, the in-game day it left is recorded against that dino and
  that ground (the departure clock). The record persists in the save (additive).
- Once a dino has been away from a ground it has actually stood on for **`YEARN_DAYS` (3) in-game days or
  more**, that ground starts to call it: a faint memory in its own voice (`💭 haven't seen The Hollow in a
  while`), filed once per ground per stretch away.
- The yearning **re-primes migration, both halves**:
  - *Who goes* — a yearning dino is picked as the next migrant ahead of the scarcity fallback (and below the
    grove-pull, homesick and word-of-plenty tiers, so every pinned pick above stays byte-identical).
  - *Where it goes* — a yearning dino heads for the ground it misses, not the richest/unsettled pick, as long
    as that ground is a reachable neighbour of its home. Among several missed grounds it heads for the one
    it has been away from **longest** (ties: chain order — deterministic, never a coin flip; BACKLOG-456).
- The departure reads in-world: the dino floats a `💭` bubble as it sets off and the keeper gets a ticker
  line (`💭 Mossback misses The Hollow — heads back`). Arriving clears the yearning for that ground (the
  departure clock restarts the moment it leaves again).
- The collection book carries it: a dino currently missing somewhere reads `misses The Hollow`.
- Temperament colours the *strength*, never the fact: a **curious** dino (`curiosity ≥ 0.5`) starts to miss a
  ground a day sooner than a homebody. Deterministic, name-seeded, no model required.

**Acceptance criteria**

- [ ] `yearnedZone` returns `null` for a dino that has never left anywhere, and `null` for a ground left
      fewer than `YEARN_DAYS` ago
- [ ] `yearnedZone` returns the ground left **longest** ago when two qualify, and resolves a tie by chain
      order (same input → same answer across 100 calls)
- [ ] `yearnedZone` never returns the dino's current home ground
- [ ] A curious dino (`curiosity ≥ 0.5`) qualifies one in-game day earlier than a cautious one, and both
      qualify eventually
- [ ] Crossing out of a zone stamps a departure day for that zone: `__leftDays()` shows the source ground
      against the crossing dino's name after a `__startMigration` + step-through crossing
- [ ] A dino past the yearning threshold for a reachable neighbour files the `💭` memory exactly once for
      that stretch (a second world step does not duplicate it in `__memory(name)`)
- [ ] `__yearnDest(name)` returns the missed ground for a qualifying dino and `null` for a non-qualifying one
- [ ] With one dino past the threshold and no grove-pull / homesick / plenty-primed dino in the park,
      `__maybeMigrate()` picks that dino
- [ ] A yearning migrant's destination is the ground it misses, not the richest neighbour — pinned with a
      richer non-missed neighbour present
- [ ] The ticker carries `misses <Zone Name>` on a yearning departure (`__events()`)
- [ ] The collection book shows `misses <Zone Name>` for a yearning dino and omits the line for one with
      nothing to miss
- [ ] Save round-trips the departure clock: export → reload → `__leftDays()` is unchanged; an **old save
      without the field** loads clean (no crash, no yearning until the first crossing)
- [ ] E2E: a driven crossing out and a clock advance produce a visible `💭` departure and a return crossing
      to the missed ground

**Out of scope**

- The grove-only `groveVisited` / grove-pull spine (339/342/346/355) is **not** refactored into this. It is
  pinned by the cycle-076/078 specs and 364 already made the "don't fold it" call.
- No yearning *dialogue* line to the keeper — the memory rides the existing recall path; a dedicated
  greeting register is a follow-up, not this arc.
- No yearning across non-adjacent grounds (multi-hop routing is BACKLOG-475's lane).
- No decay of the memory beyond the arrival clear.

**Constraints**

- Pure logic in `game/src/world/yearning.ts` (no Phaser); WorldScene owns the mutable record + the seams.
- **Save is additive only** — a missing `leftDays` loads as `{}`. No `SAVE_VERSION` bump.
- The new migrant tier goes **below** grove-pull / homesick / plenty-primed and **above** the scarcity
  `poorestResidents` fallback, so every cycle-076/078/109/111 pick stays byte-identical.
- Deterministic picks only. No `Math.random()` in the destination or the qualification read.
- **Cross-track:** none. The structure track (473) touches `governance.ts`, `regrowth`/`buildOnGather` and
  the lens; this track touches migration, memory, the book and the save. No shared file except
  `WorldScene.ts` and `saveGame.ts` — see the code plan for ordering.

---

## Structure track — BACKLOG-473

**Item:** BACKLOG-473 [emergent] *The ground's second decision* — a provider-set **work priority**.

**Why this cycle**

463 gave a ground's provider one decision — how the pantry spends — and 467/468/469/470/471 spent a whole
milestone making that one decision visible, transferable and lived. But one decision is a setting, not a
system. Governance becomes a *system* the moment a ground decides more than one thing, and the second call
that matters most is the oldest tension in the CHARTER's resources→crafting→building arc: do the residents
fill the stores, or raise the walls? Tonight a provider makes that call too, off a different axis of its
temperament than the spend call, so two providers with the same warmth can still run their grounds
differently — and the difference is visible on the skyline.

**What ships**

- `governance.ts` gains a second policy: `WorkPriority = 'gather' | 'build'`, set by the zone's standing
  provider from its **energy** axis (an energetic provider puts its ground to work raising landmarks →
  `'build'`; a calm one has it gather and store → `'gather'`). Deterministic, name-seeded, stable per
  provider. A zone with no provider ever → `null` → **today's behaviour exactly**, the same compatibility
  seam 463 honours.
- Two hooks, one per direction, so both branches actually do something:
  - **The build hook** (`buildOnGather`, 377/417/454): a `'gather'` ground **holds off** raising its bias
    landmark while its resource pile is below `WORK_BUILD_FLOOR` — the pile visibly climbs instead of being
    auto-drained on every affordable cairn. A `'build'` ground never defers **and** reaches its granary
    sooner: its granary gate (`GRANARY_AFTER_STRUCTURES`) is shaved by one landmark, floored at 1.
  - **The ground hook** (`regrowth`, 384): a `'gather'` ground's yield regrows **faster** (its residents
    work and tend it), a `'build'` ground's regrows **slower** (backs are on the walls). One multiplier,
    clamped, `null` → ×1.
- The policy persists per zone exactly like the spend priority (`workPriorityByZone`), lingers when a
  provider departs, and is **re-set on a provider handover** (467) — the incoming provider sets *both*
  calls from its own temperament, and the handover ticker names both.
- The zone-map lens (425/468) shows the work glyph beside the spend glyph: 🧺 gathers-first / 🧱
  builds-first, nothing at all for a ground with no provider.

**Acceptance criteria**

- [ ] `providerWorkPriority` returns `'build'` for `energy ≥ 0.5` and `'gather'` below it; absent traits →
      `'build'` (today's behaviour)
- [ ] `providerWorkPriority` and `providerPriority` read **different** axes — a fixture provider with
      `energy 0.9, agreeableness 0.1` yields `'build'` + `'bank'`, and the mirrored fixture yields
      `'gather'` + `'feed'`
- [ ] `landmarkDeferredForGathering(null, n)` is `false` for every `n` (the `null` seam)
- [ ] `landmarkDeferredForGathering('gather', n)` is `true` below `WORK_BUILD_FLOOR` and `false` at or above
- [ ] `landmarkDeferredForGathering('build', n)` is `false` for every `n`
- [ ] `granaryGateFor('build', base)` is `base - 1`, floored at 1; `granaryGateFor('gather'|null, base)` is
      `base`
- [ ] `workRegrowth('gather', y) > workRegrowth(null, y) > workRegrowth('build', y)` for a mid-range yield,
      and all three stay within `[0, YIELD_MAX]` at the extremes
- [ ] `workGlyph` renders 🧺 / 🧱 / `''` for `'gather'` / `'build'` / `null`
- [ ] In-scene: a zone whose provider is calm does **not** raise a landmark on a gather that leaves its pile
      under `WORK_BUILD_FLOOR` (`__structures(zone)` count unchanged), and does raise one once the pile is
      over it
- [ ] In-scene: a zone whose provider is energetic raises its granary one base landmark earlier than the
      unpolicied gate
- [ ] A provider handover (467) re-sets the work priority to the incoming provider's, and the handover
      ticker line names both calls
- [ ] The work priority persists: export → reload → `__workPriority(zone)` unchanged; a save without the
      field loads clean and reads `null` until a provider stands
- [ ] The zone-map lens box shows the work glyph beside the spend glyph for a policied zone and neither for
      an unpolicied one
- [ ] E2E: opening the zone-map lens in a park with a standing provider shows both governance glyphs

**Out of scope**

- **Not** the compact two-call lens fold + `[?]` legend — that is BACKLOG-477, seeded this cycle. Tonight
  the work glyph simply sits beside the spend glyph.
- No gossip about the work priority (the 470 word-of-the-policy spine stays spend-only this cycle).
- No dino voice on the work call (the 469 register stays spend-only).
- No third decision, and still no vote (031 stays deferred).

**Constraints**

- All logic pure in `game/src/world/governance.ts` beside the policy it doubles; WorldScene owns the
  per-zone store, the persistence and the read sites.
- **Save additive only** — missing `workPriorityByZone` → `{}`. No `SAVE_VERSION` bump.
- `null` must be byte-identical to pre-473 behaviour at **both** hooks; the regrowth multiplier for `null`
  is exactly 1.
- Do not touch the spend-priority hooks (444 / 454 defer) — 463's behaviour is pinned by shipped specs.
- **Cross-track:** shares only `WorldScene.ts` + `saveGame.ts` with the lore track. Code plan specifies the
  order.
