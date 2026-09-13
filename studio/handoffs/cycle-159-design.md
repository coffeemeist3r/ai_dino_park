# Cycle 159 — Design

Milestone 20, arc 1 of each track. Both tracks are about the hatch, from opposite ends: the lore track
asks whether a dino will eat what landed, the structure track asks whether there was anything to land.
The seam where they meet is specified once, below, and both tracks obey the same answer.

---

## Lore track — BACKLOG-070

**Item:** BACKLOG-070 `[emergent]` Picky vs. gobble — prickly (low-agreeableness) dinos refuse
non-favorite food and leave it; warm dinos eat anything. Personality shapes who'll settle, not just who
rushes.

### Why this cycle

Every feeding beat in this park is about *who gets there first* — the rush, the escort, the yield, the
mercy, the gobble, the stand. Not one of them is about *whether the dino wants it*. `eatFood` has never
had a branch where the meal does not happen: a dino that reaches the food eats the food, and the only
thing its palate changes is which emoji flashes afterward. As of last cycle the keeper picks what comes
out of the hatch (067), which makes "the dino didn't want that" the single most useful thing the park
could start saying back. It is also the arc the other three lore arcs of Milestone 20 stand on: a menu
worth filling in (069) presumes a wrong dish matters, palate drift (068) presumes a dish a dino
currently *won't* have, and the witness (126) presumes there is something to envy.

### What ships

A dino that reaches a dropped piece of food may **turn it down and walk away, leaving the food on the
ground for somebody else**. Three things decide it, and all three are already in the park:

1. **Palate** — the piece is not this dino's favorite (`foodReaction(...).favorite === false`, the same
   read the 😋 uses). A favorite is never refused by anyone, ever.
2. **Temperament** — the dino is prickly: `agreeableness <= PICKY_AGREE` (0.4, the same cutoff the
   `prickly` pole of `describePersonality` and `brain.ts`'s `PRICKLY_MAX` use).
3. **Hunger** — it is not actually hungry: `hunger < PICKY_HUNGER` (0.5, the same bar `GOBBLE_HUNGER`
   uses). A genuinely hungry dino eats what it is given, whatever it thinks of it. This is what keeps
   refusal from colliding with the gobble: the gobbler pushes in *because* it is hungry, so a gobbler is
   never a refuser, by arithmetic rather than by a special case.

When a dino refuses: a 😑 flashes over it, the ticker says so by name and by dish, the dino files a
memory naming what it turned down, and **the food stays exactly where it is** — still landed, still
edible, still counted by everything downstream. The refuser is marked as having passed on *this piece*
and is skipped when the scene looks for an eater, so it wanders off instead of standing over a meal it
will not take. The next dino to reach the piece resolves normally — yield, mercy, gobble, stand, eat.

**What the player sees, in a fresh save, inside the first minute.** The founding bowl holds Rex
(agreeableness 0.02), Glade (0.09) and Mossback (0.22) against Sunny (0.62) and Twitch (0.93) — three
prickly, two warm, and that is the seeded roster as it has stood since cycle 1, not a tuning. Rex stands
three tiles from the hatch and has been first to almost every drop this park has ever made. Drop
anything that is not Rex's favorite and Rex now arrives, looks at it, and leaves. Sunny ambles over and
eats it. Nothing remotely like that has ever happened at this hatch.

### Acceptance criteria

- [ ] `refusesFood(agreeableness, isFavorite, hunger)` is a pure exported function in
      `game/src/world/feeding.ts`, unit-tested, true only when all three conditions hold.
- [ ] A dino's **favorite** food is never refused, at any agreeableness or hunger (unit test over the
      founding roster × all seven foods × all four seasons).
- [ ] A dino at `hunger >= PICKY_HUNGER` never refuses, at any agreeableness (unit test).
- [ ] `gobblesFood(h, a) === true` implies `refusesFood(a, false, h) === false` for all h, a (unit test
      — the two poles cannot both claim the same dino).
- [ ] e2e: with a non-favorite food dropped beside a forced-prickly, forced-unhungry dino, that dino
      reaches the food and does **not** eat it — `__food()` still returns the piece after the step.
- [ ] e2e: the refused piece is then eaten by a second, warm dino placed beside it — `__food()` returns
      null and the warm dino's friendship rose.
- [ ] e2e: a refuser does not refuse the same piece twice in a loop — the ticker carries exactly one
      refusal line for that dino for that piece across ten world steps.
- [ ] e2e: the refuser's remembered lines contain one naming the food it turned down.
- [ ] A new `__refused()` hook returns the last refusal `{name, foodId}` or null, mirroring
      `__lastStand` / `__lastGobble`.
- [ ] The founding roster in a fresh save contains at least one dino for which
      `refusesFood(a, false, foundingHunger)` is true — asserted in `reachability.ts` as a register
      entry for BACKLOG-070, so a later trait or threshold move that makes refusal dormant reddens
      `cycle-145-reachability.test.ts`.

