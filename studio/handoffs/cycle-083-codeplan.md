# Cycle 83 — Code Plan

Both tracks: pure helpers + thin WorldScene glue, no new deps, no SAVE_VERSION bump. File-disjoint.

## Lore track — BACKLOG-375 Generous feeder

**Files**
- `game/src/world/feeding.ts` (+): constants `WELL_FED=0.3`, `GENEROUS_BOND=40`, `HUNGRIER_BY=0.25`, `SWARM_RADIUS=4`; pure `yieldFoodTo(winner, winnerHunger, candidates)`.
- `game/src/scenes/WorldScene.ts` (~): `checkFeeding` builds swarm candidates + applies yield; `GENEROUS_BOND_BUMP` const; dev hooks `__yieldFood`, `__feedYield`.
- `tests/unit/cycle-083-generous.test.ts` (+): AC 1–3, 6 (yieldFoodTo decision table; null-paths byte-identical).
- `tests/e2e/cycle-083-generous.spec.ts` (+): AC 4–6 (friend eats, winner doesn't, bond+memory+🤝, no-qualifier passthrough).

**`yieldFoodTo` logic.** `if (winnerHunger > WELL_FED) return null;` then filter candidates `c.name !== winner && c.bond >= GENEROUS_BOND && c.hunger - winnerHunger >= HUNGRIER_BY`, sort by `(b.hunger - a.hunger) || (b.bond - a.bond)`, return `[0]?.name ?? null`. Pure, deterministic, no Phaser.

**`checkFeeding` rewrite (WorldScene ~902).**
```
if (!this.food || !this.foodLanded) return;
const eater = this.dinos.find(d => this.inView(d) && reachedFood(this.tileOf(d), this.food!));
if (!eater) return;
const food = this.food;
const eaterHunger = this.needs[eater.name]?.hunger ?? 0;
const candidates = this.dinos
  .filter(d => this.inView(d) && cheby(this.tileOf(d), food) <= SWARM_RADIUS)
  .map(d => ({ name: d.name, hunger: this.needs[d.name]?.hunger ?? 0, bond: bondPoints(this.bonds, eater.name, d.name) }));
const friendName = yieldFoodTo(eater.name, eaterHunger, candidates);
if (friendName) {
  const friend = this.dinos.find(d => d.name === friendName)!;
  this.lastYield = { giver: eater.name, eater: friendName };
  this.bonds = strengthen(this.bonds, eater.name, friendName, GENEROUS_BOND_BUMP);
  this.memory = remember(this.memory, eater.name, `you stepped back and let ${friendName} eat first`);
  this.flashFeed(eater, '🤝');
  this.logEvent(`🤝 ${eater.name} let ${friendName} eat first`);
  this.eatFood(friend);
} else {
  this.lastYield = null;
  this.eatFood(eater);
}
```
`cheby` = inline `Math.max(|dx|,|dy|)` over tiles (no new helper needed — or reuse an existing one if present). `bondPoints`/`strengthen`/`remember` already imported. `eatFood(friend)` runs its full path (favorite/comfort/cold/hunger-sate) on the friend, exactly as if it had reached the food. The bond bump is applied before `eatFood` so it persists in the same `saveGame` eatFood triggers.

**Hooks.** `__yieldFood = () => this.lastYield`. `__feedYield(name)` — set a flag so the next `checkFeeding` treats `name` as the forced winner (test determinism, mirrors `__eat`). Simplest: `__feedYield(name)` sets `this.forcedEater = name`; `checkFeeding` prefers it when that dino is at the food, else falls through. (If simpler in practice, the e2e can position dinos so the intended winner is the unique reacher — prefer that and skip `forcedEater`.)

## Structure track — BACKLOG-377 Zone-distinct craft

**Files**
- `game/src/world/resource.ts` (+): `type Structure = 'cairn'|'shelter'`; `STRUCTURE_BY_BIAS = { stone:'cairn', branch:'shelter' }`; `zoneStructure(zone?)`; `structureRecipe(zone?)`.
- `game/src/scenes/WorldScene.ts` (~): `checkGather` build block → bias selection; `crossDino` directedCarry gets `structureRecipe(dest)`; import the two new helpers; drop the now-unused `SHELTER_AFTER_CAIRNS` import; dev hook `__zoneStructure`.
- `tests/unit/cycle-083-zone-craft.test.ts` (+): AC 1, 4 (zoneStructure/structureRecipe table; directedCarry under each recipe).
- `tests/unit/cycle-074-shelter.test.ts` (~): drop the `SHELTER_AFTER_CAIRNS is a meaningful escalation bar` assertion (constant retired); keep all canBuildShelter/buildShelter recipe-math tests (unchanged).
- `tests/e2e/cycle-074-shelter.spec.ts` (→ rewrite to 377 truth): bowl banks → cairns only (never a lean-to); grove (migrate Rex + `__setZone('grove')`) banks {6,4} → one lean-to, zone-scoped + persisted. Reuses the cycle-076 grove-banking pattern (`__migrate`/`__setZone`/`__spawnResource`/`__stepWorld`).

**`zoneStructure`.** `const bias = ZONE_BIAS[zone ?? '']; return bias ? STRUCTURE_BY_BIAS[bias] : 'cairn';`
**`structureRecipe`.** `return zoneStructure(zone) === 'shelter' ? SHELTER_RECIPE : CRAFT_RECIPE;`

**`checkGather` block (WorldScene ~1031).** Replace the `zoneCairns >= SHELTER_AFTER_CAIRNS` escalation with:
```
if (zoneStructure(zone) === 'shelter') {
  const built = buildShelter(this.pileFor(zone));
  if (built) { this.stockpileByZone[zone] = built; this.placeShelter(this.tileOf(taker), taker); this.refreshPlaque(); }
} else {
  const spent = craft(this.pileFor(zone));
  if (spent) { this.stockpileByZone[zone] = spent; this.placeCairn(this.tileOf(taker), taker); this.refreshPlaque(); }
}
```
`cairns`/`shelters` arrays + `placeCairn`/`placeShelter` + zone-scoped sprites all unchanged.

**`crossDino` (WorldScene ~3089).** `directedCarry(this.pileFor(home), this.pileFor(dest), structureRecipe(dest))` — one-arg add; conservation/lossless path (cycle-077) untouched.

**Reuse audit.** No new module. `ZONE_BIAS`/`CRAFT_RECIPE`/`SHELTER_RECIPE`/`directedCarry` all exist; `directedCarry` was *built* with the `recipe` seam (356) — 377 is its first real second caller. `bondPoints`/`strengthen`/`remember`/`flashFeed`/`eatFood`/`reachedFood` all exist for 375. No save fields added either track (memory is the persistent record; yield/lastYield is transient).

**Blocker:** none.

phase → coder-pending.

---
**SHIPPED (coder).** Build clean; 859 unit green (+12: 7 generous + 6 zone-craft − 1 retired escalation-bar); 263 e2e green (full run, no flake this run). web-llm boundary clean (only game/src/ai/). No save-format change. 375 = feeding.ts yieldFoodTo + WorldScene checkFeeding swarm glue + GENEROUS_BOND_BUMP + 🤝 beat + __yieldFood/__placeDino hooks. 377 = resource.ts zoneStructure/structureRecipe + checkGather bias-selection + crossDino directedCarry(structureRecipe(dest)) + __zoneStructure hook; cycle-074 shelter unit/e2e rewritten to the 377 truth (bowl→cairns, grove→lean-to). cycle-081 directed-carry stays green (branch is the bigger deficit under both recipes).
