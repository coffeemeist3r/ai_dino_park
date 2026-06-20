# Cycle 61 — Structure Handoff

**Intent:** Put the save's spine in before it bites. The save format is still nominally `version: 1`
but a dozen fields now hang off it additively (friendship/memory/bonds/gratitude/lastTone/keeperId/
zoneId/roles/eggs/born/savedAt/scale), and `deserialize` still gates on an exact version match — a
future `version: 2` save would be *discarded*, not upgraded. The verdict has flagged BACKLOG-040 two
cycles running, and every other open structure item (146 resource tally, 145 crop state, 274 home-zone)
will bolt on more state. So this cycle I pick **040 out of queue order** over the queue-top 146: ship
the version + migration hook *now*, so 146/145/274 each land on a save that can evolve safely instead
of forever accreting optional fields no migration ever validates. This is the Structure-smith's mandate
exactly — the unglamorous spine the whole arc stands on, over the more fun resource beat.

**Cap rule:** 4 open (146/145/274/040) ≥ X=4 → drain mode, **no new items invented**.

**Added to Structure Track:** none — drained from queue (4 open ≥ X).

**Chosen this cycle:** BACKLOG-040 — save format versioning + a migration hook (a `migrate` chain so an
older-version save is *upgraded* to the current shape on load rather than rejected). Pure `saveGame.ts`;
zero overlap with the lore track's `ai/` + greet-glue files.
