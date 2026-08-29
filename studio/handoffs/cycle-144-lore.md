# Cycle 144 — Lore Handoff

**Theme:** A cycle about the park saying its own place names correctly, and about drawing
the mark a first-comer leaves. Milestone 16's three lore arcs all closed last cycle, so the
lore track spends this one on the loudest un-fixed thing a player actually reads: every
governance beat in this park prints a doubled article. The park has spent seven cycles
teaching its grounds to announce themselves, and each announcement says *"the The Grove"*.

## Cap rule

- **Social/emergent queue:** 214 open, cap 12 → **no new social items seeded.** The cycle is
  themed and a next-up is suggested from what is already queued, per routine 1.
- **Art queue:** 0 open, cap 3 → **seeded 2 art items.** This is the first fire since cycle 90
  to seed into an empty art queue: every prop key and all four terrain kinds are drawn, so
  the seeds have to name *new subjects the world is about to acquire* rather than fallbacks
  left standing. Both are standalone prop rigs, so the cycle-91 stash-ahead rule permits them
  to be drawn before their host system exists.

## Added to BACKLOG

- **BACKLOG-513 [art] The founder's stake** — a prop rig for the mark a ground's first-comer
  leaves: a driven stake with a bound cross-piece, weathered by the ground it stands on. The
  structure track is tonight recording a founding as a founding (512), which gives every
  ground a pioneer for the first time; a pioneer with no mark on the ground is another true,
  invisible fact. Renders standalone via `bakePropArt`, so it may be drawn ahead of the tile
  that plants it.
- **BACKLOG-514 [art] The stake that outlived its ground** — the leaning variant of 513, for a
  ground that *was* settled and has emptied (the `hollowed` read, 460): same rig, canted, the
  binding gone slack, the ground's own colour crept up the shaft. The pair is the point — one
  glyph that reads *somebody got here first* and *and then they left* depending only on which
  variant is baked, so a hollowed ground is legible at a glance rather than through a lens.

## Suggested next-up (lore track this cycle)

**BACKLOG-499 — the ground with two articles.** Off-milestone, and the justification is that
Milestone 16's lore arcs are all `[x]`: the two arcs still open are both structural, and the
lore track has nothing of its own left in the milestone to advance.

It earns the slot on the reachability bar rather than on ambition. `ZONES` carries the article
inside each display name (`The Grove`, `The Hollow`, `The Sunward Ridge`, `The Saltpan` — four
of six now) and six templates prepend another, so the park reads *"the The Grove's council
calls it"* on the first governance beat a player sees, which since 488 and 492 is within the
first step of a fresh save. Two source files already carry a comment warning the next author
about this exact hazard (`foodstore.ts:91`, `brain.ts:214`) — which is the tell: the park knows,
in prose, in two places, and has never fixed it in one.

The fix wanted is **one decision made once**, not a `slice` at the loudest call site — that is
precisely how the second article arrived. Either the names lose their articles and every
template supplies one, or the templates stop supplying one and the names keep theirs; whichever
way, there should afterwards be exactly one seam that answers "how do I name a ground in a
sentence", and the six call sites should go through it. Arc-sized because the six are not six
of a kind: a council call, a bill call, an upkeep line, a discontent grumble, a handover beat,
and the lens legend, plus the barter-edge lines that name *two* grounds in one sentence and the
brain context that deliberately omits the article today.

**Idea Box:** empty — no open entries.
