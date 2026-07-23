# Cycle 109 — Structure Handoff

**Pick: BACKLOG-450 [core] — Scarcity moves the herd.** The last arc standing between Milestone 6 and its
headline. Every verdict since cycle 106 has named it as the natural close, and nothing blocks it: the two
signals it needs both already exist and are already derived — the prosperity index (428, `zoneProsperity`)
and the per-zone food store (446, `foodPileTotal`). This cycle spends them.

## Why this cycle

Migration has existed since cycle 274 and become a *visible walk* since 334, but the decision behind it is
blind to the economy the last three milestones built. Today a migrant picks its destination with
`neighbors[Math.floor(Math.random() * neighbors.length)]` — a coin flip across the adjacency table — and the
*who-leaves* pick knows only grove-news and homesickness. Nothing about a zone's *health* makes a dino leave
it, and nothing about a neighbour's *plenty* makes a dino head there. The demand read (438) and the food flow
(447) move **goods** toward need; 450 is the missing twin that moves **mouths** toward plenty, so population
becomes a consequence of the economy instead of a random walk running beside it.

## What ships

A small pure module — **`world/scarcity.ts`** — folding the two existing signals into one "appeal" number
per zone, and two decisions read off it:

1. **Mouths move toward plenty (destination).** When an ambient migrant picks which neighbour to cross to,
   it heads for the **most appealing** neighbour (highest prosperity + fullest pantry) instead of a coin
   flip. Deterministic — highest appeal wins, ties broken by neighbour order (stable, `ZONE_LINKS` order) —
   because a weighted-random pick is exactly the flake shape BACKLOG-456 catalogues, and the sim already gets
   its variety from *who* moves and from the prosperity landscape shifting under it.

2. **Want empties out (who leaves).** When no grove-news and no homesickness is pulling anyone (the ambient
   fallback tier of `pickMigrant`), the migrant is drawn from the residents of the **least-appealing**
   occupied zone — a resident of the poorest, emptiest-pantry ground is likeliest to walk out. Random among
   the equally-poor, so *who* leaves a poor zone stays varied. This touches **only** the plain-candidates
   fallback: the homesick tier and the grove-pull `told`/`curious` tiers (which cycle-076 and cycle-078 pin
   by identity) are byte-identical.

Both biases collapse to the old behavior in the common case: at spawn every dino is in the bowl, so every
zone's appeal is equal and both picks are the old uniform random until zones actually diverge — which is
exactly when the bias should switch on.

## On the operator's "zone-exclusive resource" framing (IDEABOX, routed here cycle 106)

Ruled: **not this cycle.** The Idea Box nudge asked whether to fold in a *hard* scarcity pull — a genuinely
zone-exclusive resource a body must go fetch — past 450's *soft* prosperity bias. 450 as queued is the soft
bias, and it is the right size for one arc and the right foundation: it makes "health drives movement" real
and testable before layering a hard exclusive-resource pull on top. The hard version is a clean follow-up
once the soft bias is in hand; noted for a future structure item, not built here.

## New structural seed (drain-before-invent: 3 open → 2 after 450; below X=4)

- BACKLOG-460 [core] The draining zone — as scarcity migration (450) empties a poor zone, nothing compounds
  it: the migration bias re-reads prosperity fresh each roll, so a hollowing zone doesn't *spiral*. Let a
  zone that has lost residents read as **declining** (a downward arrow on the map lens) and bias its
  remaining residents a touch harder to leave, so an exodus reads as one and plenty-vs-want gains momentum —
  deathless, capped by a floor that keeps at least one resident so a zone can thin but never vanish. The M7
  structural companion to 450. Builds on 450 / 428 / 316.

## Milestone

M6 closes on this pick. **Milestone 7 ("The economy has weight")** was drafted by the Lore-smith this fire;
its **structure arcs are 454 (the granary) and 455 (a pantry that spoils)**, both already queued and both
about the food economy gaining weight — plus 460 as it lands. Recorded in MILESTONE.md.

**Phase → designer-pending.** `structureItem = BACKLOG-450`.
