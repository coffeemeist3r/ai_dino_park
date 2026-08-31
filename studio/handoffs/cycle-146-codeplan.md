# Cycle 146 — Code Plan

Both tracks, files listed, prior art named. Sequence: lore track first (new module, then the ladder, then
the marks, then the book), structure track second (recipe, then the lens read, then the tier), so the
tithe's spec fallout lands against a settled tree.

---

## Lore track — BACKLOG-109

### Prior art (reuse, do not re-derive)

| What | Where | Use |
|---|---|---|
| Name-seeded traits | `ai/personality.ts` `Personality`, `seededPersonality` | the input; chronotype derives, never stores |
| Season rest windows | `world/huddle.ts` `SEASON_HUDDLE`, `HuddleRule` | the day-dino window *is* this table; owl is it shifted |
| Wrapping-window test | `world/huddle.ts` `inHuddleWindow` | copy its `start <= end ? … : …` idiom, do not re-invent it |
| Day phase | `world/dayNight.ts` `dayPhase` | the awake-at-night mark's gate |
| Mark plumbing | `WorldScene.refreshSleepMarks` / `refreshColdMarks` chain | the two glyph slots hang off this chain |
| Book row | `ui/lenses.ts` `BookRow` + `bookLines` | one new optional field, one new render line |

### Files

1. **`game/src/world/chronotype.ts`** *(new)*

   ```
   export type Chronotype = 'day' | 'owl';
   export const OWL_BAR = 0.5;
   export function owlishness(p: Personality): number      // curiosity*0.65 + (1-energy)*0.35
   export function chronotypeOf(p: Personality): Chronotype
   export function restWindow(c: Chronotype, season?: Season): { start: number; end: number }
   export function atRest(hour: number, c: Chronotype, season?: Season): boolean
   export function chronotypeLine(c: Chronotype): string   // 'keeps late hours' / 'up with the sun'
   ```

   `restWindow('day', s)` returns `SEASON_HUDDLE[s]`'s start/end verbatim (and, with `season` omitted,
   the legacy night phase 21→05 so an omitted season stays back-compatible with `inHuddleWindow`).
   `restWindow('owl', s)` is the same pair each `+ OWL_SHIFT (8)` mod 24. `atRest` is `inHuddleWindow`'s
   wrap test applied to whichever window came back — same idiom, one place.

   Pure: imports `Personality` (type-only) and `Season` (type-only) plus `SEASON_HUDDLE`. No Phaser, no
   clock, no `Math.random`.

2. **`game/src/world/chronotype.test.ts`** *(new)* — the derivation table over all ten roster names, the
   4/6 split, the Bowl-owl assertion read off `ROSTER` rather than off a literal, the window shift across
   all four seasons, and `atRest` at 08:00 and 23:00 for both types.

3. **`game/src/scenes/WorldScene.ts`**
   - `~4600`: delete the per-step `const denTime`. Inside the per-dino loop compute
     `const resting = atRest(hour, chronotypeOf(d.traits), season)`.
   - `~4814`: `huddling = resting && this.maxBond(d.name) >= huddleThreshold(season)` (was `denTime &&`).
   - Same block: `gathering` / `moping` / `socializing` and the wander tail each gain `!resting`. A
     resting non-huddler takes no movement branch — it holds its tile.
   - `isHuddling` (3300) keeps its name and meaning (huddle = at the den). Add `isResting(d)` beside it,
     off `atRest` + the dino's own traits, and point `refreshSleepMarks` at **`isResting`** so the doze
     glyph is about sleep and not about the den.
   - New `refreshRouseMarks()` in the existing mark chain: visible when
     `dayPhase(hour) === 'night' && !this.isResting(d) && this.inView(d)`. New `rouseMarks` sprite array
     built alongside `sleepMarks`; glyph `👁`, slot at `y - TILE * 1.4` is taken by cold, so use `y - TILE`
     — it is mutually exclusive with the doze glyph by construction, so it can share that slot.
   - `bookRows()` (3692): `hours: chronotypeLine(chronotypeOf(d.traits))`.
   - Dev hooks beside `__huddlers` (3051): `__resting = () => names of resting dinos` and
     `__chronotypes = () => ({name: 'day'|'owl'})`, for the e2e.

