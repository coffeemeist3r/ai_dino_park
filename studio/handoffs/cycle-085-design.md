# Cycle 85 — Design

Two tracks this cycle, file-disjoint at the module level (both touch `WorldScene` but in disjoint methods).

---

## Lore track — BACKLOG-390 Standing up to the gobbler

### Item
BACKLOG-390 [emergent] — a high-bravery dino shouldered past by a gobbler (387) doesn't cede: it holds
its tile and the gobbler backs down (a brief 😠 standoff the bold dino wins).

### Why this cycle
Cycles 83–84 built the hatch's two social poles: the generous yield (375) and its selfish inverse, the
greedy gobble (387). Both are about who *gives way*. 390 adds the third reading of the same contested
scrap — the dino who **won't** give way. A bold winner that a gobbler tries to shoulder past holds its
ground; the gobbler backs down. Now *who eats the contested drop* is a clean three-way trait read
(generous / greedy / unbowed), and bravery — already the axis behind startle (057) and first-contact
(161) — becomes the trait that decides who gets pushed around at dinner. Ships in one fire: a pure
bravery read layered on the just-shipped gobble path, no save change, no bond change (parity with 387).

### What ships
When the keeper drops food and a winner reaches it first while *keeping* it (the 375 yield did not fire),
the existing gobble check (387) may find a hungry, prickly dino in the swarm that would shoulder past.
**New:** if the winner is **bold** (bravery ≥ `STAND_BRAVERY`), it stands its ground — the gobbler backs
down, the winner eats, the winner flashes **😠** and the log reads `😠 <winner> held its ground against
<gobbler>`. A "stood up to <gobbler> at the hatch" memory is filed on the winner. If the winner is not
bold, the gobble proceeds exactly as cycle 84 (387 unchanged).

A QA tester: drop food (`H`) so a known bold dino wins it with a hungry prickly dino beside it in the
swarm — observe the bold winner eats and shows 😠 rather than being shouldered aside. Repeat with a timid
winner — observe the gobbler still wins (387 behavior).

### Acceptance criteria
- [ ] When a gobbler would fire (387 conditions met) but the winner's bravery ≥ `STAND_BRAVERY`, the **winner** eats (not the gobbler) and the gobbler is denied the meal.
- [ ] The standing winner flashes 😠 and the event log names both dinos (`held its ground against <gobbler>`).
- [ ] The winner files a memory recording it stood up to that gobbler.
- [ ] When the winner's bravery < `STAND_BRAVERY`, the gobble proceeds byte-identical to cycle 84 (gobbler eats, 😤, gobbler's memory) — 387 unchanged.
- [ ] The generous yield (375) still pre-empts everything: when a winner yields, neither gobble nor stand-up is evaluated.
- [ ] No bond change and no save-schema change from the stand-up (parity with 387). Pure decision helper, unit-tested; deterministic over the supplied swarm order.

### Out of scope
- The backed-down gobbler's *own* reaction (slinks off 😖) — that's the seeded 394.
- Witnesses reacting / gossip about the stand-up — seeded 395.
- A persisted "held the line N×" tally / book line — seeded 396.
- Reputation so the bully avoids that winner next time — seeded 397.

### Constraints
- Layer on the existing `feeding.ts` gobble path; **do not** alter `gobblesFood`/`gobblerAmong`/`yieldFoodTo` behavior. The stand-up is a new pure predicate consumed in `checkFeeding`'s no-yield branch, between gobbler-detection and the gobbler eating.
- No save change, no bond change (387 set the no-bond-change precedent for the scramble; keep it).
- Must not disturb the cycle-083/084 generous/gobble specs except where the new branch genuinely changes a scenario (isolate, as cycle 84 did for 375).

---

## Structure track — BACKLOG-378 Third zone spine

### Item
BACKLOG-378 [core] — one more zone reachable by edge-walk off the *grove's* far (east) edge, extending the
bowl↔grove pair into a 3-zone chain; occupancy / migration / zone tally generalize past two.

