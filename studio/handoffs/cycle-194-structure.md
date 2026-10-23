# Cycle 194 — Structure Handoff

**Intent:** The milestone's spine, arc 2. A pair that keeps company is two dinos walking near each other. A pair that
keeps a *nest* has a place: a thing drawn on the ground that is theirs, where they lie down side by side, and where
their egg comes from. Today the egg needs a 60 bond on a huddle by the den, which no founding pair is anywhere near;
the pair is the stronger fact, so the pair should be what lays.

**Added to Structure Track:** BACKLOG-622 (text pre-seeded in the lore commit's cycle-194 block, adopted here and
pointered at the top of the Structure Track). Seeded under the milestone duty: the queue holds 4, at X=4, but the
arc had no item. 563 / 581 / 612 / 611 stay in order beneath it.

**Chosen this cycle:** BACKLOG-622 — a pair keeps a nest. The nest rides `pairs` additively (an optional `nest` on each
mate's entry). The resting branch of the wander step gains a nest target ahead of the den; resting dinos draw no
`rand()`, so the RNG stream does not move. Files overlap the lore track (`courtship.ts`, `WorldScene.ts`), so both
tracks ship as one Coder fire again.

**Reachability:** Rex is an owl and rests until 13:00. Rex and Sunny pair at about world step 14, the nest is drawn
where Sunny stood, and Rex walks to it and lies down: the first minute. The egg needs a night both mates rest through
at the nest (~13 real minutes in, at 21:00), so it is the second ten minutes, not the first.
