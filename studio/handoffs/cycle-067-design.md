# Cycle 67 — Design

Two tracks, low cross-collision: the lore track surfaces existing data in the collection book; the
structure track adds a per-zone floor. No shared hot path.

## Lore track — BACKLOG-303: Signature quirk in the dossier

**Item:** BACKLOG-303 [pokemon] — name each dino's idle fidget in the collection book.

**Why this cycle:** Cycle 66 gave every idle dino its own fidget (298), but it's a live glyph you have
to catch above its head while it wanders. The collection book is where the player reads *who a dino is*
— hearts, role, lineage — and it's silent about the new resting-character beat. Surfacing the signature
quirk there turns a fleeting tell into a kept fingerprint, for almost no code and zero risk (it reads
the deterministic `fidget()` output already shipped).

**What ships:** Open the collection book (V to the 📖 lens). Under each dino's heart/bond line there is a
new line naming its signature idle quirk — e.g. `Rex` shows `· paces` and a timid dino shows
`· peeks around timidly`. The text is the `label` of that dino's `fidget()` quirk (the same quirk whose
glyph shows above its head when it wanders), so the book and the live mark always agree. Deterministic
from the name-seeded traits — no model, no save change, identical every reload.

**Acceptance criteria:**
- [ ] The 📖 book shows, for each dino, a line containing its signature quirk label (the `fidget(traits).label`).
- [ ] The quirk label rendered in the book matches that dino's live idle quirk (`__fidget(name).label`).
- [ ] The quirk line is distinct from the role/hearts/lineage/rumor lines (a separate readout, not a relabel).
- [ ] Across the founder roster, the book shows at least 3 distinct quirk labels (distinctness, not sameness).
- [ ] No model and no save are involved — the line is identical after a reload.

**Out of scope:** the activity-tally fingerprint (299, "usually gathering"); contagion/mood-shading
(301/302); any change to the live above-head mark or the underlying `wandering` activity.

**Constraints:** Do not change `fidget()` or `refreshActivityMarks` behaviour — only read `fidget()`.
`lenses.ts` must stay Phaser-free (it receives the label as a plain string via `BookRow`; it does not
import `fidget`). Keep the cycle-66 `__fidget`/`__activityMark` specs green.

## Structure track — BACKLOG-294: Grove terrain

**Item:** BACKLOG-294 [core] — give the grove its own ground (distinct floor tint + path/water
sub-regions defined in `zones.ts`).

**Why this cycle:** The grove has been walkable since cycle 59 (143) but renders as cloned bowl grass —
it's a copy, not a destination. A distinct floor makes the second zone read as its own place and hands
the long-benched path/water tile art (033) the sub-regions it can finally land in. Purely additive: the
grove draws empty of dinos today, so a distinct grove floor cannot regress the bowl.

**What ships:** Walk the keeper off the bowl's east edge into the grove. The grove floor now reads
visibly different from the bowl — a cooler, shaded tint over the ground — and its layout defines a worn
**path** strip and a small **water** pond as sub-regions (in `zones.ts`, pure data). Walk back west and
the bowl floor is unchanged. The path/water **pixel tiles** themselves are the Artist's job (033, same
cycle); until/where a tile rig is missing, those sub-region tiles bake as grass under the grove tint, so
the floor is always whole — the tint alone already makes the grove a distinct place.

**Acceptance criteria:**
- [ ] `zones.ts` exposes a pure `groveTileAt(x, y, cols, rows)` returning `'grass' | 'path' | 'water'`.
- [ ] The grove layout includes at least one `path` tile and at least one `water` tile, and the rest grass.
- [ ] Crossing into the grove swaps the floor to a visibly distinct render (a grove tint); crossing back to the bowl restores the untinted grass floor.
- [ ] The bowl floor render is byte-identical to before (the cycle-48 grass spec stays green).
- [ ] A dev hook reports the active floor (zone + texture key + whether tinted) so the swap is testable.

**Out of scope:** the path/water pixel rigs (033, Artist); per-dino grove population/migration (274);
zone-scoping the bowl props so they stop drawing over the grove (308, next cycle); any save change.

**Constraints:** Bowl rendering must not change. The floor must swap on both `tryCrossZone` (real walk)
and the `__setZone` dev hook (so e2e can drive it). Keep the cycle-59 connected-zone specs and the
cycle-48 grass spec green. `bake.ts` stays thin glue; the terrain *layout* lives pure in `zones.ts`.

## Cross-track note for the Code-planner
No shared file in the hot path: 303 touches `ui/lenses.ts` + `WorldScene.bookRows()`; 294 touches
`world/zones.ts` + `art/tileArt.ts`/`art/bake.ts` + `WorldScene` floor render (`drawFloor`). The only
shared file is `WorldScene.ts`, in **different methods** (`bookRows` vs `drawFloor`/`tryCrossZone`) — no
ordering hazard. Build either first.
