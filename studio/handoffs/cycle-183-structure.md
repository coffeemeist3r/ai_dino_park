# Cycle 183 — Structure Handoff

**Intent:** Milestone 28's spine. A festival needs a calendar and a gathering before anything can happen at it: on the
first day of each season, at mid-morning, every ground's residents come to the bowl pond and go home afterwards. The
sky event (144) is the template for the gather walk; the new part is that guests from other grounds enter the bowl
for the festival and leave it again, without the full migration side effects (founding, carries, tenure resets).

**Reachability:** a fresh save boots at day 1, 08:00, at 60x. Day 1 is the first day of spring. The festival opens at
10:00, two real minutes in, and closes at 12:00. Watching the bowl, the player sees five guests walk in from the
east edge and ten dinos ring the pond.

**Added to Structure Track:** BACKLOG-596 (the gathering), BACKLOG-597 (each season's rite + a drawn mark). Seeded
under the tentpole exemption (CHARTER v9), queued above 563/581 because both tracks serve only the tentpole.

**Chosen this cycle:** BACKLOG-596 — the festival gathering.

**Collision check:** 594 (leader + sulker) reads the attendee list 596 builds. One Coder fire, one new module
(`world/festival.ts`) shared by both tracks: 596 owns the calendar, the guest walk and the save field; 594 owns
the leader/sulker picks, the rings and the lines.

**Solo cycle:** not declared. The spine and the first lore arc land together at a playable seam.
