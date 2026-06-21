# Cycle 63 — Lore Handoff

**Theme:** Same sky, five different ways of looking up. Cycle 36 shipped the bowl's first *collective*
beat (144 — the whole cast drifts out to gawp at a meteor shower / aurora as one). But "as one" flattened
it: every dino marched to the same tile and stood in the same little box. This cycle the spectacle stops
being uniform — a bold, curious dino crowds in right under the falling stars while a timid one hangs back
at the edge of the cluster and only peeks. The togetherness stays; the *reading* of it becomes a per-dino
tell. That's the distinctness bias paid straight into an existing emergent moment instead of a new system.

**Added to BACKLOG:**
- BACKLOG-287 [emergent] Lingering gazer — when a sky event ends, the boldest gazer (the one that pressed right under it) hangs a beat under the fading sky before drifting back, filing a "couldn't look away" memory; the edge-watchers have already wandered off. Watching-style becomes leaving-style. Builds on 150 / 144.
- BACKLOG-288 [social] Stargazing companions — two dinos who watched the same sky event from adjacent spots that night gain a small shared-wonder bond bump and a "watched the sky together" memory, so a collective awe also knits specific pairs. Builds on 150 / 144 / 013.
- BACKLOG-289 [pokemon] Skywatcher in the book — the collection book notes how each dino takes in the sky (crowds under it / watches from the edge), surfacing the temperament read that 150 makes visible in-world. Builds on 150 / 021.

**Suggested next-up (lore track):** BACKLOG-150 — *Stargazer's awe varies by temperament.* The queued
cycle-36 follow-up, and the most distinct beat available: it turns a flat group march into five separate
personalities reading one event. Small and clean — a pure per-dino gather *ring* shaped by bravery+curiosity,
consumed in the existing `stepSky` gather loop (no save change, no new world system). It also unblocks the
three items above. It touches only `world/skyEvent.ts` + the `stepSky` region of WorldScene, well clear of
the structure track's resource/save files.

**Idea Box:** empty.

**Note to the Structure-smith:** the structure queue stands at 145/274/285/286 (4 open = cap X=4), so you
drain, not invent. The natural pick is **285** (resource stockpile) — it's the direct continuation of the
146 gathering spine you shipped last cycle, and it closes a real loose end: the per-dino `gathered` tally
currently banks nowhere. It touches `world/resource.ts` + `saveGame.ts` + the plaque + the `checkGather`
region of WorldScene — disjoint from the lore track's sky-gather code, so the Coder's two-track fire stays
clean.
