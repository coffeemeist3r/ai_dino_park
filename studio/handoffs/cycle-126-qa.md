# Cycle 126 — QA

**Runs:** `npm run build` clean · `npx vitest run` **1641/1641** (176 files) · `npx playwright test`
**478/478** after `npx --yes kill-port 5173`.

**Flake noted, not a regression:** the first run of the two new specs at 3 workers timed out at boot on all
three tests (`__ready` never true within 30s). Re-run at `--workers=1`: all three green in 4.9s, and all
three green again inside the full 478-spec run. This is the catalogued cold Vite/Phaser start, not a
product defect.

**BACKLOG-430 (the standing mobile-minds red):** `long dialogs page GBA-style` **passed** in the full run —
as it also did in cycle 125's run 2. Nothing this cycle went near the dialog input path. 430 stays open;
whoever takes it should re-run the cycle-93 stash reproduction rather than trust two consecutive greens.

**Boundary:** `grep -rn "@mlc-ai/web-llm" game/src` outside `game/src/ai/` → no hits.

---

## Structure track — BACKLOG-478 (The chain forks)

| # | Criterion | Result |
|---|---|---|
| 1 | build clean, no web-llm leak | **PASS** |
| 2 | `zoneNeighbors(GROVE_ID)` = 3 links (west/east/north) | **PASS** |
| 3 | `hopDistances(BOWL_ID)` branches — fernreach 2, ridge 2, hollow 3 | **PASS** |
| 4 | `hopToward` routes bowl→grove→ridge; hollow→ridge walk terminates | **PASS** |
| 5 | `hopsBetween(ridge, hollow) === 3`, symmetric | **PASS** |
| 6 | `nearestQualifying(grove, [hollow, ridge])` picks the Ridge | **PASS** |
| 7 | `zoneChain()` = 5 unique ids incl. the Ridge | **PASS** |
| 8 | `crossing()` north/south, east/west unchanged | **PASS** |
| 9 | `linkedZone(grove,'north')` enters the Ridge's south side, x preserved | **PASS** |
| 10 | `griefEdge(grove, ridge) === 'north'`; pre-478 answers unchanged | **PASS** |
| 11 | Ridge capacity derived, no `capacity.ts` edit | **PASS** (cap 5, from 302 grass tiles) |
| 12 | Ridge has own crop / plot / water / tint; `zoneTileAt` non-null | **PASS** |
| 13 | Ridge on the zone-map lens with its population | **PASS** |
| 14 | E2E keeper walks north out of the Grove and back south | **PASS** |
| 15 | E2E Grove shows 3 edge indicators, Ridge 1 | **PASS** |
| 16 | Save additive — old save loads, new round-trips | **PASS** |
| 17 | Every amended test file listed by name with what it assumed | **PASS** — below |

### The deliverable: what the assertions assumed (20 amendments, 16 files)

The M10 finding is that the code generalizes and the assertions don't. Here is the evidence, one line each.

**Behaviour changed by design (2):**
1. `game/src/world/tic.ts` `griefEdge` — **a real defect, not a test problem.** It compared `zoneChain()`
   indices and answered east/west. A branch zone lands at the *end* of the chain via the append-the-unreached
   fallback, so a Grove dino grieving a friend on the Ridge would have walked to the **east** wall — a
   direction its friend did not go, and from the Ridge's side an edge that does not exist. Now reads
   `hopToward` + that link's own edge.
2. `game/src/world/cropseason.ts` — the Ridge's crop had to declare a season (see #12 below), which
   doubles summer up.

**Assertions that hard-coded "four grounds" (10):**
3. `game/src/world/distance.test.ts` — assumed every ground sits at its own depth. True only of a line;
   the Ridge ties the Fernreach at 2 hops from the bowl.
4. `game/src/world/struck.test.ts` — listed the four keepsake glyphs by hand, so a fifth `ZONES` row failed
   by construction. Now derives from `ZONES`.
5. `tests/unit/cycle-085-third-zone.test.ts` — `ZONES` id list, and `zoneNeighbors(grove)` pinned at two.
   378 proved a zone *could* border two; the Grove is the first to border three.
6. `tests/unit/cycle-084-zone-adjacency.test.ts` — pinned `ZONE_LINKS` exactly; called it a graph, listed a
   path.
7. `tests/unit/cycle-090-edge-indicators.test.ts` + 8. `tests/e2e/cycle-090-edge-labels.spec.ts` — "the grove
   labels both edges". Three now, one of them vertical.
9. `tests/unit/cycle-091-zone-map.test.ts` + 10. `tests/e2e/cycle-091-zone-map.spec.ts` — `zoneChain()`
   pinned as a west→east geography. It is an iteration order; the branch is appended.
11. `tests/unit/cycle-119-fourth-ground.test.ts` + `tests/e2e/cycle-119-fourth-ground.spec.ts` — `ZONES`
   length 4 and the four-box lens.
