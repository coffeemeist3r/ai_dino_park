# Cycle 97 — Code Plan

## Lore track — BACKLOG-368 (hunger in the voice)

**Files (3 + 2 tests):**
- `game/src/ai/brain.ts` — add `hungry?: boolean` to `NPCContext`; add pure `hungryAside(traits?: Personality): string` (prickly `< PRICKLY_MAX` / warm `> EFFUSIVE_MIN` / even); in `cannedReply`, refactor the register ladder to compute a `reply` then, if `ctx.hungry`, `reply.text = (reply.text + hungryAside(ctx.traits)).slice(0, 240)`; return.
- `game/src/ai/webllmBrain.ts` — in the greet-branch prompt build, append the hunger fact ("You are hungry right now…") when `ctx.hungry`, so the model colours it. Enrichment only.
- `game/src/scenes/WorldScene.ts` — greet ctx in `pickTone` (~L3870): add `hungry: pressingNeed(this.needs[target.name]) === 'hunger'`. (`pressingNeed`/`needs` already imported.)
- Unit `tests/unit/cycle-097-hunger-voice.test.ts`: `hungryAside` three variants distinct; `cannedReply({hungry:true})` ends with the aside and `cannedReply({hungry:false})` byte-identical to no-flag; composes with gratitude/wistful/fond/generic (each still fires + carries aside).
- E2E `tests/e2e/cycle-097-hunger-voice.spec.ts`: mirror `cycle-059-wistful-greeting`; `__setNeed('Rex','hunger',0.8)`, greet, assert the shown line contains the even-variant fragment; a sated control (`__setNeed(...,0)`) does not. Zero console errors.

**Reuse:** `needs.pressingNeed` (371), `NEED_THRESHOLD`, PRICKLY_MAX/EFFUSIVE_MIN, existing greet ctx + dino.greet merge.

## Structure track — BACKLOG-429 (zone carry pressure)

**Files (2 + 2 tests):**
- `game/src/world/resource.ts` — add `STOCKPILE_SOFT_CAP` (per-zone total; pick 6 so it bites before hard cap), `PRESSURE_CARRY = 2`, `pileTotal(pile)`, `overSoftCap(pile)`, `pressuredCarry(src, dest, recipe = CRAFT_RECIPE): ResourceKind[]`. Not over cap / dest not strictly lighter → `[directedCarry(...)]` filtered of null (`[]` when null) — byte-identical single carry. Over cap & `pileTotal(dest) < pileTotal(src)` → loop up to `PRESSURE_CARRY`: `pickCarry(workSrc, workDest)`, push, `takeResource`/`bankResource` on working copies (cap-safe, lossless), break on null.
- `game/src/scenes/WorldScene.ts` `crossDino` (~L3773): replace the single `directedCarry`+`if(carry)` block with `const carried = pressuredCarry(this.pileFor(home), this.pileFor(dest), structureRecipe(dest));` then `for (const carry of carried) { take/bank; }` and one log line (count + first kind).
- Unit `tests/unit/cycle-097-carry-pressure.test.ts`: under-cap → `pressuredCarry == [directedCarry]`; over-cap + lighter dest → 2 most-stocked sheds (assert lengths + kinds); over-cap + heavier/equal dest → single directed kind; cap-safe (dest at STOCKPILE_CAP for a kind never exceeded); lossless (src total drop == dest total gain); empty src → `[]`.
- E2E `tests/e2e/cycle-097-carry-pressure.spec.ts`: mirror `cycle-081-directed-carry`; `__setZonePile('bowl', {stone:5,branch:3})` (total 8 > soft cap 6), grove empty; `__startMigration('Rex')` (bowl→grove) + step to finish; assert grove gained 2 (pressured), bowl dropped 2, conserved. Control: a `{stone:2,branch:1}` bowl (under cap) moves 1.

**Reuse:** `directedCarry`/`pickCarry`/`takeResource`/`bankResource`/`atCap`/`STOCKPILE_CAP` (all in resource.ts), `structureRecipe`, crossDino's existing transfer path + `__setZonePile`/`__startMigration`/`__stepWorld` hooks.

**No collision:** disjoint modules + disjoint WorldScene sites (greet ctx vs crossDino). Neither adds a save field. WebLLM stays under `ai/`.
