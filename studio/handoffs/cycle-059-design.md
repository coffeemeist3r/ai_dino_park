# Cycle 59 — Design

Two tracks this cycle (CHARTER v5). Each section below is independently testable and shippable.

---

## Lore track — BACKLOG-271 [social] Wistful greeting from a neglected dino

### Item
BACKLOG-271 — a rock-bottom-friendship dino opens a keeper greeting wistfully instead of with the
generic hello, keyed on `ctx.affection`.

### Why this cycle
Gratitude now reads temperament three ways (gruff/nod/gush, cycles 53–58), but the *greeting* a dino
gives the keeper ignores the relationship entirely — a dino you have never once visited says the same
canned hello as a beloved one. That is a distinctness hole the CHARTER cares about. 271 voices the
neglected pole, the cheapest possible win: it mirrors the cycle-57/58 thanks-register pattern exactly
(a pure branch in `cannedReply` + a matching `buildMessages` clause), keyed on a context field both
greet sites already pass (`affection`, BACKLOG-051). No WorldScene, world, or save change.

### What ships
- A new wistful greeting register. When the keeper greets a dino with **no gratitude pending** and
  **`ctx.affection` ≤ `WISTFUL_MAX` (1 heart)**, the canned reply is a wistful, hoping-to-be-noticed
  line — e.g. *"Oh… you came to see *me*? I wasn't sure you knew I was here."* — instead of a random
  `cannedGreetings` entry.
- A dino above the threshold (or with no affection info) greets exactly as today (generic line).
- The LLM path matches: a neglected dino's `buildMessages` system prompt picks up a *wistful*
  instruction (the affection counterpart of the thanks clauses), so a loaded brain colours the same
  beat; a non-neglected dino's prompt is unchanged.

### Acceptance criteria
- [ ] `wistfulGreeting(name)` (exported, pure) returns a wistful line containing the dino's name.
- [ ] `WISTFUL_MAX` is exported and equals `1` (hearts).
- [ ] `cannedReply` with `affection ≤ WISTFUL_MAX` and no `gratitude` returns the wistful line via `source: 'canned'`; the threshold is **inclusive** (exactly `1` → wistful).
- [ ] `cannedReply` with `affection > WISTFUL_MAX` returns a generic `cannedGreetings`-derived line (unchanged behavior).
- [ ] `cannedReply` with **no** `affection` field returns a generic line (back-compat default — unchanged).
- [ ] `gratitude` still wins over wistful: a cleared-name dino at 0 hearts returns the thanks line, not the wistful one (gratitude branch stays first).
- [ ] `buildMessages` adds a wistful instruction for a neglected dino (`affection ≤ WISTFUL_MAX`, no gratitude) and NOT for a non-neglected one; the existing time-of-day / mood / friendship context still threads through in both.
- [ ] E2E: a dino at 0 hearts, greeted headless (canned fallback), returns the wistful line — reply names the dino and contains neither a generic-greeting marker nor a thanks phrase. No console errors.
- [ ] `npm run build` clean; full `vitest` + `playwright` green in one fresh run.

### Out of scope
- The warm pole (≥8-heart fond hello, BACKLOG-272) and the memory softening (BACKLOG-273) — 271 voices the neglected pole only.
- Any bond/affection *change* from the greeting — this colours the spoken line, nothing else.
- Mid-band greetings — only the ≤1-heart pole gains a voice; everyone else keeps the generic line.

### Constraints
- **Two files of production code only**, mirroring cycle 57/58: `game/src/ai/brain.ts` (the
  `wistfulGreeting` fn + `WISTFUL_MAX` const + the `cannedReply` branch) and
  `game/src/ai/webllmBrain.ts` (the prompt clause). No WorldScene/world/save change.
- Branch order in `cannedReply`: `gratitude` first (unchanged), then wistful, then generic. The
  gratitude and generic paths must stay byte-identical so every prior greeting/gratitude spec passes
  untouched.
- Keep the NPCBrain boundary: all dialogue text stays under `game/src/ai/`; no `ai → world` import.

---

## Structure track — BACKLOG-143 [core] Connected zone (spine)

### Item
BACKLOG-143 — one adjacent zone (a **grove**) reachable by walking off a designated bowl edge, with a
keeper transition between the two; per-zone occupancy tracked via a pure API. Spine only.

### Why this cycle
The bowl has been a single 20×15 enclosure for 58 cycles, and the path/water tile art (BACKLOG-033)
has been benched for cycles because there's nowhere but all-grass to render it. A second, walkable zone
is the foundation the whole map arc and that art wait on. This is the first structure-track pick under
CHARTER v5.

