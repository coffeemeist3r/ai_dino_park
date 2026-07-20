# Cycle 106 — Structure Handoff

**Intent:** Open Milestone 6's structural spine. The zone became able to *store* food (446) and *spend*
it on its own hungry (444), but nothing ever *moves* banked food between zones — a berry-rich bowl can't
feed a starving Fernreach, and the demand read (438, "this zone wants what it can't grow") points at a
neighbour with no way to actually send anything. **447 makes the demand read a mover:** a crossing dino
ferries banked food from a glutted zone toward a lighter neighbour, the exact food twin of the resource
carry/flow already shipped (329/356/429). It's the foundation the rest of M6 leans on (450 moves the
mouths, 448 names the provider, 449 generalizes the map), so it goes first.

**Complements the lore pick cleanly:** the Lore-smith's 451 (the courier's pride) is the dino-feeling face
of *this* mover — the same crossing that ferries the food earns the courier its pride beat. One seam in
`crossDino`, two tracks. No file collision beyond that shared, intended hook.

**Added to Structure Track:** none — drained from queue (4 open ≥ X=4).

**Chosen this cycle:** BACKLOG-447 — food flows between zones (the food twin of resource carry, ferried on
the visible crossing; the demand read 438 becomes the aim).

**Note for a future fire (Idea Box routing, from the Lore-smith):** when **450 ("scarcity moves the herd")**
is built, weigh the operator's sharper framing — genuinely *zone-exclusive* resources so a body must go
fetch what its home can't supply (a hard scarcity *pull*, past 450's soft prosperity *bias*). Deferred here,
not lost.
