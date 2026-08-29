# Cycle 144 — Structure Handoff

**Intent:** Close the second-to-last arc of Milestone 16 by fixing the thing the milestone's
*last* shipped item found on its way out. `isUnsettled` (474) asks "no residents, no pioneer,
not the origin", and `isOrigin` names exactly one ground — the bowl — because 343 records a
pioneer at *arrival* and nothing records one at spawn. That was harmless while the bowl was the
only ground anybody woke on. CHARTER v7's spread cast (486) and BACKLOG-500 ended that: four of
the six grounds have residents from the first frame and **not one of them has a pioneer**, so the
moment any of them empties the park calls ground its cast has lived on since frame zero a place
nobody has ever seen — lights the frontier badge on it and aims the migration tier at it over an
inhabited neighbour. Tonight's job is to record a founding as a founding.

**Added to Structure Track:** none — drained from queue (4 open ≥ X=4).

**Chosen this cycle:** **BACKLOG-512** — the frontier read calls lived-in ground unlived-in.

## Why 512 and not the other three

- **495 (the founding fixture)** is the queue's oldest and it is genuinely load-bearing, but it is
  test-scaffolding: it changes what a *spec* costs, not what a player sees. It also wants a stable
  founding state to declare, and tonight moves one — a fixture written the night before a founding
  record changes is a fixture written twice.
- **501 (the reachability register)** is the other open milestone arc and is the instrument that
  should have caught 512 before a spec did. It is deliberately deferred one cycle: the register's
  first entries are the standing founding claims, and "every ground the roster spawns on has a
  pioneer" is about to become one of them. Building the register first means writing an entry for
  a claim that is currently false, then editing it the next night. Build the truth, then the
  instrument that pins it.
- **509 (the tithe)** is the sharpest item in the queue and the one most likely to cost a full
  cycle of red specs — 142's evidence says the *milder* version turned thirteen e2e specs red. It
  also has two open design decisions the item names out loud. It deserves its own cycle with the
  Designer's full attention, not a night shared with a text-seam pass on the lore track.

## Collision check against the lore track

The lore pick (499) rewrites how a **zone name is rendered into a sentence** — display strings,
six templates, one naming seam. 512 rewrites how a **zone's founding is recorded** — the settle
memory, the pioneer record, `isUnsettled`. Both will touch `zones.ts`, but at opposite ends: 499
at `ZONES[].name`, 512 at the founding/settle records that key off `ZONES[].id`. Names and ids do
not meet. Clean two-track fire; flagged for the Coder anyway.

## The bar, before the Designer touches it

CHARTER v7 applies, and 512 has an honest trap in it: the *correct* fix makes a badge stop lighting
where it wrongly lit, which on a fresh untouched save is a change from nothing-visible to
nothing-visible. That is not what ships. What must ship alongside it is the read that replaces the
wrong one: an emptied ground reads **hollowed** (460), which is what it is, and the frontier badge
stays on the Saltpan where it belongs. The Designer should spec the visible half — what the player
sees when a ground *does* empty — as part of the item, not as a follow-up. 505's second candidate
becomes buildable on purpose the same night this stops being true by accident.
