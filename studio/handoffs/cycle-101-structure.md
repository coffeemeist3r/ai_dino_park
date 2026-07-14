# Cycle 101 — Structure handoff

Structure Track (top = next): 438, 436, 444, 445 — 4 open.

## Structure pick — BACKLOG-438: A zone wants what it can't grow

**Milestone 4 structure arc.** Milestone 3 gave the supply side of "enough to go around": a glutted zone
sheds resources toward a lighter neighbour (429). 438 opens the **demand** side, keyed to *farming* output
this time. Each zone farms exactly one crop (cropOf: bowl→berries, grove→greens, Fernreach→roots, 418/432)
and its harvest already reads on its own (433). So every zone is *structurally* light on the two crops it
can't grow. 438 makes that a legible **want**: a zone's carry-request leans toward the linked neighbour
producing the most of a crop it can't grow itself — a demand signal that follows the productive farmer.

**Shape (Designer to spec).**
- Pure `zoneWant(zone, harvests)` in `ui/lenses.ts`: among the zone's linked neighbours (`zoneNeighbors`)
  whose crop (`cropOf`) differs from this zone's own, pick the one with the highest harvest output
  (`harvestedByZone`, the 433 tally). Returns `{ food, glyph, from, fromName }` or **null** until some
  neighbour has actually grown a surplus (output > 0). Deterministic — strict `>` so the first neighbour in
  link order wins a tie.
- `ZoneMapEntry` gains `want`; `zoneMapModel` attaches `zoneWant(id, harvests)` per entry (defaulted
  `harvests` so older 3/4-arg callers stay byte-valid).
- WorldScene `drawZoneMap` renders a fourth label line — `wants <glyph>◂<neighbour>` — only when `want` is
  non-null. Reuses the crop's ripe glyph (cropOf) and the neighbour name.

**Honest scope (ponytail).** There is no banked food and no food-carry today (harvest drops straight into the
feeding loop). So 438 ships the **demand read**, not a food mover — the request is surfaced, not yet
fulfilled. The actuator is already queued (444 a carrier feeds the hungry), and it needs a food store to move,
which nothing provides yet — so I seed that missing spine below. This is the same seam 429 sat behind before
piles existed: read first, flow later.

**Disjointness from lore (442).** 442 touches `world/foodweb.ts` + the `forceStep` stalk/flee pass; 438
touches `ui/lenses.ts` + `drawZoneMap`. Shared file is only `WorldScene.ts`, in two non-overlapping regions.

## Queue refill

Picking 438 drops the queue to 3 open (436/444/445 < cap X=4), so seed one — the spine the demand arc will
need to actually move food: **BACKLOG-446 [core] A zone banks its harvest** (a per-zone food stockpile, the
food twin of the resource pile 285/328), the store both 438's demand and 444's carrier are missing. Structure
Track back to 4 open.

438 → [~]. phase → designer-pending.
