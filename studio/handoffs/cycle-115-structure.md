# Cycle 115 — Structure Handoff

**Intent:** Milestone 8's structure spine is done (461/462 both shipped), so this cycle opens the
*next* spine the CHARTER names and the economy has been circling for a milestone: **governance**.
The resources→crafting→building→governance arc has stalled at *building* — a zone can raise a
granary (454) and crown a provider (448), but no dino ever *decides* anything for the ground it
keeps fed. BACKLOG-463 seeds the first governance beat foundation-first: one persistent, per-zone
**spend priority** (feed-the-hungry-first vs. bank-for-a-granary), set by the zone's provider from
its own temperament, read by the two hooks that already exist — the pantry-spend (444) and the
granary auto-build gate (454). Who a zone trusts to keep it fed now shapes *how* it spends. Not a
vote (031 stays deferred); one policy value, two reads.

**Added to Structure Track:** BACKLOG-467 (the say changes hands — provider turnover re-sets the
priority as a legible beat) and BACKLOG-468 (the provider's read on the lens — surface the policy on
the zone-map lens). The queue sat at 3 open (< X=4); these two refill it and are the natural
governance follow-ups 463 opens, so the drain-before-invent refill stays on-spine.

**Chosen this cycle:** **BACKLOG-463** — The provider's say. A per-zone `SpendPriority` on the save,
`providerPriority(traits)` (warm → feed-first, prickly → bank-for-a-granary), a reserve floor the
444 spend reads and a feed-first defer the 454 build reads. Off-milestone justification: Milestone 8's
structure arcs are both closed, so the structure track advances the CHARTER's standing
resources→…→governance arc into its next stage rather than idling.

**File-overlap note for the Coder:** the lore track (215) touches `checkSeasonTurn` +
`world/thaw.ts` (new); this structure track touches `feedFromStores` + `buildOnGather` +
`world/governance.ts` (new) + `foodstore.ts` (`pickFoodToSpend` gains an optional reserve). No
shared file between the two tracks except the save envelope (both add one additive field) — sequence
the save-field additions so neither clobbers the other.
