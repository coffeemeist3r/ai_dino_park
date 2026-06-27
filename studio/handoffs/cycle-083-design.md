# Cycle 83 — Design

Two file-disjoint tracks. Lore = BACKLOG-375 (generous feeder); Structure = BACKLOG-377
(zone-distinct craft). Pure logic in `world/*.ts`, thin WorldScene glue, no save-format change.

---

## Lore track — BACKLOG-375 Generous feeder

**What.** When the keeper drops food and a dino reaches it, a *well-fed* winner standing beside a
*hungrier, high-bond* friend in the swarm gives up the meal and lets the friend eat first. The
need-drive (371) shapes a small act of kindness between dinos — the first generosity that costs the
giver something (it forgoes a friendship gain it would otherwise bank). A dino *acting* from its
state, per Living minds.

**Mechanic.** Today `checkFeeding` feeds the first dino to reach the food (`eatFood(eater)`). 375
inserts a yield check: before the winner eats, look at the dinos clustered near the food (the swarm),
and if the winner is well-fed (hunger ≤ `WELL_FED`) and a qualifying friend is present (bond ≥
`GENEROUS_BOND` AND at least `HUNGRIER_BY` hungrier than the winner), the *friend* eats this drop
instead. The winner files a generous memory, gets a small bond bump with the friend (kindness
deepens the tie), and flashes a 🤝 beat. Pure decision in `feeding.ts`; WorldScene supplies the
swarm candidates (hunger + bond) and applies the outcome.

**Pure helper (`world/feeding.ts`).**
```
WELL_FED = 0.3        // hunger at/below which the winner doesn't need this meal itself
GENEROUS_BOND = 40    // bond at/above which a dino will yield to that friend
HUNGRIER_BY = 0.25    // the friend must be at least this much hungrier to be worth yielding to
SWARM_RADIUS = 4      // tiles from the food — who counts as "beside" the winner
yieldFoodTo(winner, winnerHunger, candidates: {name, hunger, bond}[]): string | null
  // null when the winner is hungry (> WELL_FED) or no candidate qualifies → winner eats as before.
  // else the hungriest qualifying friend (tie → highest bond). Deterministic.
```

**WorldScene glue (`checkFeeding`).** After finding the `eater` near the food, build `candidates`
from in-view dinos within `SWARM_RADIUS` tiles of the food (`{name, hunger: needs[n].hunger ?? 0,
bond: bondPoints(bonds, eater, n)}`), call `yieldFoodTo(eater.name, eaterHunger, candidates)`. If it
returns a friend name → resolve the meal on the friend (`eatFood(friend)`), then mark the winner's
generosity: `remember(winner, "you stepped back and let <friend> eat first")`, `strengthen(bonds,
winner, friend, GENEROUS_BOND_BUMP)`, `flashFeed(winner, '🤝')`, a `logEvent`. Else `eatFood(eater)`
unchanged. Dev hooks: `__yieldFood()` (last {giver, eater} or null), `__feedYield(name)` to force a
named winner for the e2e.

**Acceptance criteria (375).**
1. `yieldFoodTo` returns null when the winner is hungry (hunger > WELL_FED), even with a hungrier high-bond friend present — a hungry dino keeps its own meal. (unit)
2. `yieldFoodTo` returns null when no candidate clears both bars (bond < GENEROUS_BOND, or not HUNGRIER_BY hungrier) — generosity is selective. (unit)
3. With a well-fed winner and a qualifying friend, `yieldFoodTo` returns that friend; on a multi-candidate swarm it picks the hungriest (tie → highest bond), deterministically. (unit)
4. End-to-end: a well-fed dino reaches a drop beside a hungrier high-bond friend → the *friend* gets the meal (its hunger resets to 0, its friendship rises), the winner does not eat, and the winner↔friend bond rises. (e2e)
5. The generous winner files a "let <friend> eat first" memory and flashes 🤝; `__yieldFood()` reports the {giver, eater} pair. (e2e)
6. No qualifying friend → the winner eats exactly as before (cycle-025/061 feeding behavior byte-identical; favorite/comfort/cold-warm paths untouched). No save-format change. (unit + e2e)

