# Cycle 124 — Lore Handoff

**Theme:** *Two who go together.* Milestone 11 has spent four cycles giving the chain distance and giving
each dino a private relationship with it — a ground it just left (347), a ground it misses (362), a lifetime
standing as homebody or wanderer (361), a ground too full to take another mouth (476). Every one of those is
a read on **one animal**. The milestone's last lore arc is the one that makes the park's oldest social fact
and its newest spatial one touch: *travel has been solitary for a hundred and twenty-four cycles.* Every
crossing this park has ever staged — ambient (334), homesick (340), scarcity (450), hearsay (458), longing
(362) — moves exactly one body. The bond graph has never once put two dinos on the road at the same time.

**Added to BACKLOG:** none — the cap rule holds. Open unstarted lore-track items number well past 12; this is
a drain cycle, themed pick from the queue, no new seeds.

**Suggested next-up:** **BACKLOG-360 — pond pilgrimage**, which is the milestone's third lore arc and the
last thing standing between Milestone 11 and shipped.

The item is already precisely written and needs no generalizing this time. 346 gave the park its one
**shared-place bond**: two dinos that have both set foot in the grove trade pond stories when they meet back
home, for a small bond and a memory each (`🌿 traded pond stories with <name>`). That memory has sat in the
ring since cycle 76 doing exactly one thing — being a memory. It is a durable, persisted, per-pair record of
*two dinos who bonded over a place*, which is the precondition the arc names, and nothing has ever read it.

Concretely, the standing the Designer should aim at:

- **the pair is read off the existing swap memory**, not a new ledger. The record exists; 360 is the first
  thing to ask it a question.
- **the pull is a companion pull, not a second decision.** When a dino's crossing is already bound for the
  ground the pair bonded over, its pond-swap companion — same ground, not already crossing — sets off with
  it on the same roll. It rides the destination that was already chosen; it never picks one.
- **both of them keep it.** A memory each naming who they went with and where, so the journey is a shared
  fact afterwards and can colour a later line, plus a small bond for the road — the travelling twin of the
  swap bond 346 already grants for the talk.

Two deliberate constraints, both learned from 476 last cycle. First, **the beat must be dormant on a fresh
save**: a pond swap requires both dinos to have already crossed to the grove *and* met back home, so a park
nobody has walked yet cannot fire this at all. Second, **no random pick** — where two companions are
available the choice must be deterministic in candidate order (the BACKLOG-456 flake shape is a `Math.random`
in a pickable set, and this cycle should not add a fifth noun to that item).

**Idea Box:** empty — no open entries this cycle.

**Note for the Structure-smith:** this pick lives in the migration *departure* seam (`scarcityMigrate`,
`tryHomesick`, `startMigration`), one new pure module reading the memory ring, and `bonds`. It touches **no**
lens code, **no** governance code, and **no** save shape (the memory ring and `bonds` are already persisted).
477 — the milestone's last structure arc — lives entirely in the lens box and the `[?]` panel, so the two
tracks do not meet anywhere in this diff except at the top of `WorldScene.ts`'s import list.