### Out of scope

- **Palate drift** (068) — a refused food does not change the refuser's opinion of it. Next milestone arc.
- **The book** (069) — refusal is not recorded in the collection book this cycle.
- **The witness** (126) — nobody reacts to somebody else's refusal yet.
- **A refusal bubble / dialogue line.** The 😑 and the ticker line carry it; a spoken refusal is a
  `brain.ts` register change and belongs with 069/148.
- Refusing a **gift** (the `[` / `]` held item). Food only.

### Constraints

- `refusesFood` lives in `world/feeding.ts` and imports nothing from `game/src/ai/` — `PRICKLY_MAX`
  lives in `ai/brain.ts`, which imports `WebLLMBrain`, and pulling that into a pure Node-tested world
  module would drag the inference backend across the CHARTER's hard boundary. Declare `PICKY_AGREE = 0.4`
  locally with a comment naming the value it is pinned to, and add a unit test asserting the two are
  equal so a future move of one is caught.
- The refusal check goes in `checkFeeding`, **before** `yieldFoodTo` — a refuser is not a winner and
  must not be the subject of a yield, a mercy, or a stand.
- The "already refused this piece" set must be cleared in `dropFood` (a new piece is a fresh decision)
  and in `eatFood`. It is transient: **do not persist it.**
- Do not alter `reactionToFood`. Whether a dino *rushes* is unchanged; this is only about what happens
  when it arrives. A refusal after a rush is the funnier read and the cheaper diff.

---

## Structure track — BACKLOG-546

**Item:** BACKLOG-546 `[core]` The hatch draws on something — a keeper supply the drop spends from.

### Why this cycle

`dropFood` conjures a piece out of nothing, and it is the only food in this park that does. The granary
banks it, spoilage bleeds it, the ferry moves it, the tithe takes a cut, the plots grow it — and the
keeper's `H` creates it. That was invisible while the drop was a random handful. Now that the keeper
aims it (067), a free aimed drop is a menu rather than a decision, and the lore track above only means
something if the keeper can actually be *out* of the thing the picky dino wants.

### What ships

**The keeper's satchel** — a food stock the hatch spends from, visible on the brass, spent by `H`,
refilled by the day and by the harvest.

- A new pure module `game/src/world/satchel.ts`. The stock is a `FoodPile` (reuse
  `world/foodstore.ts`'s type outright — it is already `food id → count`, already capped, and
  `foodPileLine` already renders it). Do **not** invent a second pile type.
- **Founding stock, uneven on purpose:** `{ greens: 4, berries: 3, meat: 2, fish: 1 }`. The three farmed
  crops (roots, mushrooms, seeds) start at **0** — the keeper gets those by farming, which is what makes
  the plots part of this loop. Uneven because a flat handful of everything is a supply you never notice;
  this one is one meat-loving dino away from the interesting failure 546's own text names.
- **`H` spends.** The keeper's own drop decrements the chosen food by one. The loaded-feed HUD line
  carries the count — `Feed: 🌿 leafy greens ×4` — so the number ticking down *is* the feedback.
- **`H` on an empty stock drops nothing and says so.** A ticker line naming the food that is out. Never
  a silent no-op — the CHARTER's "no silent failures" line is the whole reason this criterion exists.
- **The random handful only rolls what you have.** With `FEED_AUTO` loaded, the roll is over food ids
  with a count above zero. An empty satchel makes `FEED_AUTO` the empty-handed case too.
- **The brass carries it.** A new optional `satchel` line on `plaqueLines`, rendered
  `Satchel · 🌿 4 · 🍓 3 · 🍖 2 · 🐟 1` via `foodPileLine`. Optional-means-absent, like every plaque line
  since 154, so no existing plaque literal in the suite moves.
- **Refills.** Two, both on existing seams: (1) the in-game day boundary tops the four staples back up
  to their founding counts, built as an `onHour` listener with a `lastSatchelDay` guard — a copy of
  `checkSpoilage` / `checkUpkeep`, including the boot-and-restore arming so a clock jump never fires a
  spurious pass; (2) a harvested crop banks one unit of its food id into the satchel, capped at
  `FOOD_STOCKPILE_CAP`.
- **Save:** one additive field, `satchel`. A save without it restores the founding stock.

**What the player sees, in a fresh save, inside ten minutes.** The brass reads
`Satchel · 🌿 4 · 🍓 3 · 🍖 2 · 🐟 1` from the first frame. Every `H` takes one off it, and the HUD line
counts down as it goes. Load meat, press `H` twice, and the third press tells you that you are out of
meat — with three greens still in hand and a dino at the glass that does not eat greens. That state is
two keystrokes away on day one, which is the whole point of shipping the founding stock uneven.

