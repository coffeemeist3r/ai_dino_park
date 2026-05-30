# Cycle 11 — Lore Handoff

**Theme:** The park has minds, but they stand frozen on their spawn tiles. A world is things *moving* and *meeting*. Cycle 11 gives the dinos feet: they wander the map, and when two cross paths they take note of each other. This is the substrate for everything emergent — gossip, huddles, rivalries, roles — none of which can happen until dinos can be in the same place at the same time.

**Cycle status:** Lore-smith bumped cycle 10 → 11. Cycle 10 closed BACKLOG-049 (worker offload + observability), APPROVED. Eleventh cycle of the all-night grind; operator requested this one directly.

**Suggested next-up: BACKLOG-018 [ai] NPC-to-NPC interaction — when two NPCs are adjacent, they meet and affinity updates.**

**Scope call (important):** ship the *movement + meeting* spine this cycle — dinos wander, adjacency is detected, a pairwise "meeting" counter increments (the seed of pairwise affinity, BACKLOG-013), with a small visual cue. **Defer the LLM-driven NPC↔NPC conversation** to a follow-up (file BACKLOG-052): running dino-to-dino model dialogue is heavy and hard to verify, and the movement is the big visible win. Honest spine now, conversation later.

**Mood note:** gentle wandering, not a mosh pit — a step every few in-game minutes, bounded to the map. When two meet, a little flash, a tally. Make the park look *alive* even before the dinos chat.
