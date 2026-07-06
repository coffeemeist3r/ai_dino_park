# Cycle 93 — Design

Two tracks this cycle, both opening Milestone 2 ("Places to belong").

---

## Lore track — BACKLOG-341: the home-zone lean (a dino settles)

### Intent
A dino that has lived in its current zone long enough forms an attachment to it and stops
drifting on every ambient migration coin-flip (274/333). "Home" stops being a per-roll accident.
Player-visible as a collection-book line once a dino has settled.

### Spec
- New pure module `game/src/world/belonging.ts` (Node-testable, no Phaser):
  - `SETTLE_ROLLS = 4` — how many ambient migration rolls (real-time, ~90 s each ⇒ ~6 min) a dino
    must reside continuously in one zone before it counts as *settled*. A `const`, tunable.
  - `bumpTenure(tenure, name)` → new map with `name`'s count +1 (pure; never mutates).
  - `resetTenure(tenure, name)` → new map with `name` set to 0 (called on a zone crossing).
  - `tenureOf(tenure, name)` → number (absent → 0).
  - `isSettled(rolls, threshold = SETTLE_ROLLS)` → `rolls >= threshold`.
  - `SETTLED_MIGRATE_DAMP = 0.6` — probability a *settled* dino, once picked as the migrant,
    resists and stays put this roll.
  - `resistsMigration(settled, rand = Math.random)` → `settled && rand() < SETTLED_MIGRATE_DAMP`.
  - `settledLine(zoneName)` → `` `at home in ${zoneName}` `` — the book read (empty string caller-side
    when not settled).
- `WorldScene`:
  - New field `tenure: Record<string, number> = {}` — per-dino residence count, **persisted**
    (additive save field).
  - A private `bumpTenures()` that increments every **non-migrating** dino's tenure once, called at
    the top of `maybeMigrate()` (so tenure accrues on the real migration cadence regardless of
    whether a migration fires). Exposed as a dev hook `__settleTick()` for e2e.
  - `crossDino()` resets the arriving dino's tenure (`resetTenure`) — a fresh zone starts fresh.
  - In `maybeMigrate()`, after a migrant `d` is picked: if `isSettled(tenureOf(tenure, d.name))`
    and `resistsMigration(true)`, return without migrating (the settled dino stays put this roll).
  - `bookRows()` gains `home?: string` = `settledLine(zoneName)` when the dino is settled in its
    current zone, else undefined.
  - Dev hooks: `__tenure(name)`, `__settled(name)` (= `isSettled(tenureOf(...))`), `__settleTick()`.
- `game/src/ui/lenses.ts`: `BookRow` gains optional `home?: string`; `bookLines` pushes
  `` `  ${r.home}` `` when present (placed after `plans`).
- Save: `saveGame.ts` gains additive `tenure?: Record<string, number>` (validate like `dinoZones`:
  object-or-absent, string→number entries; absent → `{}`). No version bump — the 426 envelope
  carries it; old saves load with empty tenure and settle from scratch (never breaks a save).

### Acceptance criteria (lore)
1. `belonging.ts` unit tests: `bumpTenure`/`resetTenure` are pure (input map unchanged); `tenureOf`
   defaults 0; `isSettled` false below threshold, true at/above; `resistsMigration(false, …)` always
   false; `resistsMigration(true, rand)` true when `rand < DAMP`, false when `≥ DAMP`; `settledLine`
   formats the zone name.
2. In-world (e2e): a dino accrues tenure across `__settleTick()` calls; below `SETTLE_ROLLS` it is
   `__settled === false`, at/after the threshold `__settled === true`.
3. In-world (e2e): once a dino is settled, its collection-book text (`__bookText`) contains
   `at home in ` + its zone's display name.
4. In-world (e2e): a dino whose home zone changes (`__migrate` to another zone) has its tenure reset
   to 0 (`__tenure` === 0 right after the cross-driven reset) — home starts fresh in the new place.
5. Deterministic floor intact: no dependence on WebLLM; zero new console errors headless; the damp is
   the only randomness and it is unit-pinned via injected `rand`.
6. Additive save only: a save written before this cycle (no `tenure` field) loads clean (empty tenure).

---

## Structure track — BACKLOG-417: the Fernreach's frond thatch

### Intent
The three-zone chain should raise three *different* built landmarks, one per zone's resource bias.
Today: bowl → 🗿 cairn (stone), grove → 🛖 lean-to (branch), Fernreach → 🗿 cairn (frond placeholder).
417 gives the frond bias its own structure — a woven frond **thatch** 🥻 (rig already stashed as
BACKLOG-427) built from the fronds the Fernreach actually gathers — so the chain's skyline reads as
three distinct places.

