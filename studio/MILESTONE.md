# Milestone

> One player-visible headline goal spanning ~5 cycles. Cycles serve this file:
> the smiths pick BACKLOG items that advance the checklist first. The Validator
> marks arcs `[x]` as their items ship and declares the milestone SHIPPED when
> the checklist closes (big chronicle entry). Then the smiths draft the next one
> here — Lore-smith writes the headline + feel arcs, Structure-smith the spine arcs.

## Current milestone

**Milestone 6: No zone stands alone**
**Status:** ACTIVE (opened cycle 106)

Milestone 5 taught a zone to store and spend for *its own*. Milestone 6 makes the three-zone chain
one economy instead of three parallel ones: banked food ferried from plenty toward need, mouths that
move toward the richer ground, a provider who emerges as the one keeping a pantry full, and the map
generalized so a fourth zone is a table row, not three new code branches. You should be able to watch
a dino carry a berry across the edge because the neighbour ran short — and feel the courier's pride in it.

**Lore arcs:**
- [x] The courier's pride — a dino that ferries banked food across a zone edge to a hungrier neighbour keeps a "carried food to <zone>" memory and greets the keeper a beat prouder for it (BACKLOG-451)
- [x] Homecoming from the road — a dino that migrated away and later returns to its home zone resettles ("back where it belongs") and the residents it left greet its return (BACKLOG-452)
- [ ] Word of the provider — once a provider role emerges (448), a dino names it in gossip/greeting ("the Fernreach eats because of Sunny"); the pantry-keeper's standing surfaces in voice (BACKLOG-453)

**Structure arcs:**
- [x] Food flows between zones — a crossing dino ferries banked food from a glutted zone toward a lighter neighbour, making the demand read (438) an actual mover (BACKLOG-447)
- [ ] Scarcity moves the herd — the migration decision biases by prosperity index + food store, so mouths move toward plenty (BACKLOG-450)
- [x] The provider role — the dino that banks the most harvest into its zone's store emerges with a persistent `provider` role tag (BACKLOG-448)
- [ ] One terrain per zone, as data — fold each zone's ground into a per-zone terrain descriptor on the ZONES table; a fourth zone becomes a row, not three branches (BACKLOG-449)

### Format (use this when drafting)

```markdown
**Milestone N: <player-visible headline>**
**Status:** ACTIVE (opened cycle NNN)

**Lore arcs:**
- [ ] <arc — one sentence of observable behavior> (BACKLOG-NNN, -NNN)
- [ ] <arc> (BACKLOG-NNN)

**Structure arcs:**
- [ ] <arc> (BACKLOG-NNN)
- [ ] <arc> (BACKLOG-NNN)
```

## Shipped milestones

### Milestone 5: No one goes hungry — SHIPPED cycle 105 (opened cycle 103)

The hunt got stakes in Milestone 4; Milestone 5 made the bowl's *plenty* reach the mouths that need it.
A harvest used to drop, be eaten, and be gone — nothing banked, so a zone rich in crops could not feed a
starving neighbour, thirst slaked at exactly one puddle in a three-zone chain, and a dino withdrawn at the
wall simply missed every meal, because nothing in the park was capable of noticing. The gap closed from
both ends. The economy learned to *store* (a share of every harvest banks per zone, 446) and then to
*spend* — a starving resident is fed from its own zone's pantry, its favorite if the zone happens to have
banked it (444), the first time in a hundred cycles that this park's two machines, the economy and the
needs, touched at all. Water reached every zone (445), retiring a two-thirds-dead branch inside a shipped
feature and finally giving the Fernreach's long-drawn creek something to be *for*. And the cast learned to
feed each other: two dinos eating side by side bond over the shared meal (373), a dino that went to bed
hungry breaks the morning with it in a voice shaded by its own temperament (376), and a withdrawn loner —
the dino with nobody, the one the whole system was built to miss — gets fetched, the closest thing it has
to a friend turning its back on the food to walk out and bring it in (381). If it has nobody at all, nobody
comes, and it stands at the edge while the park eats; that silence is the arc's sharpest read. Minds (M1) →
a home ground (M2) → a ground that feeds them (M3) → a ground where eating has stakes (M4) → **a ground
that provides for its own** (M5). Deathless by design; mortality stays an operator call.

