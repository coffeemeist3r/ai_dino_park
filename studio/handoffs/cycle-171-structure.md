# Cycle 171 — Structure Handoff

**Intent:** Fix the bond graph at both ends of its range, the same night, because they are one
question. At boot every pair is 0 — below the shared floor of 8 that comfort, loner, huddle and grief
all read — and four minutes later every pair is at the cap of 100, where every "who is closest?" is
answered by name order. The lore track (134) puts that answer on every book page tonight; it is only
true if the graph under it is.

**The spine:**
- `world/founding.ts` gains `FOUNDING_BONDS` — a pure table beside the other founding state, applied
  on the `!save` branch only, round-tripping through the existing `bonds` save field (no version
  bump). Pairs that fit the cast (Rex & Sunny, Bramble & Pip, Mossback & Glade, …) and **one dino
  deliberately left with none** — Twitch, the jittery one, already the chorus's late voice.
- `social/bonds.ts` gains `meetGain(bond)` — the per-meeting bump shrinks as a pair nears the cap
  (`BOND_PER_MEET × (1 − bond/100)`), so the graph approaches 100 but never arrives, and a pair that
  has spent the sitting together keeps reading closer than one that met a handful of times. The other
  bumps (comfort, gratitude, wonder, …) are one-off beats and stay flat.
- `tests/e2e/helpers.ts` gains a named founding fixture, `strangers`, for specs whose subject assumes
  the zero graph — the BACKLOG-495 seam used as designed, each spec read before it is opted in.

**Off-top justification:** the queue's top three (552, 557, 563) are infra with no milestone arc;
565 and 567 are both of Milestone 23's structure arcs and the cycle-170 housekeeping recommended them.
Folded into one pick because 567's own text says it must be "decided with the four floors of
BACKLOG-565 in view" — shipping either alone would move the graph and then move it again.

**Added to Structure Track:** none — drained from queue (5 open ≥ X=4).

**Chosen this cycle:** BACKLOG-565 (+567) — the bond range.
