# Cycle 142 — Design

Two tracks. The lore track lays the ritual's worn ground into the world; the structure track gives the
Ridge the only resource in the park that exists on one ground.

---

## Lore track — BACKLOG-507

**Item:** BACKLOG-507 [emergent] The ritual's mark, laid on the ground.

### Why this cycle

BACKLOG-496 authored `tic_pace` and `tic_circle` in cycle 138-art, and they have been registered in
`PROP_RIGS` and blitted by nothing ever since. Two rigs sitting in a table are the exact shape CHARTER v7
was written against: true, tested, and invisible. Meanwhile BACKLOG-421 has been persisting, per dino per
ground, the precise datum the mark wants — `ticHaunts`, a remembered tile a dino returns to and nudges one
step every stretch it performs there. The mark and its place have been in the repository for four cycles
without ever meeting. This is the meeting.

It also unblocks the rest of 496: with a live host on the ground, the Artist can draw the `fuss` patch in
tonight's fire and Milestone 16's ritual-mark arc closes in one night.

### What ships

A **worn patch of ground under every haunt on the ground you are standing on**.

- When a dino falls into its ritual, `anchorForTic` already lays (or drifts) its haunt for that ground. A
  worn-ground sprite is now drawn on that tile, keyed `tic_<kind>` off the ritual the dino **actually
  performs** (`ticFor` — the echoed one where 407 gave it a friend's, else its own signature).
- The mark **persists after the stretch ends**, because a haunt does. Worn grass does not un-wear when a
  dino walks off, and 421's whole design is a place you keep coming back to. As the haunt drifts, the mark
  moves with it — so a dino four drifts in has visibly wandered its patch across the ground.
- Marks are per-ground: a haunt on the Grove draws only while the keeper is on the Grove, the same
  `zone === this.zoneId` visibility rule the bank heap, the resource glyph and every landmark use.
- **`fuss` draws nothing.** It has no rig, on purpose — 496 reserved it as the per-kind fallback control.
  A dino whose ritual is `fusses over one spot` leaves no mark and the game is otherwise unchanged. Two of
  the five personality axes map to `fuss`, so the fallback path is exercised on essentially every save
  rather than being a branch nobody walks.
- **Grief anchors lay no mark.** 414's edge-pacing deliberately leaves `ticHaunts` alone; that stays true,
  so a dino pacing the edge a friend left by wears no path. A habit it had *before* the grief keeps its
  mark where the habit is, which is correct — the habit is what it comes back to.
- Depth: below the dinos, below the resource and landmark sprites. It is ground, and things stand on it.

### Acceptance criteria

- [ ] A new pure module `game/src/world/wear.ts` exports `wearKey(kind)` returning `tic_<kind>`, and a pure
      `marksOn(...)` that turns a `Haunts` map + a ground id + a `(name) => TicKind | null` resolver into
      the list of marks to draw on that ground.
- [ ] `marksOn` returns entries sorted by dino name (deterministic ordering, never object-key order).
- [ ] `marksOn` omits a dino with no haunt on that ground, and omits a dino whose resolver returns `null`.
- [ ] `wearKey('pace')` is `tic_pace` and `hasPropArt(wearKey('pace'))` is true; `hasPropArt(wearKey('fuss'))`
      is false — the fallback control is asserted, not assumed.
- [ ] In-game: a dino left solitary for `TIC_AFTER_STEPS` steps whose ritual is `pace` or `circle` causes a
      worn-ground sprite to exist at its haunt tile, and none existed there before the stretch.
- [ ] The mark is still present after the stretch ends (company or a need breaks the tic) — it is tied to
      the haunt, not to the stretch.
- [ ] After the haunt drifts, the mark is at the **new** haunt tile and not at the old one (one sprite per
      dino per ground, moved, never accumulating).
- [ ] A dino whose ritual is `fuss` produces no worn-ground sprite, and no error is thrown.
- [ ] Marks on a ground the keeper is not standing on are not visible; crossing to that ground makes them
      visible without a reload.
- [ ] A save restored with `ticHaunts` present draws its marks on the restored ground (the `syncBanks`
      restore precedent — the restore replaces the whole map, so resync).
- [ ] A dev hook `__wornMarks()` returns the marks currently drawn on the active ground, so the e2e drives
      the game's own path rather than a second one.
- [ ] e2e `tests/e2e/cycle-142-wear.spec.ts` covers: a mark appears under a pace/circle ritual, it moves
      with a drift, and a `fuss` dino leaves none.

### Out of scope

- Drawing the `fuss` rig — that is 496's remaining art, and the Artist's fire tonight.
- Wearing the mark *deeper* over repeated stretches (a second worn-ness dimension). One mark, one look.
- Any change to when or how a tic starts, ends, drifts, or is caught. This track adds a renderer and
  nothing else; every 405 / 407 / 408 / 414 / 420 / 421 / 422 / 411 behaviour is byte-identical.

### Constraints

- Pure logic in `world/wear.ts`, Node-testable; Phaser glue stays in `WorldScene` and stays thin.
- Follow `syncBank`'s sprite lifecycle exactly (BACKLOG-504): one sprite per key, destroyed and re-created
  rather than retextured when the object *kind* would change, visibility gated on the active ground.
- No new save fields. `ticHaunts` already persists; this reads it.
- Additive save changes only (none needed here).
- **File overlap with the structure track:** both tracks edit `WorldScene.ts` — this one in the tic/sprite
  region and the dev-hook block, the other in the resource/migration region and the dev-hook block. Do the
  structure track first, then this one, so the import block merges once.

---

## Structure track — BACKLOG-503

**Item:** BACKLOG-503 [core] The branch with nothing to choose — give the Ridge a stake.

### Why this cycle

The Ridge (478) is the only ground in this park a player reaches by *deciding* to rather than by
continuing to walk east, and the branch has been spent on nothing: the Ridge grows what the line grows and
banks what the line banks, so every migration heuristic that weighs it is choosing between two identical
arguments. It is also the operator's own Idea Box nudge from 2026-07-18, which cycle 106 routed to the
Structure Track with an explicit instruction to weigh the hard "zone-exclusive resource → a body that must
go fetch it" framing once 450 was built. 450 shipped thirty-six cycles ago.

### What ships

**Obsidian**, and the climb it creates.

1. **A fourth `ResourceKind`, `obsidian`, exclusive to the Ridge.** Not 348's *lean* — a lock. A new
   `ZONE_EXCLUSIVE` table, consulted by `pickKind` before `ZONE_BIAS`: on the Ridge every roll is obsidian,
   and on every other ground obsidian can never roll (it is not a bias anywhere and the off-kind is always
   a primary, so the other four grounds' rolls are byte-identical to today's). The park's first resource
   with a *place*.
2. **The beacon** — the Ridge's own landmark, three obsidian, raised through the
   `STRUCTURE_BY_BIAS` → `structureRecipe` → `buildStructureFor` path 377/417 already generalised for
   exactly this. Ships on a glyph fallback; the rig is BACKLOG-508. The Ridge stops stacking the bowl's
   cairns off its own off-roll.
3. **The need** — `GRANARY_RECIPE` gains one obsidian. A ground that wants to lift its food cap (454) must
   have had somebody bring black glass down off the mountain. One recipe, one unit: the smallest honest
   requirement that cannot be satisfied without the climb.
4. **The quarry errand** — a new migration destination tier. A migrant whose own ground holds no obsidian
   heads for the Ridge, routed multi-hop through 475's `hopToward`, with a ticker line naming where it is
   going. It sits **below** hearsay (458) and yearning (362) — a ground it has heard is thriving, or one it
   misses, still beats an errand — and **above** the frontier (474) and the appeal read (450), because a
   thing that exists in exactly one place is a harder fact than a comparison of two prosperity scores. A
   dino already standing on the Ridge never quarries.
5. The shard comes home on the existing carry: from a Ridge pile holding only obsidian toward a neighbour
   short of branch/stone, `directedCarry` finds no fillable deficit and falls through to `pickCarry`, which
   moves the obsidian. No carry code is touched.

### Acceptance criteria

- [ ] `ResourceKind` includes obsidian, appended **last** in `RESOURCE_GLYPH`, so every `KINDS`-order
      tie-break in `pickCarry` / `directedCarry` / `spendOne` is unchanged for the existing three kinds.
- [ ] `pickKind(rand, RIDGE_ID)` returns obsidian for every value of `rand` in `[0, 1)` — tested at the
      boundaries 0, 0.5, 0.74, 0.75 and 0.999.
- [ ] `pickKind(rand, z)` never returns obsidian for any `z` in `zoneChain()` other than the Ridge, and
      never for an omitted/unknown zone — tested across the same rand values.
- [ ] `zoneStructure(RIDGE_ID)` is `beacon`; `structureRecipe(RIDGE_ID)` is `BEACON_RECIPE`;
      `buildStructureFor` with three obsidian and the Ridge spends it, and with two returns null.
- [ ] `zoneStructure` for bowl / grove / Fernreach / Hollow is unchanged (cairn / shelter / thatch / cairn).
- [ ] `canBuildGranary` is false for a pile that covers branch and stone but holds no obsidian, and true
      once one obsidian is added (every other granary precondition held constant).
- [ ] A new pure module `game/src/world/quarry.ts` exports the exclusive-kind lookup and
      `needsQuarry(pile)` (true iff the pile holds no obsidian), plus a `quarryDest(home, holds)` that
      returns the next hop toward the Ridge, or null when home *is* the Ridge or the ground already holds
      some.
- [ ] The destination tier order is asserted in a unit test: hearsay > yearning > **quarry** > frontier >
      appeal. A dino primed by word of plenty still goes where it heard, not up the mountain.
- [ ] In-game: standing on the Ridge, every resource that falls is obsidian; standing on any other ground,
      none ever is.
- [ ] In-game dev hooks: `__biasKind(zone, r)` (exists) proves the exclusivity from the production bundle;
      a new `__quarryDest(name)` returns the next hop a named dino would take on an errand, or null.
- [ ] e2e `tests/e2e/cycle-142-obsidian.spec.ts` covers: a Ridge spawn is obsidian, a bowl spawn never is,
      the Ridge's structure reads beacon, and a dino on a ground with no obsidian has a quarry destination
      pointing toward the Ridge.
- [ ] The bank heap (504) counts obsidian like any other unit — `pileTotal` is kind-agnostic and stays so.

### Out of scope

- **A tithe of obsidian on every structure recipe** (`CRAFT_RECIPE` / `SHELTER_RECIPE` / `THATCH_RECIPE`).
  It is the version of this item with the most teeth and it reaches into the constant that
  `directedCarry` (356), `pressuredCarry` (429) and `barterSwap` (358) all read as their deficit driver,
  plus thirteen spec files. File it as the follow-up; it deserves its own verdict.
- Repricing repair or upkeep in obsidian. `REPAIR_COST` and `spendOne` stay kind-agnostic — the founding
  mend (488) must still fire in the first minute of a fresh save.
- Drawing the shard or the beacon. BACKLOG-508, the Artist's fire.
- A crop that only ripens on the Ridge — the item named it as an *alternative* to the exclusive gatherable,
  not an addition. The Ridge already farms its own pine seeds (478).

### Constraints

- Do not loosen or route around the residency invariant or any founding constant.
- The quarry tier must be **deterministic** — first match in `ZONE_LINKS` order, never `Math.random()` in a
  migration destination (BACKLOG-456's catalogue of what that costs the e2e suite).
- Every other ground's resource roll must be byte-identical. Prove it with the boundary-value test above
  rather than by inspection.
- Additive save changes only. Obsidian is a new key in an existing `Stockpile` map, which round-trips
  through the existing save fields with no version bump — the `FOUNDING_PILES` precedent.
- `@mlc-ai/web-llm` stays out of everything here.
- Sequence: build this track first (it lands in `resource.ts` and the migration region), then 507.
