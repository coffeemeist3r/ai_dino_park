# Cycle 117 — Structure Handoff

**Intent:** Milestone 9's last structure arc — governance made **visible**. 463 gave a zone a spend policy
and 467 gave its turnover a beat, but the standing policy itself still lives only inside two hooks
(`feedReserve`, `granaryDeferredForFeeding`) and one ticker line that scrolls away. The player who missed the
handover beat has no way to ask "so how does the Fernreach spend?" — the one lens built to answer exactly
that kind of question about a ground (the zone map: heads, tier, harvest, want, pantry, granary, decline)
says nothing about the decision behind the pantry. **BACKLOG-468** puts it there: each zone's box carries a
🍽️ (feeds its own first) or 🏦 (banks toward plenty) beside its prosperity badge, so the whole chain's
governance reads at a glance, side by side. A ground with no policy shows nothing — the same `null` seam
both 463 hooks already honour.

**Chosen this cycle:** **BACKLOG-468** — The provider's read on the lens. Top of the Structure Track queue,
on-milestone (Milestone 9 structure arc 2 of 2 — approving it **closes the structure track of Milestone 9**;
only lore 471 would then remain). Cheapest possible arc: a pure read off state that already exists and is
already persisted, no new state, no save change, no new behaviour — the whole point is that governance the
sim already runs becomes something the player can *see*.

**Added to Structure Track:** two. Picking 468 drops the queue to **2 open** (465/466), under cap X=4, so
drain-before-invent releases and the Structure-smith refills to 4:

- **BACKLOG-472** [core] The fourth ground — 449 folded per-zone terrain into one `ZONE_TERRAIN` table so
  "a fourth zone is a row, not three branches." Nothing has ever cashed that cheque. Add a fourth zone to
  the chain: its `ZONES` row + terrain descriptor, an adjacency link, its own crop (418), its own waterhole
  (445), and its box on the map lens — then let every generalized system (prosperity 428, harvest 433,
  demand 438, pantry 446, ferry 447, provider 448, migration 450, decline 460, governance 463) meet it
  untouched. The real deliverable is the *proof*: the chain economy either generalizes or it doesn't, and
  three zones has been too small a number to tell. Builds on 449 / 418 / 445.
- **BACKLOG-473** [emergent] The ground's second decision — governance widens past *spending*. A provider
  currently decides one thing (how the pantry spends); give it a second, orthogonal call: a **work
  priority** (gather-first vs. build-first) the ambient gathering/building hooks read, so a ground's
  provider shapes not only how its store is spent but what its residents put their backs into — a
  bank-first/build-first ground visibly raises landmarks while a feed-first/gather-first one visibly fills
  the pantry. Same shape as 463 (one persistent enum off the provider's temperament, `null` → today's
  behaviour), which is exactly why it's the honest next spine beat: governance is only a *system* once a
  ground decides more than one thing. Builds on 463 / 146 / 417 / 454.

**Shape for the Coder:**
- `world/governance.ts` gains one pure `spendGlyph(p: SpendPriority | null | undefined): string` → `'🍽️'`
  for `'feed'`, `'🏦'` for `'bank'`, `''` otherwise. Sits with the type it reads, exactly where
  `declineGlyph` (decline.ts) and `GRANARY_GLYPH` (granary.ts) sit with theirs.
- `ui/lenses.ts`: `ZoneMapEntry` gains `spend: SpendPriority | null`, and `zoneMapModel` gains a **ninth
  optional** parameter `spends: Record<string, SpendPriority | null> = {}` (absent → `null`, so every
  existing 3-to-8-arg caller and test stays valid — the same back-compat discipline every prior column on
  this model used).
- `WorldScene`: a `zoneSpends()` helper mirroring `decliningZones()` (loop `zoneChain()`, call the existing
  `spendPriorityFor`), passed as the ninth argument from `zoneMapEntries()`; `drawZoneMap` appends the glyph
  to the **existing** tier line (`prosperityBadge · decline · 🌾harvest · glyph`) so the box height is
  untouched. `__zoneMap()` already returns the entries, so `spend` is e2e-visible for free.

**File-overlap note:** the lore track (470) adds `world/policyword.ts` and touches the `npc_meet` gossip
cascade + one dev hook; this track touches `world/governance.ts`, `ui/lenses.ts`, and
`WorldScene.zoneMapEntries`/`drawZoneMap`. Shared file is `WorldScene.ts` in different methods. Both tracks
only ever *read* `spendPriorityFor`. **Neither track changes the save envelope this cycle** — a first for
Milestone 9, and worth QA noting: any save-shape diff is a bug.
