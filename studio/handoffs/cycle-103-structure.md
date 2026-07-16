# Cycle 103 — Structure Handoff

**Intent:** Lay the spine for Milestone 5 ("No one goes hungry"). The whole milestone rests on one missing
piece: **banked food**. Today a harvest drops into the feeding loop and is eaten — nothing is stored, so
the demand read (438) has nothing to point at, a carrier has nothing to ferry (444), and a zone rich in
crops can't feed a starving neighbour. **BACKLOG-446** adds the food twin of the resource pile (285/328):
a per-zone food stockpile, a share of each harvest banks by food id (capped like resources), read on the
zone-map lens. It's the foundation 444/447/438 all build on — you can't ferry, spend, or read food you
never stored. Pairs cleanly with the lore track's shared-meal bond (373): different files (new
`world/foodstore.ts` + the `harvest` bank hook + the lens vs. the `eatFood` bond hook).

**Cap rule:** Structure Track open was **3** (444/445/446) < X=4 → brainstorm to refill, then pick.

**Added to Structure Track:**
- BACKLOG-447 [core] Food flows between zones — carry banked food (446) along the existing zone link, the food twin of resource carry (329/429), so the demand read (438) becomes an actual mover.
- BACKLOG-448 [emergent] Provider role — a persistent role for the dino that banks the most harvest into its zone's food store (446), read like the hoarder role off feed tallies (064/032).

**Chosen this cycle:** **BACKLOG-446** — A zone banks its harvest: a per-zone food stockpile (`FoodPile`,
food-id → count, capped), a share of each harvest banked, read on the zone-map lens. Also drafted the
Milestone 5 **Structure arcs** checklist (446 / 444 / 445) into `studio/MILESTONE.md`.
