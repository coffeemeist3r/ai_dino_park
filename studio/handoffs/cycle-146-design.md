# Cycle 146 — Design

Two tracks. They share one theme (Milestone 17, *A day in the park*) and **no files**: the lore track
lives in a new `game/src/world/chronotype.ts` plus the movement ladder and the marks; the structure track
lives in `game/src/world/resource.ts`'s `structureRecipe` plus the specs that seeded piles. The only
shared file is `WorldScene.ts`, and they touch different methods in it. Build the lore track first — it
is the one with a new module — then the tithe, so the tithe's spec fallout lands against a settled tree.

---

## Lore track — BACKLOG-109

**Item.** BACKLOG-109 [emergent] Diurnal vs. nocturnal temperament — a dino's energy/curiosity seeds
whether it is a day-dino or a night-owl; night-owls are up while the rest are down.

**Why this cycle.** Queued at cycle 28 and never picked, for an honest reason: with a 24-real-hour
in-game day it was a feature nobody could stay awake for. `ACTIVE_SCALE = 60` retired that objection at
cycle 137 and the park has had a 24-minute day for eight cycles without a single dino behaving
differently at either end of it. Five wake together and five sleep together, because the schedule
belongs to the clock and not to them. That is the sameness the CHARTER's Living-minds line calls a
defect, sitting on the largest reachable surface the studio has built and never spent.

### The reachability answer, decided here so the Coder cannot soften it

*In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

A fresh save opens at **day 1, 08:00**, in the Bowl. At 60x that is twelve real minutes to nightfall —
**outside** the ten-minute window the bar is measured in. So an item that only reads after dark is an
item tuned to be dormant, and the corollary says that is a defect, not a subtlety. Therefore:

> **The split must read at 08:00, on frame one, in the Bowl.** At the moment the game opens, the Bowl's
> night-owls are still down — a doze mark, not moving — while the Bowl's day-dinos are already up and
> about. The night half of the same table is the bonus the player gets for staying twelve minutes, not
> the feature.

This constrains the trait rule below, and the constraint is load-bearing: **the derivation must put at
least one owl in the Bowl's five.** It does, and the Coder must pin that with a test rather than trust it.

### The derivation (fixed here — the Code-planner may not retune it)

Owlishness is mostly *curiosity* and partly *calm*: the dino that stays up is the one with something it
wants to look at and no great hurry about the morning.

    owlishness(p) = p.curiosity * 0.65 + (1 - p.energy) * 0.35
    chronotype(p) = owlishness(p) >= 0.5 ? 'owl' : 'day'

Against the ten name-seeded roster traits this yields **4 owls / 6 day-dinos**, and the nearest dino on
each side of the line clears it by ~0.05 — symmetric margins, so no roster member is a coin flip:

| | owls | day-dinos |
|---|---|---|
| Bowl | **Rex** (.555) | Mossback (.422), Sunny (.312), Twitch (.285), Glade (.418) |
| elsewhere | Pip (.598), Thornback (.747), Ember (.750) | Bramble (.447), Murk (.139) |

**Rex is the founding park's owl, and Rex spawns in the Bowl at (10, 7)** — the most prominent dino in
the game, asleep at eight in the morning while the other four are up. That is the frame-one read, and it
is the reason this rule and not a bare "curiosity greater than energy" (which puts Mossback within 0.001
of the line).

### The windows

A chronotype selects *which window a dino rests in*, not whether it rests. Total sleep is unchanged.

- **Day-dino** goes to today's `SEASON_HUDDLE[season]` window exactly (spring 21 to 05). Byte-identical.
- **Night-owl** goes to the same window **shifted +8 hours** (spring 05 to 13), so an owl is down through
  the morning and up through the night. The shift is applied to the season's own start/end so winter's
  longer night and summer's shorter one still shape both halves of the cast.

### What ships