### Spec
- `game/src/world/resource.ts`:
  - `export type Structure = 'cairn' | 'shelter' | 'thatch';`
  - `export const THATCH_RECIPE: Partial<Record<ResourceKind, number>> = { frond: 4 };` — pure frond;
    the Fernreach banks fronds (400, 75% of its rolls) and now spends them on its own landmark.
  - `export const THATCH_GLYPH = '🥻';`
  - `STRUCTURE_BY_BIAS: { stone: 'cairn', branch: 'shelter', frond: 'thatch' }` (was `frond: 'cairn'`).
  - `structureRecipe(zone)`: return `THATCH_RECIPE` when `zoneStructure(zone) === 'thatch'`, else the
    existing cairn/shelter recipes.
  - New generic `buildStructureFor(pile, zone)`: affords + spends `structureRecipe(zone)`, returns the
    new pile or null. (Keep `craft`/`buildShelter`/`canCraft`/`canBuildShelter` exported — unit tests
    + no behavior change — but route the scene build through the generic so a new zone-structure needs
    no fourth bespoke spend pair.)
- `game/src/scenes/WorldScene.ts`:
  - `thatches: { tileX; tileY; zone }[]` + `thatchSprites[]` fields, mirroring `shelters`.
  - Build dispatch (in the gather-bank tail, currently `if (zoneStructure === 'shelter') … else cairn`):
    become a three-way — compute `const built = buildStructureFor(pileFor(zone), zone)`; if built,
    place by `zoneStructure(zone)`: `'thatch' → placeThatch`, `'shelter' → placeShelter`, else
    `placeCairn`. (Cairn/shelter math is byte-identical — `buildStructureFor` uses the same recipes.)
  - `drawThatch`/`placeThatch` mirroring `drawShelter`/`placeShelter`: baked `bakePropArt(this,'thatch')`
    where the rig exists (it does — 427), else the 🥻 glyph; zone-visibility toggle (`s.zone === zoneId`);
    a "wove a frond thatch" memory + `logEvent`.
  - `applyZoneVisibility()` toggles `thatchSprites` too.
  - Save/restore `thatches` mirroring `shelters` (backfill `zone ?? BOWL_ID`, `drawThatch` each).
  - Dev hooks: `__thatches` (mirror `__shelters`), and reuse the prop-art check (`__thatchIsArt`
    mirror of `__cairnIsArt`) so QA can confirm the stashed rig renders.
- `game/src/world/saveGame.ts`: additive `thatches?: { tileX; tileY; zone? }[]` mirroring `shelters?`
  (absent → []). No version bump.

### Acceptance criteria (structure)
1. `resource.ts` unit: `zoneStructure(FERNREACH_ID) === 'thatch'`; `structureRecipe(FERNREACH_ID)`
   deep-equals `THATCH_RECIPE`; bowl/grove `zoneStructure`/`structureRecipe` unchanged (cairn/shelter).
2. `buildStructureFor`: with a frond-4+ Fernreach pile returns a pile with frond reduced by 4; with
   an under-recipe pile returns null; for a bowl pile it spends the cairn recipe (branch-3/stone-2)
   identically to `craft` (parity assertion); pure (input pile unchanged).
3. `STRUCTURE_BY_BIAS` is total over `ResourceKind` (stone/branch/frond all mapped) — no kind falls
   through to a default.
4. In-world (e2e): drive the Fernreach's pile to frond ≥ 4 (via `__setZonePile` or the gather path)
   with a Fernreach resident gathering; a 🥻 thatch is recorded in `__thatches` for the Fernreach and
   the frond pile drops by the recipe; the bowl still stacks cairns (`__cairns`) — three distinct
   landmark types across the chain.
5. The thatch renders from the stashed pixel rig (`__thatchIsArt === true`) — the rectangle/glyph
   fallback is *not* the shipped path (the rig exists); the glyph remains the graceful fallback in code.
6. Additive save only: a thatch survives serialize→deserialize→restore (appears in `__thatches` after
   reload); a pre-417 save (no `thatches`) loads clean.

### Cross-track note
Both tracks touch `WorldScene.ts` and `saveGame.ts` but in disjoint regions (belonging: tenure
field + `maybeMigrate`/`crossDino`/`bookRows`; thatch: build dispatch + place/draw/restore). The
Coder builds structure first (417), then lore (341) on top — one session, no parallel conflict.
`structureRecipe` now feeds carry/barter with a frond recipe; fronds never leak out of the Fernreach
(400), so those systems fall back to a spare with no cross-zone regression (guard in QA).
