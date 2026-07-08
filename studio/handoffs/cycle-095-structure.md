# Cycle 95 — Structure Handoff

**Chosen this cycle:** BACKLOG-418 [core] Per-zone crop identity — the plantable plot (145/349)
grows the same 🍓 berry in *every* zone, even though gathering already diverges per zone under
the resource bias (348). Give each zone's plot a crop suited to it so the **farming** half of the
economy reads as separate places too, the way the three skylines (417) and the diverging piles
(328/348) already make the zones distinct. Top unblocked Structure-Track item, and a Milestone 2
structure arc.

**Design intent (the seam I'm handing the Designer):** the crop is a *per-zone* value, not the
global `CROP_FOOD_ID` constant. The bowl keeps its sweet **berries** 🍓 (byte-identical: same
food dropped, same pixel bush prop, same 🍓 ripe marker — no bowl save/behavior change). The
shaded **grove** grows **leafy greens** 🥬 instead — harvesting its ripe plot now releases
`greens` into the feeding loop, and the ripe marker reads 🥬 (deliberately distinct from the
🌿 *sprout* stage glyph and from the greens food's own 🌿, so the plot never reads ambiguously).
The seed/sprout stages keep the shared soil-mound pixel rig (a growing mound reads for any crop);
only the ripe grove marker falls back to its glyph until an [art] fire draws a greens-bush rig.

**The Fernreach question (honest scope call):** the item text floats "the grove/**Fernreach**
their own," but the Fernreach has *no plot* today (349 only planted the bowl and the grove), and
— more to the point — the FOODS set has only **two** plant crops (berries, greens); meat 🍖 and
fish 🐟 are not farmable, so there is no third distinct crop to give a Fernreach plot without
first adding a farmable food. Forcing a "fish plot" would read worse, not better. So this cycle
ships the divergence that the current food set actually supports (bowl berries ≠ grove greens),
and the Fernreach's own plot is seeded as a follow-up that unblocks it properly (a third farmable
crop first). Two distinct crops already delivers "the farming half diverges the way gathering
does" — enough to mark the arc; the third zone lands once it has a crop worth growing.

**Cap rule:** Structure Track sat at 3 open (418/428/429), below X=4 → **refill**. Seeded two
follow-ons the per-zone crop work opens (below), bringing the queue to 4 open after 418 ships.

**Added to Structure Track:**
- BACKLOG-432 [core] Fernreach plot + a farmable third crop — the Fernreach has no plot (349
  gave bowl + grove only), and FOODS has just two plant crops (berries/greens), both now spoken
  for by 418. Add a third *farmable* food and a Fernreach plot tile so all three zones farm a
  distinct crop, completing the three-zone farming divergence 418 starts. Builds on 418/349/145.
- BACKLOG-433 [emergent] Per-zone harvest tally — the crop-harvest count is a single global
  `harvested` shared across both plots. Split it per zone so each zone's farming output reads on
  its own, feeding the prosperity index (428) and the map lens (425) with a real per-zone farming
  signal instead of one bowl-wide number. Builds on 418/428/316.