### Why this cycle
The world has been a bowl↔grove pair since cycle 59. The cycle-84 adjacency graph (383) collapsed the
hard-coded binary link into a `ZONE_LINKS` table on the explicit promise that the third zone "slots in as
a table row instead of a rewrite." This cycle cashes it: a third zone, **The Fernreach**, sits east of the
grove — the first zone that is not bowl-adjacent. The keeper crossing already generalizes through the table
(`crossing`/`linkedZone`/`neighborThrough` are edge-keyed); the real work is **migration**, whose
walk-to-edge / cross / entry helpers still derive a single edge from `linkEdge(home)` and so would always
send a grove dino *west to the bowl*, never east to the Fernreach. Generalize migration to pick among a
zone's neighbours and walk to the matching edge. Occupancy (`zoneOf`/`setZone` over a map) and the zone
tally (`zonePopulations`/`zoneTallyLine` over `ZONES`) generalize for free.

### What ships
- **The Fernreach** registered in `ZONES` (id `fernreach`, name `The Fernreach`) with `ZONE_LINKS` rows `grove —east→ fernreach` and `fernreach —west→ grove`.
- **Keeper crossing:** walking off the grove's east edge enters the Fernreach (west entry); off the Fernreach's west edge returns to the grove. (Falls out of the table — verify, don't rebuild.)
- **Floor:** the Fernreach renders with its own distinguishing tint (warm, vs the grove's cool teal and the bowl's untinted grass); plain grass terrain for the spine (its own sub-regions are the seeded 399).
- **Tally + stores readout:** the plaque's `Zones ·` line shows all three zones (▸ on active); the both-zone stores line generalizes to show any zone's pile, not just bowl+grove.
- **Migration generalizes:** a dino in a multi-neighbour zone (the grove) picks a destination among its neighbours when a migration starts, remembers the chosen edge for the whole walk, walks to that edge, and crosses into the chosen destination's opposite edge. Single-neighbour zones (bowl, Fernreach) behave exactly as today.
- **Per-zone economy** (resources, stockpile, carry) works in the Fernreach for free (`pileFor` is lazy, `occupiedZones` generalizes); no new economy work this cycle.

### Acceptance criteria
- [ ] Walking the keeper off the grove's **east** edge crosses into The Fernreach (entering at its west edge); walking off the Fernreach's **west** edge returns to the grove. Bowl↔grove crossing unchanged.
- [ ] The Fernreach floor renders with a tint distinct from both the bowl (untinted) and the grove (`GROVE_TINT`).
- [ ] The plaque zone tally shows **three** zones with ▸ on the keeper's active zone; the both-zone stores readout can show a third zone's pile.
- [ ] A dino whose home zone is `fernreach` (set via `__setZone`) renders and is interactable only while the keeper is in the Fernreach (occupancy generalizes).
- [ ] Migration generalizes past two: a deterministic test (a `__startMigration`-style hook targeting a chosen destination) makes a grove dino migrate **east into the Fernreach** — it walks to the grove's east edge and arrives at the Fernreach's west edge with home zone flipped to `fernreach`.
- [ ] Existing bowl↔grove migration is **byte-identical**: the cycle-059 / 073 / 383 zone + migration unit/e2e specs pass **unmodified** (the generalized helpers default to the single `linkEdge(home)` edge when no edge is chosen).
- [ ] No save-schema change: `dinoZones` already persists any zone id additively (old saves → bowl); no `SAVE_VERSION` bump.

### Out of scope
- The Fernreach's own terrain sub-regions (path/water-style) — seeded 399.
- An on-screen edge indicator naming the neighbour — seeded 398.
- The Fernreach's resource bias — seeded 400 (it inherits the uniform 50/50 fallback this cycle).
- Any change to the *keeper* crossing helpers (already generic) beyond verifying they work for the new pair.

### Constraints
- **Preserve existing helper signatures back-compat.** Generalize `migrationStepTarget` / `atMigrationEdge` / `crossEntryTile` by adding an **optional** `edge?: Edge` parameter that defaults to `linkEdge(homeZone)` — so every existing call site and unit test stays byte-identical. New migration code passes the chosen edge explicitly.
- The migrating dino must remember its chosen destination+edge for the whole walk (a companion record beside the `migrating` Set, set at `startMigration`, read in `forceStep` + `crossDino`, cleared on arrival). Don't oscillate the target mid-walk.
- `@mlc-ai/web-llm` stays only under `game/src/ai/` (untouched here).
- **Cross-track file note:** both tracks edit `WorldScene.ts` — 390 in `checkFeeding`, 378 in the migration glue / `drawFloor` / `zoneStores`. Disjoint methods; build either order. Codeplan to confirm.