### What ships
- A pure `game/src/world/zones.ts` module:
  - A zone registry: `BOWL` and `GROVE`, each with an id and display name; `ZONES` / `zoneById`.
  - `crossing(px, py, cols, rows, tile)` → the edge a keeper pixel-position has stepped past
    (`'east'`/`'west'`/null for this spine — bowl's **east** edge leads to the grove, grove's **west**
    edge leads back), computed *before* the normal clamp.
  - `linkedZone(zoneId, edge)` → `{ zoneId, entry: {x,y} } | null`: the neighbour and the keeper's entry
    pixel on the far side (entering from the opposite edge, vertical position preserved).
  - A tiny occupancy API: `setZone(map, id, zoneId)` / `zoneOf(map, id, fallback)` over a plain
    `Record<string,string>`, so "which zone is entity X in" is answerable and unit-testable.
- Thin WorldScene glue:
  - Track `this.zoneId` (default `BOWL`).
  - In the keeper move handler, **before** the existing edge clamp: if `crossing(...)` returns an edge
    that `linkedZone` resolves, switch `this.zoneId`, move the keeper to the entry position, repaint the
    floor for the new zone, and update the plaque + a `window.__zone` hook. Otherwise clamp as today.
  - A `window.__zone()` dev hook returns the current zone id; `window.__setZone(id)` (dev) jumps zones
    for tests.
  - Persist `zoneId` additively in the save; restore it on load (absent → `BOWL`).
  - A zone-name line on the plaque/HUD so the player can see which zone they're in.

### Acceptance criteria
- [ ] `crossing(px,py,...)` returns `'east'` when the keeper pixel position is past the east edge of the bowl grid, `null` when inside, for the bowl; mirror `'west'` for the grove.
- [ ] `linkedZone('bowl','east')` → `{ zoneId: 'grove', entry }` with `entry.x` near the **west** side (so you arrive at the edge you'd walk back through); `linkedZone('grove','west')` → bowl, `entry.x` near the **east** side. Vertical position is preserved (passed through).
- [ ] `linkedZone` returns `null` for an edge with no link (e.g. `('bowl','west')`), so the keeper clamps normally there.
- [ ] `setZone`/`zoneOf` round-trip: after `setZone(m,'Rex','grove')`, `zoneOf(m,'Rex','bowl') === 'grove'`; an unset id returns the fallback.
- [ ] Save round-trips `zoneId`: `deserialize(serialize({...,zoneId:'grove'})).zoneId === 'grove'`; a save without `zoneId` deserializes with `zoneId` defaulting to `'bowl'` (additive, old saves valid).
- [ ] E2E: from a fresh boot, `window.__zone()` is `'bowl'`; driving the keeper off the east edge (or calling `__setZone` then verifying the crossing path) flips `window.__zone()` to `'grove'` and the keeper is repositioned to the west side; walking back flips it to `'bowl'`. No console errors.
- [ ] The plaque/HUD shows the current zone name. The bowl renders exactly as before when `zoneId==='bowl'` (no visual regression to existing bowl specs).
- [ ] `npm run build` clean; full `vitest` + `playwright` green in one fresh run.

### Out of scope (deferred follow-up — Code-planner files a BACKLOG note)
- **Populating the grove with dinos / per-dino migration + cross-zone render filtering.** The occupancy
  API (`setZone`/`zoneOf`) ships and is tested, but the grove starts **empty** this cycle and all dinos
  stay home in the bowl; cross-zone dino rendering is the next structural beat. This keeps the
  WorldScene change low-risk and 143 to one fire.
- Biomes / distinct grove tile art (that's BACKLOG-033, now unblocked), minimaps, >2 zones, routing.

### Constraints
- Pure logic in `world/zones.ts` (Node-testable, no Phaser import); WorldScene glue stays thin.
- The bowl's existing render/movement/clamp must be untouched when `zoneId==='bowl'` — every existing
  bowl-based e2e (glass tap, feeding, movement, etc.) must stay green. The crossing check is additive,
  evaluated before the clamp, and a no-op unless the keeper actually walks off the linked edge.
- Additive save only (`zoneId?`), mirroring how `keeperId`/`scale` were added; old saves must still
  deserialize.
- Reuse the existing `COLS`/`ROWS`/`TILE` constants and the plaque update path; don't reinvent.

---

## Cross-track note
The two tracks share **no files**: lore touches `game/src/ai/{brain,webllmBrain}.ts`; structure touches
`game/src/world/{zones,saveGame}.ts` + `game/src/scenes/WorldScene.ts`. No collision; the Coder can
build them in either order.
