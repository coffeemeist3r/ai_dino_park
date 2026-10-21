# Cycle 193 — Structure Handoff

**Intent:** The milestone's spine. A courtship that only writes a book line is a fact you read. A pair the player can
watch is two dinos that stay near each other all afternoon while everyone else wanders. That needs the pair to be
state (in the save, survivable across a reload) and to change what the wander step does.

**Added to Structure Track:** BACKLOG-620, seeded under the milestone duty (the queue holds 4, at X=4, so the cap rule
alone would not seed; MILESTONE.md's structure arc needs a spine and nothing queued is it). The four queued items (563,
581, 612, 611) stay in order beneath it.

**Chosen this cycle:** BACKLOG-620 — a pair keeps company. It reuses the youngster's `tetherStep` leash (BACKLOG-607)
unchanged, applied after the wander draw, so the RNG stream is untouched. The files overlap the lore track (one new pure
module, `WorldScene.ts`, `saveGame.ts`), so the two tracks ship as one Coder fire.
