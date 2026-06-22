# Cycle 69 — Structure Handoff

**Queue state:** 2 open (308 / 309) after cycle-68 abandoned 293 → below cap X=4, so **brainstorm to
refill, then pick** (per CHARTER v5 drain-before-invent: the cap forces a refill only because we dipped
under it).

## Refill — three new structural items appended

- **BACKLOG-314 [core] Zone-aware resource spawn** — resources roll *per active zone* (today they only
  ever land in the bowl-coordinate space), so the grove grows its own gathering economy now that it has
  residents (274) and zone-scoped objects (308). Builds on 146 / 274 / 308.
- **BACKLOG-315 [emergent] Dino-built shelter** — at a higher stockpile threshold a dino crafts a second,
  larger structure (a lean-to / windbreak) beyond the cairn, placed + persisted like the cairn but
  zone-scoped, becoming a landmark of the zone it's built in. The next resources→build beat. Builds on
  286 / 308 / 309.
- **BACKLOG-316 [core] Zone indicator** — a small two-zone readout (which zone the keeper is in + the
  population in each) so the split world is legible without walking it. Builds on 143 / 274.

Queue now: 308 / 309 / 314 / 315 / 316 = **5 open** ≥ cap. Future cycles drain before inventing again.

## Pick — BACKLOG-308 [core] Zone-scoped world objects

The top unblocked item and the cycle-68 verdict's explicit next pick. The grove is inhabited (274) and
has its own floor (294), but every world *object* — the one in-play resource, the crafted cairns, the
plot — still draws and interacts in bowl coordinate space regardless of the active zone, so the grove's
terrain is overlaid with bowl-built props seen through the zone switch. 308 is the object counterpart to
274's dino work: each object carries a home zone; it renders + is interactable only there.

**Scope (spine, minimal):**
- The resource carries the zone it fell in; it draws + is gatherable only in that zone.
- A cairn carries the zone its crafter built it in; it draws only in that zone (additive `zone` save
  field on the existing `cairns` array — old saves backfill to the bowl on restore, no `SAVE_VERSION`
  bump, matching the `dinoZones` precedent).
- The plot is a fixed bowl installation — it draws + is workable in the bowl only (a per-zone plot is
  deferred; the plot is singular and was always a bowl feature).

**Deferred:** per-zone resource *spawn cadence* is 314, not this item — 308 only scopes the objects that
already exist. Dino-built structures beyond the cairn are 315.

**Collision check vs lore (312):** 312 edits `keeper/scan.ts` only; 308 edits WorldScene rendering +
`world/saveGame.ts`. No shared lines. Both share WorldScene the file but at disjoint sites (scan panel
text vs object visibility / spawn / gather), exactly as 306/274 did last cycle.