---

## Structure track — BACKLOG-377 Zone-distinct craft

**What.** Each zone builds the structure its resource bias (348) favors, so the two zones' built
landscapes diverge. The stone-rich **bowl** stacks 🗿 cairns; the branch-rich **grove** raises 🛖
lean-tos. Today both zones run the identical cairn→(after 3)→lean-to escalation (286/315), so the
skylines are interchangeable. 377 replaces the per-zone escalation with a bias→structure choice: a
zone builds *one* landmark type, set by its `ZONE_BIAS` kind.

**Mechanic.** `checkGather` currently: if a zone has ≥ `SHELTER_AFTER_CAIRNS` cairns and no shelter,
it saves toward a lean-to; else it stacks a cairn. 377 swaps that branch for `zoneStructure(zone)`:
a stone-biased zone always crafts a cairn (`craft`/`placeCairn`), a branch-biased zone always builds
a lean-to (`buildShelter`/`placeShelter`). The `craft`/`buildShelter` pile-math helpers and the
recipes are unchanged. `directedCarry` in `crossDino` now ferries toward the *destination zone's*
structure recipe (via its existing `recipe` param, 356), so a grove short of stone for its lean-to
pulls stone, and a bowl short of branch for its cairn pulls branch.

**Pure helpers (`world/resource.ts`).**
```
type Structure = 'cairn' | 'shelter'
STRUCTURE_BY_BIAS: Record<ResourceKind, Structure> = { stone: 'cairn', branch: 'shelter' }
zoneStructure(zone?): Structure         // ZONE_BIAS[zone] → structure; unbiased/unknown → 'cairn' (286 default)
structureRecipe(zone?): Partial<Record<ResourceKind, number>>  // CRAFT_RECIPE for cairn, SHELTER_RECIPE for shelter
```

**WorldScene glue.** `checkGather` build block → `if (zoneStructure(zone) === 'shelter') {
buildShelter / placeShelter } else { craft / placeCairn }`. `crossDino`: `directedCarry(pileFor(home),
pileFor(dest), structureRecipe(dest))`. Dev hook: `__zoneStructure(zone)`.

**Acceptance criteria (377).**
1. `zoneStructure('bowl')` === 'cairn', `zoneStructure('grove')` === 'shelter'; an omitted/unknown zone → 'cairn' (286 back-compat). `structureRecipe` returns CRAFT_RECIPE for the bowl, SHELTER_RECIPE for the grove. (unit)
2. End-to-end: banking a cairn's worth in the **bowl** stacks a 🗿 cairn (as cycle-064) and never a lean-to, no matter how many cairns accrue — the bowl's landmark is the cairn. (e2e)
3. End-to-end: banking a lean-to's worth ({branch:6, stone:4}) in the **grove** raises a 🛖 lean-to and never a cairn — the grove's landmark is the lean-to. (e2e)
4. `directedCarry` is called with the destination zone's structure recipe, so a crossing into the grove ferries toward {branch:6, stone:4} and a crossing into the bowl toward {branch:3, stone:2}. (unit on directedCarry with each recipe; e2e carry still lossless/conserved per cycle-077.)
5. The cairn pile-math (286) and shelter pile-math (315) helpers are byte-identical; only the *selection* per zone changes. The cycle-074 shelter spec is updated in-fire to the 377 truth (the grove raises the lean-to, the bowl stays cairns) — the now-unused `SHELTER_AFTER_CAIRNS` escalation assertion is dropped. (unit + e2e)
6. No save-format change; cairns/shelters still persist + zone-scope as before (308). web-llm boundary untouched. (e2e)

---

**Disjointness.** 375 touches `feeding.ts` + `checkFeeding` (+ bond/needs reads). 377 touches
`resource.ts` + `checkGather`/`crossDino`. Different modules, different WorldScene methods. The
Coder can build both in one fire without collision.
