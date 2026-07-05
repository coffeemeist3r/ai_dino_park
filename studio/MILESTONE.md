# Milestone

> One player-visible headline goal spanning ~5 cycles. Cycles serve this file:
> the smiths pick BACKLOG items that advance the checklist first. The Validator
> marks arcs `[x]` as their items ship and declares the milestone SHIPPED when
> the checklist closes (big chronicle entry). Then the smiths draft the next one
> here — Lore-smith writes the headline + feel arcs, Structure-smith the spine arcs.

## Current milestone

(none active — Milestone 1 shipped cycle 92; the smiths draft Milestone 2 at the next cycle open.)

### Format (use this when drafting)

```markdown
**Milestone N: <player-visible headline>**
**Status:** ACTIVE (opened cycle NNN)

**Lore arcs:**
- [ ] <arc — one sentence of observable behavior> (BACKLOG-NNN, -NNN)
- [ ] <arc> (BACKLOG-NNN)

**Structure arcs:**
- [ ] <arc> (BACKLOG-NNN)
- [ ] <arc> (BACKLOG-NNN)
```

## Shipped milestones

### Milestone 1: Minds of their own — SHIPPED cycle 92 (opened cycle 90)

Come back after a week and the dinos are running their own lives: each one has an authored
persona, wakes up with an intention of its own that *changes across the day*, and the chain of
zones they live across is legible at a glance — all whole with zero download, and now landing on
a save that can grow. The operator's oldest standing nudge (route the brain into *decisions*, not
just speech) became the spine, deterministic floor intact throughout.

**Lore arcs:**
- [x] The brain leans on the wheel — a cached, async per-dino intent nudges what a dino *does* (BACKLOG-393 — cycle 90)
- [x] A self to lean with — per-dino persona authored from lore, generate-once/cache/persist, procedural fallback (BACKLOG-103 — cycle 91)
- [x] The day has a shape — persona-driven daily plan the world tick consults; minds act, not just reply (BACKLOG-012 — cycle 92)

**Structure arcs:**
- [x] The chain is legible — edge indicators name the neighbour zone before you cross (BACKLOG-398 — cycle 90)
- [x] The world at a glance — a zone-map lens: the whole chain, who lives where, from the adjacency table (BACKLOG-425 — cycle 91)
- [x] A save that can grow — versioned save envelope rooted at v0, the persistence spine personas/intents land on (BACKLOG-426 — cycle 92)
