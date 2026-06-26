# Cycle 80 — Structure Handoff

**Intent:** Answer the structural half of the operator's hunting/hunger/thirst/death nudge with the
**need-drive spine** — the foundation a food web, hunger-voice, and (if the operator ever rules it in)
mortality all stand on. The bowl has gathered, stockpiled, crafted, farmed, and migrated for twenty
cycles, but a dino has never *wanted* anything on its own clock: food only matters when the keeper drops
it. This gives each dino two trait-shaped drives — hunger and thirst — that build over realtime and
resolve through actions that already exist (eat at the hatch → hunger 0; reach the pond water the grove
already has → thirst 0). Deliberately minimal and **deathless**: a 🍖/💧 tell over a dino in want, no
wander-pull, no decay-to-death. That keeps it shippable small and parallel-clean with the lore track
(the loner touches the wander-decision branch + greet gain; this touches the forceStep tail + marks +
save — disjoint), and it lets the operator feel out mortality with the need-drive already in hand before
making the CHARTER call.

**Cap rule:** 3 open in the Structure Track (356/357/358) — below X=4, so I brainstormed. Added **one**
structural item (the need-drive spine); its wander-pull follow-up is noted inline as 372, not yet queued.

**Added to Structure Track:** BACKLOG-371 (need-drive spine — hunger/thirst values + 🍖/💧 tell + resolve-on-eat/drink, no death).

**Chosen this cycle:** **BACKLOG-371** — the spine the operator's nudge needs before hunting (367) or
hunger-in-voice (368) can land. Reuses the pond-water proximity (`nearPond`, arrival.ts) for thirst and
the existing eat site (`eatFood`) for hunger; pure `world/needs.ts` for the value math.
