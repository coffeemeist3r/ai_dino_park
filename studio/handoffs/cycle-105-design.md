# Cycle 105 — Design

Milestone 5's closing cycle: both remaining arcs. The lore track gives the park a *social*
answer to hunger (a friend fetches the dino that won't come to the table); the structure track
gives it a *local* answer to thirst (every zone gets water). When both land, Milestone 5 —
"No one goes hungry" — closes.

---

## Lore track — BACKLOG-381

**Item:** BACKLOG-381 [social] Brought to the hatch — a moping loner's highest-bond friend, on a
food drop, nudges it in from the edge toward the hatch so it doesn't miss the meal while
withdrawn.

### Why this cycle

The last unchecked Milestone 5 lore arc, and the one that makes the milestone's title honest.
444 taught the park to feed a starving dino from its own stores — a number crossing a bar. 381 is
the same sentence with a face on it: someone *notices*. The park already owns all three parts and
has never joined them. A dino can be a loner and withdraw to the wall (135, `loner.ts`). A dino's
closest friend can be picked and sent across the bowl to it (130, `comfort.ts` → `comforter()`).
Food lands at a tile and the cast rushes it (059/061, `feeding.ts`). What has never existed is a
dino that goes the *wrong way* on purpose — away from a meal, to bring someone else to it.

### What ships

On a food drop, at most **one** fetch beat resolves:

1. The keeper drops food (`H`, the hatch, or a harvest drop). The cast rushes it as always.
2. If a **withdrawn loner** is in view — a loner by the bond graph (`isLoner`) that did **not**
   rush the drop (`reactionToFood(...) === 'ignore'`: too far, or too listless) — the park looks
   for the one dino that would come for it: its **closest friend above the comfort bond floor**,
   picked by `comforter()` (the same function that picks who consoles a sulker — reciprocity
   override included). That friend must itself be in view and not already busy.
3. That friend breaks off and walks to the loner (**phase 1: `to-loner`**), overriding its own
   food rush. This is the visible oddity: while everyone else converges on the food, one dino
   turns around and heads for the wall.
4. On adjacency, the **nudge beat** fires once: a 🤝-register bubble naming both dinos, an event
   line, a memory on each side (the loner's is the one that can colour its next keeper line —
   "Twitch came and got me"), and a small bond bump between them.
5. **Phase 2: `to-food`.** Both dinos now walk toward the food tile, the loner following, its
   withdrawal suppressed for the duration. The friend arrives second because of the detour.
6. The escort ends when the loner reaches the food (`reachedFood`), the food is gone, either dino
   leaves view, or the step budget drains — whichever comes first. Nothing is forced: if the food
   is eaten before they arrive, the walk simply ends. Being brought to the hatch does not
   guarantee a meal; it guarantees a *chance* at one.

**If nobody clears the bond floor, nobody comes** — the loner stands at the edge while the park
eats. That silence is the feature, and it is the read the arc is for: whether anyone comes is a
read on whether this dino has anyone at all.

### Acceptance criteria

- [ ] With a loner at the edge (all bonds < `LONER_FLOOR`) and a peer bonded ≥ `COMFORT_BOND_FLOOR`
      to it, a food drop starts a fetch: the escort state names that peer as the friend and the
      loner as the fetched, phase `to-loner`.
- [ ] The friend chosen is the loner's **highest-bond** peer above the floor, not the nearest dino.
- [ ] No peer above the floor → no fetch starts, and the loner keeps moping (a food drop with a
      fully-friendless loner leaves the escort state null).
- [ ] A loner that **did** rush the drop (in range, energetic) does not trigger a fetch — the gate
      is "withdrawn *and* missing the meal", not "is a loner".
- [ ] While the escort is in phase `to-loner`, the friend's per-step move is toward the loner even
      when it is within food-rush range — the escort outranks its own rush.
- [ ] On adjacency the beat fires exactly **once**: one bubble, one event line, one memory per side,
      one bond bump; phase flips to `to-food`.
- [ ] The fetched loner files a memory naming its friend, readable in its memory store.
- [ ] In phase `to-food`, the fetched loner's per-step move is toward the food tile and its moping
      withdrawal does not fire.
- [ ] The escort clears (state → null) on any of: loner reaches the food, food gone, step budget
      exhausted.
- [ ] At most one escort is live at a time; a second drop while one is running does not start another.
- [ ] E2E: a scripted drop with a planted loner + bonded friend shows the escort running and the
      fetched dino ending up at the food row.
- [ ] Save format unchanged (the escort is transient, like `pendingRespond`).

### Out of scope

- No dialogue-tree / LLM line for the nudge (deterministic bubble only; the memory is what can
  reach a later LLM-coloured greeting through the existing store).
- No new activity glyph taxonomy beyond reusing the existing `dinoActivity` labels.
- No "the friend gives up its own meal" economics — 375's yield already covers generosity at the
  food itself; this is about *arrival*, not the meal.
- No multi-friend escort (137's comfort-circle shape stays queued).

### Constraints

- Reuse `comforter()` from `world/comfort.ts` for the pick. Do **not** write a second
  "closest friend above a floor" search — that is the exact defect the reuse audit exists for.
- The escort must be transient state on `WorldScene` (the `pendingRespond` pattern), **not**
  persisted. Save shape must not change.
- The escort branch sits in `stepDinos` **above** the food-rush branch (so the friend's detour
  wins) and **above** the moping branch (so the fetched loner follows instead of withdrawing).
  It must sit **below** the existing early-`continue` branches for sleeping/crossing/fleeing/
  stalking — a hunt or a migration still outranks a social errand.
- Must not disturb the 375 yield / 387 gobble resolution in `checkFeeding`.
- Logic pure and Node-testable in `game/src/world/`; `WorldScene` glue stays thin.

---

## Structure track — BACKLOG-445

**Item:** BACKLOG-445 [emergent] The waterhole — all three zones slake thirst locally.

### Why this cycle

The last unchecked Milestone 5 structure arc. Thirst has been in the game since cycle 80 and has
had exactly one place to resolve in all that time: the grove's NE pond. Two consequences are live
in the code right now. `checkNeeds` only calls `satisfy(..., 'thirst')` for a dino standing near
*that* pond, so a bowl or Fernreach dino's 💧 can only ever clear by walking a zone or two. And
`needTargetFor` reads `zone === GROVE_ID ? grovePondTile(COLS) : null` — meaning 436's
need-pull, a shipped feature, is a **no-op for thirst in two of three zones**. This isn't a new
system; it's finishing one that shipped half-connected.

### What ships

- **The bowl gets water.** The bowl is the only zone with no terrain layout at all (`zoneTileAt`
  returns `null` for it and the floor bakes plain grass). It gets a small waterhole block in its
  north-west, clear of the huddle tile (10,11), the plot (2,12), and the food-landing row (y=6),
  and clear of the east migration edge. Because the bowl now has a non-null layout, its floor
  bakes through `bakeTerrainMap` like the other two zones — using the water rig that already
  exists, still untinted.
- **The Fernreach's creek starts working.** `fernreachTileAt` has laid a 2-wide creek down the
  west side since 399 and nothing has ever drunk from it. No new terrain — pure plumbing.
- **"Where is my water" becomes a per-zone question.** One helper resolves the drink target for
  any zone from that zone's own terrain, replacing the hardcoded `grovePondTile` reach in
  `needTargetFor`. Thirsty dinos in all three zones now lean toward their own water.
- **"Am I at water" becomes a per-zone question.** `checkNeeds` resolves thirst against the
  drinking dino's own zone terrain instead of the grove's pond.

### Acceptance criteria

- [ ] `zoneTileAt(BOWL_ID, …)` returns a non-null tile kind, and returns `'water'` for the bowl's
      waterhole tiles and `'grass'` elsewhere.
- [ ] The bowl waterhole does not overlap the huddle tile (10,11), the bowl plot tile (2,12), or the
      food-landing row (`foodLanding` y for 20×15), and does not touch the east edge column.
- [ ] A thirsty dino (thirst ≥ `NEED_THRESHOLD`, hunger below it) in **each** of the three zones
      resolves a non-null thirst seek target, and that target is a water tile of its own zone.
- [ ] A thirsty dino standing at its own zone's water has its thirst reset to 0 by the needs tick —
      verified in the bowl and the Fernreach, not only the grove.
- [ ] A dino standing on grass in a zone with water elsewhere does **not** have its thirst reset.
- [ ] The grove's behavior is unchanged: same pond tile target, same drink resolution.
- [ ] The first-pond-sight beat (359) and pond-swap gossip (346) still key on the **grove** pond
      only — a dino in the Fernreach creek or the bowl waterhole does not fire a pond-sight beat
      and is not added to `pondSeen`.
- [ ] The bowl floor still renders (no missing-texture / blank floor) with the terrain path active.
- [ ] E2E: a dino placed at the bowl waterhole with high thirst drinks; the bowl floor renders.
- [ ] Save format unchanged (terrain is derived; needs already persist).

### Out of scope

- No water *rig* work — the water tile rig already exists and is reused as-is (any restyle is the
  Artist's, not this fire).
- No per-zone terrain refactor — that is the newly-seeded BACKLOG-449, deliberately deferred so
  this cycle stays a behavior change rather than an architecture change.
- No drinking animation, no water-level/depletion economy (water is inexhaustible, unlike food).
- No change to thirst rates, the 💧 mark, or `NEED_THRESHOLD`.

### Constraints

- **Do not** generalize `nearPond` / `firstPondSight` / `pondSeen` / `pondSwap` to mean "any
  water". Those are grove lore (359/346) keyed on *the grove's pond*; widening them would
  retro-fire a once-ever beat for every dino near the Fernreach creek and break two shipped
  features. Generalize the **need** path only.
- `grovePondTile` must keep working (it is referenced by name in the grove path and tests); the new
  per-zone lookup may delegate to it rather than replace it.
- Keep terrain pure in `world/zones.ts` — no Phaser.
- Additive only; no save-shape change.

### Cross-track file overlap

Both tracks touch `WorldScene.ts` and both live near `stepDinos`/`needTargetFor`, but on opposite
branches: the lore track adds an escort branch above the food-rush/moping branches (hunger/social
side), the structure track changes the thirst arm of `needTargetFor` and the `checkNeeds` drink
check. **Sequence: structure track first** (it is the smaller, more mechanical diff and touches
`zones.ts` + two WorldScene methods), then the lore track (which adds new state and a new branch to
`stepDinos`). No shared function is rewritten by both.