**Lore arcs:**
- [x] Ate together — two dinos that feed side by side within a short window bond over the shared meal, communal feeding made a moment (BACKLOG-373 — cycle 103)
- [x] Woke hungry — a dino already over its hunger threshold at dawn plays a visible wake-hungry beat instead of a plain stretch (BACKLOG-376 — cycle 104)
- [x] Brought to the hatch — a withdrawn loner's closest friend nudges it in from the edge to the food so it doesn't miss the meal (BACKLOG-381 — cycle 105)

**Structure arcs:**
- [x] A zone banks its harvest — a share of each harvest banks into a per-zone food stockpile, capped and read on the lens; the missing spine under both the demand read (438) and a carrier that feeds the hungry (BACKLOG-446 — cycle 103)
- [x] A carrier feeds the hungry — a zone's banked food can be spent to resolve a starving resident's hunger when no keeper drop comes, closing the loop between economy and need-drive (BACKLOG-444 — cycle 104)
- [x] The waterhole — the bowl and Fernreach get their own water source so all three zones slake thirst locally, the water mirror of per-zone crops (BACKLOG-445 — cycle 105)


### Milestone 4: The hunt has weight — SHIPPED cycle 102 (opened cycle 100)

The food web woke in Milestone 3 as a chase that always came up empty; Milestone 4 gave it *consequence*.
A stalk now occasionally feeds the hunter — hunger resolves through hunting, not only the keeper's hatch
(437) — and a dino whose need is pressing finally *seeks* relief, leaning its wander toward the hatch or the
grove pond instead of just wearing the 🍖/💧 (436). The prey got a voice and a memory: one that just
slipped a hunt greets the keeper still shaken, naming its chaser (440), and a herbivore chased twice by the
same carnivore grows wary of *that* dino specifically, startling from it even off an active hunt (442). The
economy learned to *ask* — a zone light on a crop it can't grow points its carry-request at the neighbour
out-growing the rest (438) — and the whole food web now reads in the collection book: a carnivore's catches,
a herbivore's escapes (443). Minds (M1) → a home ground (M2) → a ground that feeds them (M3) → **a ground
where the eating has stakes** (M4). Still deathless by design; mortality stays an operator call.

**Lore arcs:**
- [x] Rattled after the chase — a dino that just slipped a hunt greets the keeper still shaken, naming who chased it (BACKLOG-440 — cycle 100)
- [x] The hunter's reputation — a herbivore chased by the same carnivore repeatedly grows warier of *that* dino specifically (BACKLOG-442 — cycle 101)
- [x] Predator/prey in the book — the collection book reads each dino's food-web standing: a carnivore's catches, a herbivore's escapes (BACKLOG-443 — cycle 102)

**Structure arcs:**
- [x] The hunt feeds — a successful stalk (occasional, deathless) fills the hunter; hunger resolves through hunting (BACKLOG-437 — cycle 100)
- [x] A zone wants what it can't grow — a zone light on a food kind its plot can't grow biases its carry-request toward a neighbour that can (BACKLOG-438 — cycle 101)
- [x] Need pulls the body — a pressing-need dino biases its wander toward the hatch (hunger) or pond (thirst) (BACKLOG-436 — cycle 102)

### Milestone 3: Enough to go around — SHIPPED cycle 99 (opened cycle 97)

The three-zone chain stopped merely *reading* as three places (Milestone 2) and started *providing* like
one economy: banked resources flow toward the zone that needs them instead of piling forever in one (429),
all three zones farm their own crop (432), and each zone's yield reads on its own (433). And the dinos came
to live inside that economy as hungry mouths and providers — hunger surfaces in a dino's own voice (368),
giving way to a hungrier friend became a remembered, repaid kindness (385/386), and the food web finally
woke with its first hunt: a hungry Twitch stalks, a herbivore flees, and the chase comes up empty — deathless
(367). Milestone 1 gave the dinos minds; Milestone 2 gave them a home ground; Milestone 3 made that ground
*feed them*.