1. **`game/src/world/chronotype.ts`** — pure, Node-testable, no Phaser: `owlishness`, `chronotypeOf`,
   `restWindow(chrono, season)`, `atRest(hour, chrono, season)`, and `chronotypeLine(chrono)` for the book.
2. **The movement ladder gets a new top rung.** `denTime` (one boolean for the whole cast, computed once
   per step) becomes per-dino `resting = atRest(hour, chronotypeOf(d.traits), season)`. Then:
   - `huddling = resting && maxBond >= huddleThreshold(season)` — unchanged in meaning; a bonded dino
     still walks to the den, now during *its own* window.
   - **A resting dino that is not huddling holds still** instead of falling through to wander. This is
     the half that makes the night legible: without it, an unbonded day-dino wanders at night and there
     is nothing to tell it from an owl.
   - `gathering` / `moping` / `socializing` / `wandering` all gain a `!resting` guard.
3. **Two marks, glyph-first** (the park's standing discipline: glyph ships, rig follows):
   - The sleep glyph over any **resting** dino in view — today's mark, with its `nearDen` requirement
     dropped, because an owl asleep at 08:00 in the open is the whole point and the den has nothing to do
     with it.
   - A new awake-at-night glyph over any dino awake during the park's night
     (`dayPhase === 'night' && !resting`) — which, by construction, is only ever an owl. It is the "only
     thing moving" read, and it is **BACKLOG-520's host**: the Artist draws `doze` and `rouse` against
     these two slots later tonight.
4. **The collection book carries the standing** — one line per dino, "keeps late hours" / "up with the
   sun", beside the existing per-dino reads. Legible on frame one without waiting for any hour.

### Acceptance criteria

- [ ] `chronotypeOf(seededPersonality('Rex'))` is `'owl'` and `chronotypeOf(seededPersonality('Sunny'))` is `'day'`
- [ ] Of the ten roster names, exactly 4 are owls (Rex, Pip, Thornback, Ember) and 6 are day-dinos
- [ ] **At least one owl spawns in the Bowl** — a test asserts this over the actual roster, not over a literal
- [ ] `atRest(8, 'owl', 'spring')` is true and `atRest(8, 'day', 'spring')` is false
- [ ] `atRest(23, 'day', 'spring')` is true and `atRest(23, 'owl', 'spring')` is false
- [ ] `restWindow('day', s)` equals `SEASON_HUDDLE[s]`'s start/end for all four seasons (day-dinos unchanged)
- [ ] `restWindow('owl', s)` is `SEASON_HUDDLE[s]` shifted +8h mod 24, for all four seasons
- [ ] e2e, fresh save, no clock manipulation: at 08:00 Rex is not moving and reads as resting, while at
      least one Bowl day-dino is moving and does not
- [ ] e2e: wind to 23:00 — at least one dino reads awake-at-night and at least one reads resting, in the
      same frame
- [ ] A resting, unbonded dino does not change tile across a step (it holds still, it does not wander)
- [ ] The collection book shows "keeps late hours" for Rex and "up with the sun" for Sunny
- [ ] Nothing new is written to the save — chronotype is re-derived from the name-seeded traits on load
- [ ] Full suite green under the cycle's gates; `@mlc-ai/web-llm` still imported only under `game/src/ai/`

### Out of scope

- The greeting knowing the hour, or a dino mentioning its own hours (Milestone 17 arc 3 — BACKLOG-110/279).
- The dawn stretch (BACKLOG-108) and the sleep murmur (BACKLOG-307) — arcs 1 and 2's follow-ups.
- Drawing the rigs. 520 is the Artist's, and it is queued with this item named as its host.
- Any change to `huddleThreshold`, the bond math, or the season table itself.
- Night-owls getting *different* behaviour while awake (a night gather, a night hunt). They wander the
  night the way anyone wanders the day; what changes is *when*, and that is the whole item.

### Constraints

- `chronotype.ts` must be pure — no Phaser import, no `getWorldClock()` inside it; the hour is a parameter.
- Deterministic and model-free: identical under `stub`. No `NPCBrain` involvement at all.
- Day-dinos in spring must keep today's behaviour exactly, bar the hold-still change; `inHuddleWindow`
  stays exported and unchanged (`huddle.ts` is not rewritten, it is read).
- **Expect e2e fallout** in specs that assume a uniformly-asleep or uniformly-awake cast. Repair each by
  making the assumption explicit in the spec that depends on it — that is BACKLOG-495's argument, and
  every instance found is worth one line in the verdict.

---

## Structure track — BACKLOG-509

**Item.** BACKLOG-509 [core] The tithe — one obsidian folded into every ground's structure recipe but
the Ridge's, so no skyline anywhere in the park goes up without somebody having made the climb.

**Why this cycle.** 503 gave the Ridge an exclusive resource and gave exactly two things a reason to want
it — the Ridge's own beacon and one unit of `GRANARY_RECIPE`. A ground that has fetched one shard has no
reason to fetch a second, and a park with a granary everywhere has no reason to climb again ever. The
tithe is the version with teeth, deferred on purpose at cycle 142 with the measurement attached.

### The reachability answer

*What does the player see that they could not see before?* **A dino leaving its ground and climbing to
the Ridge, on a fresh save, before the first landmark in the park goes up.**

That is not decoration and it is not free — it is the whole risk of this item, and the design traced the
mechanism before writing the criteria rather than after. **The first trace failed, and the correction is
the most important paragraph in this handoff.**

The obvious claim was that folding obsidian into `structureRecipe` is enough on its own, because
`directedCarry` (356), `pressuredCarry` (429) and `barterSwap` (358) all read that recipe as their deficit
driver. Reading them, it is not enough, twice over:

- `directedCarry` only proposes a kind the **source** ground actually holds (`src[k] > 0`). Only the Ridge
  holds obsidian, so the tithe makes the shard a deficit everywhere and a *carry* only where somebody is
  already coming down off the Ridge. That is a delivery, not a climb.
- The climb itself already exists — `quarryDest` (503) — and it is the **last** tier of `scarcityDestOf`,
  under the unsettled-frontier pull and under any neighbour with better appeal. On a fresh save the
  Saltpan is unsettled, so the frontier tier wins, and the errand is the thing that happens when nothing
  else is pulling. 503 put it there deliberately: promoting it unconditionally "made every migration an
  errand and took the scarcity system dormant", which is the same defect from the other side.

So the recipe change alone would have shipped a cost nobody pays and a climb nobody takes. The tithe needs
two more pieces, and both are in scope:

> **The shortfall must be visible, and the errand must be able to win when it is the only thing left.**

### What ships

1. **`structureRecipe(zone)` returns the zone's base recipe plus one obsidian** for every structure that
   is **not** the beacon. The Ridge is exempt because it is the source; a ground tithing to itself is a
   rounding error dressed as a rule. Export the tithe as a named const (`TITHE`), not a bare literal, and
   spend it through the same key loop `buildStructureFor` already runs.

2. **The ground says what it is waiting on.** The zone-map lens entry gains a `short` read — the kinds a
   ground's own next structure is missing, named, with the tithe called out as coming from the Ridge. On a
   fresh save every non-Ridge ground reads as waiting on black glass **on frame one, with no walk and no
   wait**, which is this track's floor under the reachability bar and the part that cannot fail to be
   reachable. Derived from `structureRecipe(zone)` and the live pile — no second copy of the recipe.

3. **The errand gets promoted, but only when it is the sole remaining shortfall.** In `scarcityDestOf`,
   the quarry errand moves above the richest-neighbour tier **only when obsidian is the only kind this
   ground's structure recipe still lacks** — a ground standing there with everything but the shard. A
   ground short of two kinds still migrates on appeal exactly as it does today, so 503's finding holds and
   the scarcity system stays live. This is the tier that turns a banked pile into a watched climb.

4. **`GRANARY_RECIPE` keeps its existing single obsidian** and is not doubled — the granary already pays
   a shard and it is a different recipe on a different path. Say so in a comment so a future cycle does
   not "fix" the inconsistency by stacking them.

5. **No founding-state seeding.** The fresh park's piles are untouched.

6. **Spec repair.** Every spec that seeded a pile which used to afford a structure and now does not gets
   the shard seeded *out loud*, in the spec that depends on it.

**QA tests for the visible shortfall, which is guaranteed, and for the promotion rule directly, which is
the mechanism.** The climb itself depends on a ground banking its other kinds first and is therefore
timing-dependent; QA asserts the tier resolves to the Ridge for a ground short only the shard, rather than
asserting a walk completes inside a fixed window.

### The two questions cycle 142 left open — answered

1. **Do the founding grounds ship a free shard? No.** They start at zero obsidian and the first landmark
   in a fresh park is earned by a climb the player watches. Founding every ground pre-paid is precisely
   tuning the tithe so the shipping park never pays it, which CHARTER v7's corollary calls a defect.
2. **Does an unpaid tithe defer a build or fail it? Defer.** `buildStructureFor` already returns `null`
   on an unaffordable pile and every caller already reads that as "not yet". Reuse that path exactly.
   Do not invent a second way for a build not to happen.

### Acceptance criteria

- [ ] `structureRecipe(BOWL_ID).obsidian` is 1, and likewise for the Grove and the Fernreach
- [ ] `structureRecipe(RIDGE_ID)` carries no obsidian beyond `BEACON_RECIPE`'s own 3 — the Ridge does not tithe
- [ ] `structureRecipe(undefined)` (the back-compat default) carries the tithe like any other ground
- [ ] `buildStructureFor(pile, BOWL_ID)` returns null for a pile covering `CRAFT_RECIPE` but holding no obsidian
- [ ] The same call with one obsidian added succeeds and the returned pile has obsidian back at 0
- [ ] `directedCarry` / `pressuredCarry` / `barterSwap` name obsidian as the shortfall for a non-Ridge ground
      holding none — asserted directly, since this is the mechanism the reachability answer rests on
- [ ] `GRANARY_RECIPE.obsidian` is unchanged at 1
- [ ] A fresh save is not seeded with obsidian on any non-Ridge ground
- [ ] The zone-map lens names the shortfall: on a fresh save every non-Ridge ground reads as short of
      obsidian, and the Ridge does not
- [ ] e2e, fresh save, frame one, no clock manipulation: the zone map shows the Bowl waiting on the shard
- [ ] The errand promotion is exact — a ground short **only** obsidian routes toward the Ridge; a ground
      short obsidian **and** another kind still routes on appeal (503's finding holds)
- [ ] Every spec reddened by this change is repaired by making its pile assumption explicit, not by
      weakening an assertion
- [ ] Full suite green under the cycle's gates

### Out of scope

- Changing `CRAFT_RECIPE`, `SHELTER_RECIPE`, `THATCH_RECIPE` or `BEACON_RECIPE` themselves.
- Any new failure mode for a build. Deferral is the existing null return.
- A tithe that scales with structure count, or a per-ground exemption beyond the Ridge's.
- BACKLOG-495's fixture. The spec repairs here are one-at-a-time on purpose; they are evidence *for*
  495, and the verdict should count them.

### Constraints

- Additive save only. Piles are already a partial record; an old save with no obsidian key reads as 0 and
  simply defers its next build until a shard arrives. Nothing migrates.
- `resource.ts` stays pure. No Phaser, no clock.
- **Rider, optional, non-gating:** BACKLOG-519 — export `MINUTES_PER_DAY` from `clock.ts` and import it in
  `reachability.ts` instead of the local `24 * 60`. One line each. Take it if the tree is clean; it does
  not affect this track's verdict either way.
