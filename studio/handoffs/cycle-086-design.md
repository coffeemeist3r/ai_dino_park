# Cycle 86 — Design (two tracks)

## Lore track — BACKLOG-394 Backed-down gobbler slinks off

**Item:** BACKLOG-394 [emergent] — the denied gobbler's reaction to being stood up to.

**Why this cycle:** Cycle 85 (390) gave the bold winner its moment — it holds its tile and the gobbler
"backs down" — but the *gobbler's* side of that beat is currently silent: `checkFeeding`'s stand branch
flashes 😠 on the winner and files the winner's memory, then the gobbler simply… isn't mentioned. 394
closes the standoff's emotional arc by giving the loser a visible, remembered cost: it slinks off (😖) and
carries a "<bold> wouldn't budge" memory. The same drop now reads from *both* sides — the bold winner's
pride and the gobbler's rebuff — so the contested-drop trio (yield 375 / gobble 387 / stand 390) gains its
first second-person echo. Tiny, clean, no save change; the queued reply the Lore-smith suggested.

**What ships:** When a bold winner stands its ground against a gobbler (the existing 390 stand branch),
the gobbler now also reacts: a 😖 flash over the gobbler, a `logEvent` line ("😖 <gobbler> slunk off — <bold>
wouldn't budge"), and a "<bold> wouldn't budge" memory filed against the gobbler. The reaction fires *only*
in the stand branch (a bold winner) — when the winner is timid and the gobbler actually wins (387), nothing
changes (the gobbler ate, no slink). The memory text comes from a pure builder so it's unit-testable.

**Acceptance criteria:**
- [ ] A pure `slunkOffMemory(boldName)` in `feeding.ts` returns a non-empty string containing `boldName` (e.g. "Rex wouldn't budge"). Unit-tested.
- [ ] When `checkFeeding` takes the 390 stand branch (gobbler present AND winner `standsGround`), the gobbler is flashed 😖 (distinct from the winner's 😠) within the same feeding resolution.
- [ ] After a stand, the gobbler's memory ring contains the `slunkOffMemory` entry (the winner's "stood your ground" memory from 390 is unchanged).
- [ ] When the winner is *timid* (gobbler wins, 387 path), no 😖 flash and no slink memory are filed — byte-identical to cycle 85 (the existing 😤 gobble path).
- [ ] When no gobbler is present (plain eat / 375 yield), nothing slink-related fires.
- [ ] The `__standFood` hook (or a sibling) surfaces the slunk gobbler so an e2e can assert the slink fired on a stand. No save-format change; no bond change.

**Out of scope:** An actual movement-retreat (the gobbler physically stepping away from the food) — the
beat ships as the established flash + memory + log shape (the 😤 gobbler doesn't visibly move either); a
visible retreat-step is a possible follow-up. No bond change (395 owns the social ripple of a witnessed
stand). No collection-book counter (396). No "reputation" effect (397).

**Constraints:** Touch only `world/feeding.ts` (the pure builder) and `WorldScene.checkFeeding` (the stand
branch glue) + the `__standFood` hook. Must not alter the 375 yield, 387 gobble, or 390 stand outcomes —
394 is purely *additive* to the stand branch. No save change.

---

## Structure track — BACKLOG-399 Third-zone terrain identity

**Item:** BACKLOG-399 [core] — give The Fernreach (378) its own ground sub-regions.

**Why this cycle:** 378 opened the Fernreach east of the grove but ships it as plain bowl-grass under a
warm tint (spine only) — `drawFloor` renders a real terrain map *only* for the grove (`groveTileAt`), and
everything else falls through to `bakeTileMap('grass')`. This cycle gives the Fernreach its own ground the
way 294 gave the grove a path band + NE pond: a `fernreachTileAt` layout plus a generalization of the
hard-coded `inGrove` branch into a per-zone `zoneTileAt` dispatch, so any zone in the chain paints its own
terrain. It's the direct "make 378 real" follow-up, it mirrors the proven 294→033 path, and it ends the
Artist's long no-op streak — the Fernreach's new `fern` scrub becomes the first renderable terrain art in
many cycles (its rig is the unblocked work, exactly how 294 unblocked 033).

**What ships:** Walk the keeper grove→Fernreach (off the grove's east edge). Instead of flat tinted grass,
the Fernreach floor now bakes from its own layout: a small **water** seep/creek (reusing the already-drawn
`WATER_RIG` from 033, so it's visibly distinct *today*) and bands of a new **`fern`** scrub kind, arranged
differently from the grove (grove = central horizontal trail + NE pond; Fernreach = e.g. a vertical west
creek + southern fern bands). The `fern` kind has no rig yet, so it bakes as grass-under-warm-tint until the
Artist draws `FERN_RIG` — the floor is always whole (294's exact discipline). The bowl and grove render
byte-identical to today.

**Acceptance criteria:**
- [ ] `fernreachTileAt(x, y, cols, rows)` is a pure fn returning `'water'` for the creek tiles, `'fern'` for the scrub tiles, and `'grass'` elsewhere — its layout is **distinct** from `groveTileAt` (asserted: at least one tile differs in kind between the two over the grid). Unit-tested.
- [ ] `'fern'` is added to the `TileKind` union; an undrawn `fern` kind bakes as the grass fallback (no build break, no missing-rig crash) — the graceful-fallback discipline holds.
- [ ] A per-zone dispatcher (`zoneTileAt(zoneId, x, y, cols, rows)`) returns `groveTileAt` for the grove, `fernreachTileAt` for the Fernreach, and `null` (→ plain grass) for the bowl. Unit-tested.
- [ ] `drawFloor` uses the dispatcher: entering the Fernreach bakes a `terrain_fernreach_*` texture (not the plain `grass` key); the bowl still uses `bakeTileMap('grass')` and the grove still bakes `terrain_grove_*` — both byte-identical to cycle 85. Verified via the floor texture key (a `__floorKey`-style hook) in e2e.
- [ ] The Fernreach floor carries `FERNREACH_TINT` (unchanged from 378); the water seep renders via the existing `WATER_RIG` so a real terrain feature is visible in the Fernreach this cycle, not only after the fern rig lands.
- [ ] No save-format change (terrain is computed from zone id, nothing persisted).

**Out of scope:** The `fern` pixel **rig** itself (the Artist's renderable follow-up, BACKLOG-033-style —
this cycle ships the layout spine + grass fallback). Third-zone resource bias (400). Edge indicator (398).
Any new TileKind beyond `fern`.

**Constraints:** 399 lives in `world/zones.ts` (the pure layout + dispatcher + the `TileKind` union) and
`WorldScene.drawFloor` (the dispatch glue). The only file shared with the lore track is `WorldScene.ts`,
in a *different* method (`drawFloor` vs `checkFeeding`) — no collision; sequence independently. Reuse the
existing `bakeTerrainMap` and `WATER_RIG`/`TILE_RIGS` path exactly (294/033) — do not re-invent the bake.
Keep the boundary clean (no web-llm import).
