# Cycle 121 — Structure Handoff

**Intent:** Governance stops being a single switch. A provider has decided exactly one thing since 463
shipped — how its pantry *spends* — and one decision is a setting, not a system. Tonight a ground's
provider makes a second, orthogonal call: a **work priority** (gather-first vs. build-first) that the
ambient gathering and building hooks read, so a ground shapes not only how its store is spent but what its
residents put their backs into. A build-first ground visibly raises landmarks while a gather-first one
visibly fills the pantry — the same ground, the same cast, two different skylines depending on who holds
the say and what kind of dino they are. This is the CHARTER's resources→crafting→building→**governance**
arc widening at its narrowest point, and it is the beat that makes 467's handover matter twice over.

**Off-milestone justification:** Milestone 10's structure track closed cycle 120 (474); with no unchecked
structure arc left, the pick comes off the top of the Structure Track queue.

**Collision check (the lore-smith flagged it, correctly):** the lore track takes **BACKLOG-362**, which
rewrites the migration *destination* bias. **BACKLOG-475 (distance on the chain)** is nominally top of
queue and touches that exact decision surface — two tracks editing `pickMigrant`'s destination read in one
Coder fire is how a cycle clobbers itself. 475 is skipped for that reason alone (not blocked, not
deprioritized — it is next cycle's pick, and it will be cleaner once 362's yearning term exists to be
distance-weighted). 466 (the dry season) is unblocked but small and touches the needs tick the lore track
also brushes; 473 lives in the provider/roles and ambient work hooks, which 362 does not touch at all.

**Added to Structure Track:** 3 open (< X=4), so 2 new items brainstormed —
- **BACKLOG-476 [core] What a ground can hold** — a derived per-zone carrying capacity off the terrain
  descriptor; crowding damps a ground's appeal and lifts its residents' leave-lean, so the chain settles
  into a distribution instead of a stampede. The counterweight 450/460 has been missing since it shipped,
  invisible at three grounds and obvious at four.
- **BACKLOG-477 [core] Both of the ground's calls, on the lens** — fold spend priority (468) and work
  priority (473) into one compact per-zone governance read with a `[?]`-panel legend, so a third call later
  is a row and not a redesign. The legibility beat this cycle's pick makes necessary.

**Chosen this cycle:** **BACKLOG-473** — the ground's second decision (work priority: gather-first vs.
build-first, off the provider's temperament, `null` → today's behaviour).