**Stated plainly, because the reachability bar asks for it:** the *day-boundary* refill is a
24-real-hour system at the shipping 1× clock, exactly like upkeep (480), spoilage (455) and the council
term (484), and it is unreachable in one sitting for exactly the reason BACKLOG-493 exists. It is not
the reachable half and is not claimed as one. The reachable half is the founding stock and its
depletion, both of which a player meets in the first minute.

### Acceptance criteria

- [ ] `game/src/world/satchel.ts` exports `FOUNDING_SATCHEL`, `satchelCount(pile, id)`,
      `spendFromSatchel(pile, id)` (returns a new pile, or `null` when the id is at zero),
      `refillSatchel(pile)` and `rollFromSatchel(pile, rand)` (a food id with stock above zero, or null).
      All pure, all unit-tested; the pile type is `FoodPile` imported from `foodstore.ts`.
- [ ] `spendFromSatchel` never mutates its argument and never produces a negative count (unit test).
- [ ] `rollFromSatchel` never returns a food id at zero, over 200 seeded rolls against a partial pile
      (unit test).
- [ ] `refillSatchel` tops each founding staple to its founding count and leaves a farmed crop's stock
      untouched (unit test).
- [ ] Pressing `H` with meat loaded decrements meat by one: `__satchel().meat` falls by 1 per drop.
- [ ] e2e: `__satchel()` on a fresh save deep-equals `FOUNDING_SATCHEL`.
- [ ] e2e: with meat at 0 and meat loaded, `H` produces **no** food (`__food()` stays null) and the
      ticker carries a line naming meat as out.
- [ ] e2e: the plaque text contains a line starting `Satchel · ` on a fresh save.
- [ ] e2e: the gift HUD's feed line contains the loaded food's current count.
- [ ] e2e: with `FEED_AUTO` loaded and only greens in stock, repeated keeper drops produce greens every
      time and never any other food.
- [ ] `__dropFood(col, foodId)` and the plot-harvest path **do not** spend the satchel — an explicit
      `foodId` bypasses it, the precedent `feedKind` already sets and states in its own comment.
- [ ] A save written before this cycle (no `satchel` field) loads and restores `FOUNDING_SATCHEL`;
      a save written after round-trips its stock exactly.
- [ ] A `reachability.ts` register entry for BACKLOG-546 whose founding fact is that the founding
      satchel is non-empty and holds at least one food at a count of 2 or fewer — so a later "make it
      generous" tuning pass that erases the interesting failure state reddens the register.

### Out of scope

- **Difficulty.** No hunger pressure, no starvation, no failure state for an empty satchel beyond not
  being able to drop. If a number under review makes the park *harder* rather than more *specific*, it
  is the wrong number.
- **Buying, trading, or begging for food.** The satchel refills from the day and from the harvest, full
  stop.
- **Drawing from the zone's own food pile** into the satchel. It is the obvious next seam and it is a
  follow-up, not this cycle.
- **The touch selector** (547) — a phone keeper still cannot change the loaded feed. Queued, next.

### Constraints

- Reuse `FoodPile`, `foodPileLine`, `foodAtCap` and `FOOD_STOCKPILE_CAP` from `world/foodstore.ts`.
  A second pile type for the same shape is the duplication the CHARTER's reuse rule exists to stop.
- The day-boundary refill must arm `lastSatchelDay` in both boot and `syncSeason`, exactly as
  `lastSpoilDay` does, or a restore fires a spurious refill.
- `plaqueLines`' new field is optional and appended in the existing order; pass nothing and the output
  is byte-identical.
- Save changes additive only.

---

## The seam between the two tracks — decided once, here

**A refused piece of food stays on the ground as ordinary settled food.** It is not returned to the
keeper's satchel, it is not deleted, and it is not specially marked. Any other dino may eat it, and the
piece is the same piece to every system downstream.

The reason, since both tracks had a claim on this: a drop you get refunded is a drop that cost nothing,
which is precisely the thing the structure track exists to end. If a refusal returned the food, `H` would
be free again whenever the keeper guessed wrong — the cheat restored through the back door, and the lore
track's whole point (a wrong guess is a wrong guess) erased in the same stroke.

**File overlap for the Coder — sequence, do not merge.** Both tracks land in `WorldScene.ts` and one of
them extends the save. They touch different regions:

| | Lore (070) | Structure (546) |
|---|---|---|
| pure module | `world/feeding.ts` (+ its test) | `world/satchel.ts` (new, + its test) |
| `WorldScene` region | `checkFeeding`, `eatFood`, a transient refused-set | `dropFood`, `feedKind`, `refreshGiftHud`, the plaque stats, a new `onHour` listener |
| UI | none | `ui/plaque.ts` |
| save | none | `satchel` (additive) |
| register | one entry | one entry |

Build the structure track first — it changes `dropFood`, which every lore-track e2e spec drives. Then
the lore track on top of it. Both add a `reachability.ts` entry; add them in one edit at the end rather
than twice.
