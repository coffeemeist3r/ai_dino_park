# Cycle 66 — Design

Two tracks. Lore = BACKLOG-298 (idle fidgets). Structure = BACKLOG-145 (plantable plot).

---

## Lore track — BACKLOG-298 Idle fidgets

**Item:** BACKLOG-298 [emergent] Idle fidgets.

**Why this cycle:** Cycle 65 made the bowl legible — a per-dino glyph (295) tells you each dino's current intent. But the most common intent by far is the goalless `wandering` state, drawn for everyone with the same generic 🚶. So the bowl's resting state is still five identical drifting walkers — exactly the cross-dino sameness the CHARTER calls a defect. This turns idle time into a personality tell: a wandering dino shows *its own* signature quirk instead of the generic walker glyph.

**What ships:** While a dino's activity is `wandering` (the 295 catch-all — no food/huddle/gather/social/sky/inspect/respond goal), its activity mark shows a **signature idle quirk** derived from its personality instead of 🚶. The quirk is keyed to the dino's **most-pronounced trait** (the axis furthest from neutral): a bold dino paces 🐾, a timid one peeks around 🫣, a curious one pokes at the glass 👆, a social one looks for company 💭, an energetic one bounces 🤸, a calm one dozes on its feet 😪, etc. Deterministic from the name-seeded traits (010), so each founder reads distinctly and the same dino always idles the same way. The other 295 states (🍖🪵💬💤✨👀🆘) are unchanged — only the wandering catch-all becomes per-dino. No motion change to wandering (they still drift via `wanderStep`); the quirk rides above them. No LLM, no save.

**Acceptance criteria:**
- [ ] A wandering dino's activity mark shows a trait-derived quirk glyph, not the generic 🚶 (verify via a new `__fidget(name)` hook + the rendered mark text).
- [ ] The quirk is deterministic from the dino's traits — `__fidget(name)` returns the same quirk across calls/reloads for the same dino.
- [ ] The founding cast is not uniform: at least 3 distinct quirk glyphs appear across the 5 founders (Rex/Mossback/Sunny/Twitch/Glade).
- [ ] A bold-dominant dino (`bravery` furthest from 0.5 and high) resolves to the pacing quirk; a timid-dominant one to the peek quirk (the two named examples are pinned).
- [ ] The quirk only governs the `wandering` state: a dino actively feeding/gathering/huddling/socializing still shows its 295 state glyph (🍖/🪵/💤/💬), not its idle quirk.
- [ ] No quirk glyph collides with an existing 295 activity glyph (the quirk set is disjoint from ACTIVITY_GLYPH's values).
- [ ] `npm run build` clean; full unit + e2e suite green; the cycle-65 (295) activity specs stay green (`__activity` still returns `wandering` for an idle dino — only the *displayed glyph* changed).

**Out of scope:** Bespoke per-quirk *motion* (pacing back-and-forth vs standing still) — the glyph carries the read; motion is a later polish. Contagion between neighbours (301), mood-shading (302), and the book line (303) are follow-ups. No new randomness/timers — the quirk is a static signature this cycle.

**Constraints:** Must not break the Z/E dialog or the 295 readout. The quirk lives in a new pure module (`world/fidget.ts`) — no Phaser, no `ai/` import (take a structural `Personality` arg). Keep the boundary: nothing new under `ai/`. Note file overlap with the structure track: both touch `WorldScene.forceStep`/the per-dino mark refresh — see Constraints under the structure track for sequencing.

---

## Structure track — BACKLOG-145 Plantable plot

**Item:** BACKLOG-145 [emergent] Plantable plot.

**Why this cycle:** The build arc has shipped its gathering half three cycles running (146 gather → 285 stockpile → 286 craft), but the bowl still grows *nothing the cast eats* — food only ever falls from the keeper's hatch. The plantable plot is the Stardew-flavoured counterpart and the long-benched (queued since cycle 35) farming spine: a keeper-planted crop that grows over realtime-clock days and harvests back into the existing food loop, so the bowl finally produces its own feed.

**What ships:** One fixed **plot tile** in the bowl, drawn with a stage glyph. The keeper stands adjacent (Chebyshev ≤ 1) and presses **P**:
- **Empty plot → plant.** Stamps the current in-game day as the planted day; the plot shows 🌱 (seed).
- **Growing plot → "not ready" note.** A brief log line; nothing else.
- **Ripe plot → harvest.** Releases the crop as a **🍓 berries** food drop *at the plot tile* (reusing the feeding-hatch drop path, so the cast rushes it exactly like a hatch drop and the favorites loop 061 applies), resets the plot to empty, and bumps a persisted harvest tally.

The crop grows over **realtime-clock days** (105) through visible stages, read purely from days elapsed since planting: `seed` (day 0) → `sprout` (after 1 day) → `ripe` (after 2 days). A one-off **"🍓 the crop ripened"** log note the step it crosses into ripe (legibility, mirroring 297's spawn note). The plot + harvest tally persist **additively** in the save (no `SAVE_VERSION` bump, exactly like `cairns`/`stockpile`); an older save loads with an empty plot and zero harvested.

**Acceptance criteria:**
- [ ] Standing adjacent to the empty plot and pressing **P** plants a seed: the plot glyph becomes 🌱 and `__plot()` reports `{ plantedDay, stage:'seed' }`.
- [ ] Pressing **P** away from the plot (not adjacent) does nothing (no plant, no error).
- [ ] As in-game days pass, the plot advances seed → sprout → ripe at the documented day thresholds (verify with the existing `__setClock`/clock-advance hook + a pure `cropStage(days)` unit test).
- [ ] Pressing **P** adjacent to a **ripe** plot harvests: a 🍓 food drop appears at the plot, eligible dinos rush it (reuses the feeding swarm), the plot returns to empty, and the harvest tally increments.
- [ ] Pressing **P** adjacent to a **growing** (not-ripe) plot does not harvest and does not reset the plot (a "not ready yet" note only).
- [ ] The plot + harvest tally survive a save/load round-trip; a save with no plot field loads cleanly (empty plot, 0 harvested) — additive, no version bump.
- [ ] The crop ripening logs a one-off "🍓 the crop ripened" note the step it becomes ripe (not every step after).
- [ ] `npm run build` clean; full unit + e2e suite green; the cycle-59/62 feeding + save round-trip specs stay green.

**Out of scope:** Multiple plots, multiple crop types, watering, fertilizer, crop death/withering, dino-run farms, automation, choosing what to plant (one plot, one crop — 🍓 berries). Seasonal growth-rate variation. A plot that blocks movement (it's a marker, not a wall).

**Constraints:** Reuse the feeding drop path for harvest (do **not** reinvent food spawning) and the realtime `WorldClock.now().day` for growth (no second timer). Pure growth logic (`cropStage`, day thresholds) in a new `world/plot.ts` (no Phaser); WorldScene owns the P-key handler, the sprite, the drop, and persistence. Additive save only. **Cross-track file overlap:** both tracks touch `WorldScene` — the lore track edits `forceStep`'s wandering branch + `refreshActivityMarks`; this track adds a **P** key handler + a `checkPlot()`/ripen-note call (model it on `checkFeeding()`/`maybeSpawnResource()` at the tail of `forceStep`) + save fields. They live in different methods/lines; sequence the lore-track `forceStep` edit first, then add the structure-track `checkPlot()` call at the tail, so neither clobbers the other.
