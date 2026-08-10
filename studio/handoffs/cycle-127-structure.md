# Cycle 127 — Structure Handoff

**Intent:** Break the monarchy open. Governance in this park (463 spend priority, 473 work priority,
467 handover) is *one dino setting two enums*: the provider decides, everyone lives with it, and when
the role changes hands the whole table is swapped for the incoming dino's temperament. BACKLOG-031 —
"at threshold population, NPCs vote on a simple rule" — has been deferred since cycle 1 for one
structural reason: **there has never been a set of deciders to vote.** This cycle derives one. A
per-zone **council** — the top few food-bankers of a ground rather than only its single top banker —
becomes a persistent standing beside `provider`, with the existing calls still set by the provider.
Nothing votes yet, on purpose: this is the seam, and the seam is the structural work.

**Added to Structure Track:** 2 — the queue stood at 3 open (466 / 479 / 480), below cap X=4.
- **BACKLOG-481** [emergent] The council actually decides — the work priority (473) set by council
  majority, provider breaking ties. The 031 vote, plugged into the set 479 creates. Blocked on 479.
- **BACKLOG-482** [infra] One place the standings are derived — `pioneer` / `provider` / council folded
  into one pure per-zone standings module the book, the lens and the save all read; the `ZONE_TERRAIN`
  (449) lesson applied to roles. Deliberately queued *behind* 479 rather than in front of it: the
  fold is only honest once a third standing exists to be folded.

**Chosen this cycle:** **BACKLOG-479** — the per-zone council (derived from the same banking tallies
that already produce `provider`, sized to the ground, persistent across ticks, surfaced as a standing).

**Milestone:** Milestone 12 ACTIVE, structure arc 3 of 4. On-milestone; no justification needed.

**Collision check vs. the lore pick (402):** near-clean, with one shared *shape* to keep apart. Both
items are derivations-from-tallies surfaced in the collection book — 402 folds three feeding counters
into a table manner, 479 folds banking counters into a per-zone standing. They must not share a module
or a book-render path: the manner read belongs in the feeding/book lane, the council read in the
zone/role lane beside `provider`. The book will gain two independent lines, not one merged renderer.

**The expected shape of the finding (for QA and the Validator to hold the Coder to):** the sharp
question is **how the council is sized and where it is stored**. A fixed "top 3" is wrong the moment a
zone thins to one resident (the 460 floor guarantees this happens) or a fresh ground opens unsettled
(474) — a council must be derivable on a ground with one mouth and on a ground with none, and the
degenerate cases are where a general rule earns its keep. And it must be **derived, not stored**, the
way `provider` is: a second persisted role list is a second thing to fall out of sync, and 475's hop
table exists as the standing precedent for deriving rather than duplicating. If the Coder reaches for
a new save field, that is the thing to argue with first.
