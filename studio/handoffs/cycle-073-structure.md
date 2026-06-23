# Cycle 73 — Structure Handoff

**Intent:** Finish what cycle 72 started. BACKLOG-333 made dinos actually drift toward
the grove at realtime pace, but `relocate` (274) still *teleports* the migrant to a
random interior tile — the dino just vanishes from the bowl and reappears elsewhere, so
the journey the new cadence finally makes frequent is invisible. BACKLOG-334 makes the
crossing watchable: a migrating dino walks to its zone's linked edge and crosses,
appearing at the far edge like the keeper does. It's the top unblocked Structure-track
item, the verdict-flagged "next beat", and it builds directly on the just-shipped 333.

**Added to Structure Track:** none — drained from queue (5 open ≥ X=4).

**Chosen this cycle:** BACKLOG-334 — visible zone crossing (the migrant walks to the
linked edge and crosses; the deterministic `__migrate` teleport stays for tests/restore,
only the *ambient* roll becomes a visible walk).

**Collision note for the chain:** 334 touches WorldScene migration (`maybeMigrate` /
`relocate`) + a new walk branch in `forceStep`, plus pure edge math in `zones.ts`. The
lore pick (181, sleep murmurs) touches the den-render / brain path — disjoint from
migration. Both share `forceStep` only as separate branches (the cycle-72 precedent),
so sequence the 334 walk branch before the 181 murmur hook and the fire stays clean.