12. `tests/unit/plaque.test.ts` — the zone tally line spelled out four names.

**Assertions that encoded a count as if it were a rule (1, the sharpest):**
13. `tests/unit/cycle-118-crop-season.test.ts` + `tests/unit/cycle-119-fourth-ground.test.ts` — *every season
    has **exactly one** thriving crop.* With four crops and four seasons a rotation cannot be anything else,
    so the assertion could never tell a design rule from a counting coincidence — and at five crops it is
    unsatisfiable. Relaxed to *every season has a thriving crop* (no season is barren), with the per-season
    winners still pinned and a new assertion naming summer as the doubled-up one. The neighbouring invariant
    — *a new crop must declare a year* — was **kept and obeyed**, and it earned its keep: it caught the
    Coder's first instinct to leave the Ridge out of the table entirely.

**Signature changes rippling into specs (4):**
14. `tests/unit/cycle-059-zones.test.ts` — `crossing`/`linkedZone` took one axis.
15. `tests/unit/cycle-073-migration-crossing.test.ts` + `cycle-084` + `cycle-085` — the migration trio took a
    bare *row*, which sufficed only while every edge was horizontal.
16. `tests/unit/cycle-094-grief-tic.test.ts` — `griefAnchor` likewise.
17. `tests/unit/saveGame.test.ts` + `tests/unit/cycle-061-save-version.test.ts` — the round-trip fixture
    enumerates every save key, so an additive field is always an amendment here. New spec added: an older
    save lacking `ridgePlot` defaults it to null.

**Specs whose *premise* the fork invalidated (3) — the most interesting category:**
18. `tests/e2e/cycle-120-unsettled.spec.ts` — "one inhabited ground and three nobody has lived on" is four
    now. Its second test becomes a genuinely better test: with two unsettled grounds at different distances,
    the frontier pick finally exercises `nearestQualifying` rather than walking over a single candidate.
19. `tests/e2e/cycle-123-capacity.spec.ts` — per-zone capacity/crowding maps enumerate every ground.
20. `tests/e2e/cycle-109-scarcity.spec.ts` + `tests/e2e/cycle-111-plentywelcome.spec.ts` — **these failed for
    a correct reason.** Both set up "Rex alone in the poor Grove" and assert where appeal sends him. The
    Grove now borders an *unsettled* ground, and the frontier tier (474) outranks appeal by design, so the
    migrant aimed at the Ridge. The specs were measuring the wrong system the moment a frontier opened next
    door. Both already had a `closeFrontier` helper that walks one dino through every empty ground; the
    Ridge was added to it, and cycle-109's appeal test now calls it. No product behaviour changed.

**Untouched, and worth saying so:** prosperity, harvest, demand, the pantry, the ferry, the provider,
migration, decline, governance, `capacity.ts`, `frontier.ts`, `lenses.ts` — nine cross-zone systems met a
*branching* graph with zero edits, which is what 449/475 promised and what this item existed to verify.

---

## Lore track — BACKLOG-424 (Traces of your pacing)

| # | Criterion | Result |
|---|---|---|
| 1 | `traces.ts` pure, Node-tested (no Phaser / random / web-llm) | **PASS** |
| 2 | Re-recording replaces the pacer's own prior trace | **PASS** |
| 3 | A trace past `TRACE_FRESH_STEPS` is not returned | **PASS** |
| 4 | Only another dino's trace is returned | **PASS** |
| 5 | Matches at radius 1, not at 2 | **PASS** |
| 6 | Zone-scoped — same tile in another ground does not match | **PASS** |
| 7 | Freshest of two wins, deterministically (order-independent) | **PASS** |
| 8 | The memory names no cast member | **PASS** (asserted against the whole roster) |
| 9 | E2E: finder files once; a second scan files nothing more | **PASS** |
| 10 | E2E: a dino does not read its own scuff | **PASS** |
| 11 | No save-format change | **PASS** (transient, like all 405 tic state) |

**Partial / noted:**

- **The beat is only proven through the dev hooks, not through a natural 20-step solitude stretch.** The e2e
  drives `__leaveTrace` / `__noticeTraces` directly. That is the same seam 408 used for the caught-mid-tic
  greet (and for the same reason — a stray wanderer perturbs a real solitude count), but it means the
  *organic* path (dino paces → leaves → another wanders past inside 40 steps) is unit-proven and
  hook-proven, never observed end-to-end. Honest limitation, recorded rather than dressed up.
- **`traceMemory()` is one fixed line.** Every finder files the identical string, so the beat currently has
  no temperament shading — a curious dino reads the ground exactly like an incurious one. Deliberate for a
  first slice (the anonymity is the design), but it is the obvious 424 follow-up and a Living-minds gap.
- The notice scan runs once per ambient step over the whole cast (5 dinos × ≤5 traces). Trivial, but it is
  the first per-step scan added since the food-web pairing; worth remembering if the cast grows.
