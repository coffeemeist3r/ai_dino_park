# Cycle 74 — Design

Two tracks, both additive-save, both thin WorldScene glue over a pure module. Disjoint code paths.

---

## Lore track — BACKLOG-339: First steps in the grove

**What:** The visible crossing (334) drops a migrant at the far zone's edge with no reaction. When a
dino crosses into the **grove for the first time ever**, arrival becomes a beat: it pauses to look
around (a brief hold + a 🌿 bubble) and files a "first time across" memory, then wanders on. Fires
**once per dino, ever** — a second grove crossing is silent. Crossing *back* to the bowl never fires.

**Why:** Pays off the zone-crossing arc (143→274→333→334) with the emergent reaction the 334 verdict
deferred. The memory rides the existing store, so it can surface in a later greeting ("Lately: …") and
seed the follow-ups (340 homesick, 342 tell-of-the-grove, 343 pioneer).

**Shape:**
- New pure module `game/src/world/arrival.ts` (no Phaser, no AI — Node-testable):
  - `firstGroveArrival(visited: readonly string[], name, destZone): boolean` → `destZone === GROVE_ID && !visited.includes(name)`.
  - `groveArrivalMemory(): string` → `'🌿 first time across — the grove'`.
  - `groveArrivalLine(): string` → the look-around bubble, e.g. `'🌿 …somewhere new…'`.
- WorldScene: persisted `groveVisited: string[]` + transient `arriving: Set<string>`. In `crossDino`,
  after the zone flip, if `firstGroveArrival(...)`: push name to `groveVisited`, `remember` the
  arrival memory, `showBubble` the line, add to `arriving`. A new `forceStep` branch (right after the
  `migrating` branch) holds an `arriving` dino still for one step (the look-around), then clears it.
- Persistence: additive `groveVisited?: string[]` in `SaveData`; deserialize validates a string array
  (default `[]`); `currentSaveData` writes it; restore reads `save.groveVisited ?? []`. **No
  `SAVE_VERSION` bump.** Sample fixture in `saveGame.test.ts` gains `groveVisited: []`.
- Hooks: `__groveVisited()` → the list; `__arriving()` → the transient set (to observe the pause).
  Crossing is driven through the existing `__startMigration` + `__migrating` + `__stepWorld`.

**Acceptance criteria (339):**
1. A bowl dino driven through a full visible crossing into the grove ends up with the
   `groveArrivalMemory()` in its memory ring and its name in `__groveVisited()`.
2. The arrival fires the 🌿 look-around bubble and the dino is in `__arriving()` immediately after it
   crosses (the pause), then leaves `__arriving()` on the next step.
3. **Once ever:** crossing back to the bowl files no arrival memory; a *second* crossing into the grove
   adds no new arrival memory and no duplicate `groveVisited` entry.
4. Crossing **into the bowl** (grove→bowl) never fires the beat (`firstGroveArrival` false for bowl).
5. `firstGroveArrival` is pure and unit-true for: unvisited→grove = true; visited→grove = false;
   any→bowl = false.
6. Additive save: a save lacking `groveVisited` loads (→ `[]`); a round-trip preserves it; `version`
   stays 2.