4. **`game/src/ui/lenses.ts`** — `BookRow.hours?: string`, rendered in `bookLines` on its own row beside
   the quirk line (`  · <line>`).

5. **`tests/e2e/cycle-146-hours.spec.ts`** *(new)* — frame one at 08:00: `__resting()` contains Rex and
   does not contain Sunny; Rex's tile is unchanged across a `__step()`. Then wind the clock to 23:00 and
   assert the inverse plus at least one dino in each state.

### Test plan

Unit: the whole derivation and window table (above), plus a hold-still test at the ladder level if one
exists to hang it on — otherwise the e2e covers it. e2e: the two frames above.

### Expected fallout

Any spec asserting the whole cast huddles at night, or that dinos wander at night, or that `__huddlers()`
is empty at 08:00. Repair each by naming the chronotype it depends on in the spec itself.

---

## Structure track — BACKLOG-509

### Prior art

| What | Where | Use |
|---|---|---|
| The recipe router | `world/resource.ts` `structureRecipe` | the one function that changes |
| Generic spend | `world/resource.ts` `buildStructureFor` | untouched — it loops the recipe's own keys |
| The exclusive kind | `world/resource.ts` `ZONE_EXCLUSIVE`, `world/quarry.ts` `quarryKind` | never hard-code `'obsidian'` |
| The errand + routing | `world/quarry.ts` `quarryDest`, `world/distance.ts` `hopToward` | the promotion reuses it whole |
| The tier chain | `WorldScene.scarcityDestOf` (6412) | one new conditional, above `richest` |
| The lens model | `ui/lenses.ts` `zoneMapModel` / `ZoneMapEntry` | one new field, same shape as `want` |

### Files