**Lore arcs:**
- [x] Hunger you can hear — a dino over its hunger threshold lets the need slip in its own greeting/gossip line (BACKLOG-368 — cycle 97)
- [x] The food web wakes — a hungry carnivore stalks the nearest herbivore, which flees; the bowl's first hunt, deathless (BACKLOG-367 + 435 diet split — cycle 99)
- [x] Provision remembered — a dino that yields a meal to a hungrier friend is repaid, gratitude leaving a trace between them (BACKLOG-385, -386 — cycle 98)

**Structure arcs:**
- [x] Resources flow toward need — a zone past its stockpile soft cap biases its carry outflow toward a lighter neighbour (BACKLOG-429 — cycle 97)
- [x] All three zones farm — the Fernreach gets its own plot and a third farmable crop, completing the farming divergence (BACKLOG-432 — cycle 98)
- [x] Each zone's harvest reads on its own — a per-zone harvest tally reads on the map lens beside the prosperity tier (BACKLOG-433 — cycle 99)

### Milestone 2: Places to belong — SHIPPED cycle 96 (opened cycle 93)

The three-zone chain stopped reading as one bowl with two tinted annexes: each zone became its own
*place* — its own crop in the ground (per-zone crops 418), its own built landmark on the skyline (three
skylines 417), a prosperity you can read at a glance (the index 428) — and the dinos started to
**belong** to one. A resident that stays put settles in and resists the ambient wander (341); a settled
dino aims its solitary tic at the edge a departed friend left by (414); a dino whose closest bond lives
a zone away grows homesick and drifts back (340). Milestone 1 gave the dinos minds; Milestone 2 gave
those minds a *home ground*.

**Lore arcs:**
- [x] A dino calls a zone home — settles in, resisting the ambient wander; where it belongs reads in the book (BACKLOG-341 — cycle 93)
- [x] The ache of a departed friend — a settled dino aims its solitary tic at the edge a close friend left by (BACKLOG-414 — cycle 94)
- [x] Homesick for a friend — a dino whose closest bond lives in another zone drifts back toward them (BACKLOG-340 — cycle 95)

**Structure arcs:**
- [x] Three skylines — the Fernreach raises its own woven-frond thatch, so the chain builds three different landmarks (BACKLOG-417 — cycle 93)
- [x] Per-zone crops — each zone's plot grows a crop suited to it, the farming half diverging like gathering already does (BACKLOG-418 — cycle 95)
- [x] A zone you can read — a derived prosperity index folds pile + crops + structures + heads into one tier, shown on the map lens (BACKLOG-428 — cycle 96)

### Milestone 1: Minds of their own — SHIPPED cycle 92 (opened cycle 90)

Come back after a week and the dinos are running their own lives: each one has an authored
persona, wakes up with an intention of its own that *changes across the day*, and the chain of
zones they live across is legible at a glance — all whole with zero download, and now landing on
a save that can grow. The operator's oldest standing nudge (route the brain into *decisions*, not
just speech) became the spine, deterministic floor intact throughout.

**Lore arcs:**
- [x] The brain leans on the wheel — a cached, async per-dino intent nudges what a dino *does* (BACKLOG-393 — cycle 90)
- [x] A self to lean with — per-dino persona authored from lore, generate-once/cache/persist, procedural fallback (BACKLOG-103 — cycle 91)
- [x] The day has a shape — persona-driven daily plan the world tick consults; minds act, not just reply (BACKLOG-012 — cycle 92)

**Structure arcs:**
- [x] The chain is legible — edge indicators name the neighbour zone before you cross (BACKLOG-398 — cycle 90)
- [x] The world at a glance — a zone-map lens: the whole chain, who lives where, from the adjacency table (BACKLOG-425 — cycle 91)
- [x] A save that can grow — versioned save envelope rooted at v0, the persistence spine personas/intents land on (BACKLOG-426 — cycle 92)