7. The instant `__migrate` teleport path is unchanged (no arrival beat — it's the test/restore hook),
   so cycle-068/069 migration specs stay green.
8. `arrival.ts` imports no `ai/` backend; build clean; full suite green.

---

## Structure track — BACKLOG-315: Dino-built shelter

**What:** Beyond the cairn (286), a dino raises a **lean-to** — a second, larger, zone-scoped,
persisted structure — at a higher build bar. Once a zone has stacked `SHELTER_AFTER_CAIRNS = 3`
cairns, it stops draining the shared pile on cairns and *saves* toward a richer recipe
(`{branch:6, stone:4}`); when the pile clears it, the dino that just banked raises **one** lean-to
in its zone (a landmark). After the shelter exists, the zone resumes ordinary cairn-building.

**Why:** The next resources→build beat; the first structure a zone earns as its own. The
`SHELTER_AFTER_CAIRNS` gate is load-bearing: the cairn auto-crafts at `{3,2}` on every gather, so the
shared pile can never reach `{6,4}` unless cairn-draining pauses — gating on accumulated cairn count
is the lazy correct way to let the pile climb without touching the cairn path (so every cairn spec
stays green).

**Shape:**
- `world/resource.ts` (pure twins of the cairn helpers):
  - `SHELTER_RECIPE: Partial<Record<ResourceKind, number>> = { branch: 6, stone: 4 }`.
  - `SHELTER_GLYPH = '🛖'`.
  - `SHELTER_AFTER_CAIRNS = 3` (the per-zone cairn count after which a zone saves for a shelter).
  - `canBuildShelter(pile): boolean`, `buildShelter(pile): Stockpile | null` (pile-minus-recipe | null) —
    structural copies of `canCraft`/`craft`.
- WorldScene: persisted `shelters: { tileX; tileY; zone }[]` + `shelterSprites[]` (mirror `cairns`).
  In `checkGather`, after banking, compute `zone = zoneOf(dinoZones, taker, BOWL_ID)`,
  `zoneCairns = cairns.filter(c => c.zone === zone).length`, `hasShelter = shelters.some(s => s.zone === zone)`:
  - **saving branch** (`zoneCairns >= SHELTER_AFTER_CAIRNS && !hasShelter`): try `buildShelter`; if it
    spends, place the shelter; **do not build a cairn this tick** either way (the zone is saving).
  - **else:** the existing cairn path (`craft` → `placeCairn`) unchanged.
  - `placeShelter(tile, crafter)` mirrors `placeCairn`: push `{...tile, zone}`, `drawShelter`,
    `flashFeed(crafter, SHELTER_GLYPH)`, `remember(... 'raised a lean-to from gathered branches and stones')`,
    `logEvent('🛖 <name> raised a lean-to')`.
  - `drawShelter(s)` mirrors `drawCairn` but glyph-only for now (no `shelter` prop rig yet → 344):
    a 🛖 text at depth 2, visibility gated `s.zone === this.zoneId` (308).
  - `applyObjectVisibility`: add `shelterSprites` zone-gating beside `cairnSprites`. Restore loop draws
    shelters like cairns (zone backfill → bowl for safety, though shelters are new so none exist in old
    saves).
- Persistence: additive `shelters?: { tileX; tileY; zone? }[]` in `SaveData`; deserialize validates it
  exactly like `cairns` (default `[]`); `currentSaveData` writes `shelters`; restore reads + draws.
  **No `SAVE_VERSION` bump.** Sample fixture gains `shelters: []`.
- Hooks: `__shelters()` → the list; `__objVisible()` gains `shelters: shelterSprites.map(s => s.visible)`.

**Acceptance criteria (315):**
1. A zone with `< SHELTER_AFTER_CAIRNS` cairns builds cairns exactly as before (cycle-064 behavior
   intact — banking `{3,2}` makes a cairn, rebuild makes a second).
2. Once a zone has 3 cairns, banking that clears `{branch:3,stone:2}` does **not** add a 4th cairn —
   the zone is saving (cairn-draining paused).
3. Continuing to bank in that zone until the pile clears `{branch:6,stone:4}` raises exactly **one**
   shelter (`__shelters().length === 1`), and the pile is reduced by exactly the shelter recipe.
4. The shelter carries the crafter's home zone and renders only in that zone (`__objVisible().shelters`
   true in-zone, false cross-zone) — the 308 contract.
5. The shelter persists: it's in the exported save under `shelters`, `version` stays 2, and it
   re-renders on reload.
6. `canBuildShelter`/`buildShelter` are pure and unit-true (covers/doesn't-cover the recipe; spends
   exactly; returns null when unaffordable; never mutates the input pile).
7. A save lacking `shelters` loads (→ `[]`); a malformed `shelters` value is rejected (null), mirroring
   the cairn validation.
8. After a shelter exists in a zone, ordinary cairn-building resumes there; build clean; full suite green.

---

**Build order:** 315 first (resource.ts + checkGather + shelter persistence/render), then 339
(arrival.ts + crossDino branch + groveVisited persistence). Disjoint files bar `saveGame.ts`
(two independent additive fields) and the two test fixtures (two `[]` additions). Both: no
`SAVE_VERSION` bump, no new deps, `NPCBrain` boundary untouched.
