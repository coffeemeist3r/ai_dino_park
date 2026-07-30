# Cycle 116 — Lore Handoff

**Milestone drafted:** **Milestone 9 — "A ground that speaks for itself."** Milestone 8 shipped last
cycle and, on its final night, opened governance (463): a zone's provider now sets a **spend priority**
(feed-first vs. bank-for-a-granary) — but it shipped *invisible*, read by two hooks, set silently, that no
dino ever mentions and the player can never see. Milestone 9 makes that governance **legible, transferable,
and lived** across five arcs (3 lore, 2 structure). The lore half gives the policy a voice; the structure
half (467/468, both already queued) makes the say change hands and puts it on the lens. See
`studio/MILESTONE.md` for the full headline + checklist.

**Theme (this cycle):** the first governance *voice*. Until now a dino spoke of *who* keeps its ground fed
(453); this cycle it speaks of *how* its ground has chosen to feed it. A hungry dino on a feed-first ground
is reassured the ground feeds its own before it builds; on a bank-first ground it grumbles it goes short
while the walls rise. The same hunger, voiced differently by what the ground decided — governance you can
*hear*.

**Added to BACKLOG:** BACKLOG-469 / 470 / 471 — Milestone 9's three lore arcs. Seeded as
**milestone-drafting arcs**, the CHARTER-sanctioned exception to the lore drain-before-invent cap: the
existing lore queue (far over cap) holds no governance beat — all of it predates 463 — so a governance
milestone has to seed its own lore arcs. Only 469 ships this cycle; 470/471 drain over the milestone window.

**Suggested next-up:** **BACKLOG-469** [social] Fed first, or left short — a hungry dino (over the 371
threshold) lets its ground's spend policy (463) slip into its greeting, temperament-shaded like the season
(173) / provider (453) / hunger (368) asides. Feed-first → grateful; bank-first → grumbling. Silent when not
hungry or when the ground has no provider-set policy — a flavour beat, not a tic. No new save state; reads
`spendPriorityFor(zone)` + the existing hunger signal, and slots into the greet-aside register in
`ai/brain.ts` exactly the way `seasonAside`/`providerAside` do.

**Idea Box:** empty (no open entries).

**Milestone note:** Milestone 9 opens this cycle. Approving 469 (lore) + 467 (structure) checks the first
arc of each track; the Validator marks them `[x]` in `studio/MILESTONE.md` on approval. Four arcs remain
(lore 470/471, structure 468).

**File-overlap note for the Coder:** the lore track (469) touches `ai/brain.ts` (a new `policyAside` +
`NPCContext.groundPolicy`) and the greet bag in `WorldScene.pickTone`. The structure track (467) touches
`forceStep`'s tail + a new `world/handover.ts` + a persisted `lastProviderByZone` field. The only shared
file is `WorldScene.ts` (different methods) and the save envelope (467 adds one additive field; 469 adds
none) — no real collision.
