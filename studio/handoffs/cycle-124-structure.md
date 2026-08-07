# Cycle 124 — Structure Handoff

**Intent:** Close Milestone 11's structure track, and do it on the item that exists to stop an accretion
rather than to add one. The lens box currently ends its prosperity line like this:

```ts
`${prosperityBadge(e.tier)}${e.declining ? ` ${declineGlyph()}` : ''}  🌾${e.harvested}` +
  `${e.spend ? ` ${spendGlyph(e.spend)}` : ''}${e.work ? ` ${workGlyph(e.work)}` : ''}`
```

Five independent reads on one line, two of them governance and three of them not, each appended by the
cycle that invented it. 468 added 🍽️/🏦 to the end of the prosperity line because at the time there was one
governance call and the end of a line was a fine place for it. 473 added 🧺/🧱 by copying that. A third call
would copy it again, and by then the line is a wall of glyphs whose only documentation is the git log — the
player has no way to learn that two of those five icons are the same *kind* of fact. Worth saying plainly:
last cycle's Validator withheld a crowding glyph specifically so that it would not become the sixth, and the
Artist fire logged the same read from the other side. Two stages in a row have now flagged this line.

**Added to Structure Track:** **BACKLOG-478**, **BACKLOG-479**, **BACKLOG-480** — the refill the cycle-123
handoff said would be this fire's first job. The queue stood at 2 open (466, 477), below X=4; with the refill
and this cycle's pick it stands at 4 (466, 478, 479, 480).

The three were chosen against what Milestone 11 actually taught rather than by theme:

- **478 (the chain forks)** — 475 built a BFS hop table over an adjacency graph that has never branched.
  Every ground has at most one east neighbour, and `zoneChain` derives the whole drawing order by walking
  east links from the westmost zone. M10's finding was that the code generalizes and the assertions don't;
  a fifth ground hanging off the *middle* of the chain is the cheapest honest test of whether the distance
  layer is one of them.
- **479 (more than one voice on the call)** — 477 makes the ground's calls legible, which is exactly the
  moment to notice there is only one decider. Governance today is a monarchy, and 031 has been deferred
  since cycle 1 for want of a *set* of deciders. A derived per-zone council is the seam a vote plugs into.
- **480 (a landmark that has to be kept up)** — the build arc is now the only economy in the park with no
  running cost. Food spoils, yield depletes, structures are permanent and free, which is why a zone's
  structure count only ever climbs. 455's lesson applied to walls.

**Chosen this cycle:** **BACKLOG-477 — both of the ground's calls, on the lens.**

Not the top pointer (466, the dry season), and it is the third cycle running to take that one-line
off-order justification: 477 is Milestone 11's last structure arc and 466 is not, and the milestone rule
puts checklist-advancing picks first. 466 has now held the head of the queue for three cycles and should be
the pick the cycle after this milestone closes, ahead of all three items seeded above.

**Shape (the Designer is free to override):**

The item's own text names the generalization it wants — *a third call later is a row, not a redesign* — so
the deliverable is a **table**, not a formatted string. In `world/governance.ts`, beside the two enums and
their glyph functions that already live there:

- one `GovernanceCall` descriptor per decision (`{ name, options: [{ value, glyph, meaning }] }`), and a
  `GOVERNANCE_CALLS` array holding them in display order. A third call is then a literal new entry.
- `governanceLine(values)` — the calls' glyphs folded into one compact line for the box, in table order,
  driven off `GOVERNANCE_CALLS` rather than off two hand-written ternaries.
- `governanceLegend()` — the same table rendered as `[?]`-panel lines, so the legend cannot drift from the
  glyphs it explains. This is the half that makes the item worth doing: a glyph a player can't decode is
  decoration.

One thing the Designer should rule on explicitly, because it is the only real design decision here: **what
a partly-decided ground renders.** A ground with a spend call and no work call must not render a bare 🍽️
that a player will read as position one of two — an unset call wants a placeholder so the row's shape stays
honest. Recommend it; a compact fixed-width row is the whole point of folding them.

Then WorldScene drops both glyphs off the prosperity line and draws the governance row as its own line in
the box (the box grows a line; it already grew for 446). And `ui/controlsHelp.ts` appends the legend to the
panel it already renders.

**No collision with the lore track.** 360 lives in the migration departure seam, one new pure module reading
the memory ring, and `bonds`. 477 lives in `governance.ts`, the lens draw, and `controlsHelp.ts`. Neither
touches the save shape. They meet only in `WorldScene.ts`'s import list and in different methods, so the
Coder can build them in either order.