1. **`game/src/world/resource.ts`**
   - `export const TITHE = 1;`
   - `structureRecipe(zone)` — after picking the base recipe, return `{ ...base }` plus the exclusive kind
     at `TITHE` **unless** `zoneStructure(zone) === 'beacon'`. Read the kind from `ZONE_EXCLUSIVE`, not a
     literal, so a park that moves the stake moves it once. Note in the comment that `GRANARY_RECIPE`'s
     own shard is deliberately not stacked on top of this.
   - New `export function recipeShortfall(pile, zone): Partial<Record<ResourceKind, number>>` — per-kind
     deficit against `structureRecipe(zone)`, kinds at or over requirement omitted. This is the single
     derivation both the lens read and the tier promotion use, so neither carries a second copy of the
     recipe. (BACKLOG-519's lesson, applied before it can happen again.)
   - `export function shortOnlyTithe(pile, zone): boolean` — the shortfall is exactly the exclusive kind
     and nothing else. The promotion rule, named once.

2. **`game/src/world/resource.test.ts`** (existing) — the recipe assertions, the Ridge exemption, the
   `buildStructureFor` defer, `recipeShortfall`, and `shortOnlyTithe` both ways (true for a ground short
   only the shard, false for one also short a branch — 503's finding, pinned).

3. **`game/src/ui/lenses.ts`** — `ZoneMapEntry.short?: string` (`'wants 🌑◂Ridge'`-shaped, built from
   `recipeShortfall`; `undefined` when the ground can afford its next structure), a `shorts` parameter on
   `zoneMapModel` defaulting to `{}` so every existing caller and test literal stays valid.

4. **`game/src/scenes/WorldScene.ts`**
   - `zoneMapEntries()` passes a `zoneShorts()` map built off `recipeShortfall(this.pileFor(z), z)`.
   - The map-box text gains the `short` line beside the existing `want` line.
   - `scarcityDestOf` (6412): between the frontier tier and the richest tier, insert
     `if (shortOnlyTithe(this.pileFor(home), home)) { const q = this.quarryDestOf(home); if (q) return q; }`
     with a comment naming 503's finding and why this narrower promotion does not reproduce it.

5. **`tests/e2e/cycle-146-tithe.spec.ts`** *(new)* — frame one, fresh save, no clock move: `__zoneMap()`
   shows the Bowl short of obsidian and the Ridge not.

### Test plan

Unit: the recipe table, the exemption, the defer, the two new pure helpers. e2e: the frame-one lens read.
The promotion is asserted at the unit level via `shortOnlyTithe` plus a `__quarryDest` hook check rather
than by waiting on a walk, per the design.

### Expected fallout

Every spec that seeds a pile covering `CRAFT_RECIPE`/`SHELTER_RECIPE`/`THATCH_RECIPE` and then expects a
build. Cycle 142's milder change cost thirteen e2e specs; expect more. Repair by seeding the shard in the
spec, out loud.

### Rider

BACKLOG-519 — `export const MINUTES_PER_DAY` in `clock.ts`, import in `reachability.ts`, drop the local
`24 * 60`. Take it last, only on a clean tree.

---

## Shipped

**Gates:** `npm run build` clean · **2310 unit green** across 224 files · **633 e2e green**, with one
catalogued load flake (`cycle-038-scan`, green 5/5 isolated) and the standing `mobile-minds` red (515).

### Lore track — BACKLOG-109, as planned

`world/chronotype.ts` + its 12-test spec, the ladder's new top rung, the two glyph slots, the book line,
three dev hooks, and `tests/e2e/cycle-146-hours.spec.ts` (4 tests). The derivation and the windows are
exactly the design's; nothing was retuned.

One thing the plan did not anticipate and the code decided: **the cold-night system (179) keeps reading the
*park's* night, not any dino's own window.** `denTime` survives as a local for it. A cold night is a fact
about the weather rather than about who chose to sleep through it — the owls are out in the same cold — and
179's morning resolution still asks who was too loosely bonded for the den.

### Structure track — BACKLOG-509, plus one thing the plan missed

`TITHE`, the tithed `structureRecipe`, `recipeShortfall`, `shortOnlyTithe`, `quarry.shortfallLine`, the
lens `short` row, the errand promotion, `__pilesByZone`, 16 unit tests and
`tests/e2e/cycle-146-tithe.spec.ts`.

**`shortOnlyTithe` needed a guard the plan did not have, and its own test found it.** On the Ridge with an
empty pile the shortfall is `{obsidian: 3}` — the beacon's whole recipe — so the predicate read the source
ground as owing itself a tithe. Harmless in the world (`quarryDest` returns null for a ground standing on
itself) and wrong on the page, so the source ground now returns false explicitly.

**And one real regression the fallout surfaced, which is the best finding of the fire.** `WORK_BUILD_FLOOR`
was the literal `6`, with a comment saying it sat "above the cairn recipe". The tithe raised a cairn from 5
to 6, so no affordable pile could be under the floor any more and the gather-first defer went **unreachable**
— a system made inert by another system's constant, which is the CHARTER v7 corollary in miniature. It is
now derived from `structureRecipe()`'s own total, so the comment and the number cannot disagree again.

### Spec repairs — nine, each making an assumption explicit

Three unit (083, 088, 093 — identity `toBe` against a base recipe that is now composed) and six e2e:

- **064 craft, 074 shelter, 093 thatch, 121 work-priority** — the shard banked or seeded out loud, because
  these specs are about what gets built and a build now costs a climb.
- **142 obsidian** — the important one. Its "a neighbour genuinely better off still outranks the errand"
  case carried a Grove pile of `{branch:6, stone:6}`, which after the tithe is *short only the shard* — so
  it would have exercised 509's promotion instead of 503's ordering. The pile is now short of two kinds, so
  it still tests what it was written to test, and **a new case was added** asserting the promotion itself
  from both sides.
- **047 warmth, 125 lean** — the hours named. Both drove a dino across the ground and both were standing at
  08:00, which is now inside the owls' rest window; they now say `__setClock(_, 16, 0)` and say why (16:00
  is the one stretch every chronotype is awake in every season). 047's meal test additionally stopped
  depending on **who wins a seeded scramble** — a sleeping dino consumes no wander rolls, so cycle 146
  shifted the stream and the race landed elsewhere. It now names its eater through the deterministic
  `__eat` hook 375 added for exactly this, which is what it was always actually asserting.

That last one is BACKLOG-456's catalogue getting a new entry, and the hour-naming ones are BACKLOG-495's
argument applied to time — which is the shape 515 says the fix wants.

### Rider — BACKLOG-519, taken

`MINUTES_PER_DAY` exported from `clock.ts` and imported by `reachability.ts`; the register's second copy of
the length of a day is gone. `SESSION_MINUTES` was left in `reachability.ts` — it is a claim about what
*watchable* means, which is the register's own fact, not the clock's.
