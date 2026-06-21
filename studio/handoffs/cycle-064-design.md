# Cycle 64 — Design (both tracks)

## Lore track — BACKLOG-288 Stargazing companions

**Item:** BACKLOG-288 [social] — two dinos who watched the same sky event from adjacent spots gain a small shared-wonder bond bump + a "watched the sky together" memory.

**Why this cycle:** Cycle 63 (150) made the cast watch the sky *differently* — bold dinos crowd ring 0, timid hang at ring 2. That spread already encodes *who stood next to whom*. This cycle reads that adjacency back into the bond graph: the dinos who pressed in together under the falling stars come away a little closer for it. The bowl's one collective moment now also knits specific pairs — and it's almost free, because the gather positions already exist.

**What ships:** During an active sky event, each dino settles at its gaze ring (150) and joins `skyGazers`. The scene records each gazer's settled tile. When the event ends (duration or dawn), every **unordered pair of gazers whose settled tiles are within 1 tile (Chebyshev ≤ 1)** gains a one-time bond bump (`SHARED_WONDER_BOND`) and each dino files a memory naming the other ("watched the sky together with Sunny"). A dino with no other gazer within 1 tile (a lone edge-watcher) gets nothing. Bonds and memories already persist in the save.

To verify: `__triggerSky('meteors')`, step the world until dinos settle (`__skyGazers` fills), force the event to end (advance to dawn / past duration), then read `__bondPair(a,b)` for two dinos that ended adjacent — it rose; read their memory — it names each other.

**Acceptance criteria:**
- [ ] Pure `stargazingPairs(gazers)` returns each unordered Chebyshev-≤1 gazer pair exactly once; non-adjacent gazers don't pair; no dino pairs with itself. Node-tested, no Phaser.
- [ ] After a sky event ends, two dinos that settled within 1 tile of each other have a bond higher by exactly `SHARED_WONDER_BOND` than before the event.
- [ ] Each of those two dinos files a "watched the sky together" memory naming the other.
- [ ] A gazer with no other gazer within 1 tile gains no shared-wonder bond and files no companion memory.
- [ ] The bump is one-time per event: stepping the world again after the event ended does not re-apply it; bonds + companion memories survive an export/reload. No save `version` bump.
- [ ] `@mlc-ai/web-llm` boundary untouched (no ai/ import added to skyEvent.ts).

**Out of scope:** dino-to-dino spoken lines about it (voice items); the book readout of who-watched-with-whom (289); the lingering-gazer leave beat (287); the afterglow mood (290). Pairing is by **final settled tile**, not by tracking adjacency every step.

**Constraints:** Only file shared with the structure track is `WorldScene.ts`, and in **disjoint methods** — this track touches `stepSky`/`endSky` (gather positions + end-of-event pairing), the structure track touches `checkGather` (craft). Order of application doesn't matter. Keep `stargazingPairs` + `SHARED_WONDER_BOND` pure in `world/skyEvent.ts`; apply the bond via the existing `strengthen(bonds, a, b, delta)` (social/bonds.ts) and the memory via the existing `remember`. No new save field.

---

## Structure track — BACKLOG-286 First craft

**Item:** BACKLOG-286 [emergent] — at a stockpile threshold a dino turns banked resources into one crafted object (a cairn) placed in the bowl.

**Why this cycle:** The build arc has been accruing toward this for two cycles: 146 made dinos *gather*, 285 made the gather *bank* into a park stockpile sitting on the plaque. This cycle that number finally *buys* something — the first time the bowl's dinos take raw material and **make** an object. A cairn rising from a pile of branches and stones is the brick that turns "the dinos collect things" into "the dinos build things," and the count 285 readies is exactly what it spends.

**What ships:** A pure craft rule in `world/resource.ts`: a fixed recipe `CRAFT_RECIPE` (e.g. `{ branch: 3, stone: 2 }`), `canCraft(pile)` (true iff the stockpile covers every required kind), and `craft(pile)` → a new `Stockpile` with exactly the recipe cost subtracted (or `null` when unaffordable). In `WorldScene.checkGather`, right after a pickup banks (`bankResource`), if `canCraft(stockpile)` the dino that just banked crafts: the stockpile is reduced by the recipe (`craft`), a **cairn** (🗿) is placed in the bowl at the crafter's tile, the crafter files a "stacked the first cairn" memory + a 🗿 flash, and the event is logged. Cairns are recorded in an additive save field `cairns: {tileX,tileY}[]` (mirrors `eggs`) and re-rendered on load; old saves load with none.

To verify: spawn resources on a dino and step repeatedly (reuse `__spawnResource`) until the stockpile reaches ≥3 branch / ≥2 stone; on the banking step that crosses the threshold a cairn appears (`__cairns` gains an entry) and the stockpile drops by the recipe cost; the cairn is in `__exportSave` and re-renders after reload.

**Acceptance criteria:**
- [ ] `canCraft(pile)` is true iff `pile` has ≥ the recipe cost of every kind in `CRAFT_RECIPE`; `craft(pile)` returns the pile minus exactly the recipe cost (no kind below 0) when affordable and `null` otherwise. Pure, Node-tested.
- [ ] When the stockpile first reaches the recipe threshold, a cairn 🗿 is placed in the bowl and the stockpile decreases by exactly the recipe cost.
- [ ] Crafting consumes the recipe each time and fires at most once per gather pickup — it does not loop multiple cairns off a single pickup; a second cairn requires the stockpile rebuilt to the threshold again.
- [ ] The crafter files a memory recording it stacked the cairn.
- [ ] A placed cairn appears in the exported save under `cairns` and re-renders at its tile after reload; a save without `cairns` loads with none. No save `version` bump (additive over v2, like `stockpile`).
- [ ] `@mlc-ai/web-llm` boundary untouched; `world/resource.ts` stays Phaser-free.

**Out of scope:** more than one recipe or output type (deferred to 029); buildings; any gameplay effect from a cairn (decorative this cycle); placing cairns in the grove / terrain-aware placement (294); a crafting UI. Richer "built history" beyond this minimal persisted list stays in 293's lane.

**Constraints:** Craft hooks inside `checkGather` (structure track already owns that method) — keep it a few lines after `bankResource`. `world/resource.ts` stays pure (no Phaser): the recipe + `canCraft` + `craft` are decided there; WorldScene owns the sprite + persistence. Reuse the existing additive-save pattern (`stockpile`/`eggs`) for `cairns` — validate the array shape, default `[]`, **no `SAVE_VERSION` bump**. Only shared file with the lore track is `WorldScene.ts`, disjoint methods (`checkGather` vs `stepSky`/`endSky`).
