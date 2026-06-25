# Cycle 78 — Structure Handoff

**Intent:** Give the two zone economies a *reason* to diverge. The carry route opened last cycle
(329) and the piles split the cycle before (328), but both zones still roll the **same** uniform
50/50 resource kind (314) — so there's nothing for carry to actually balance and nothing for the
grove and bowl stockpiles to differ on. **BACKLOG-348** leans each zone toward its own character:
the grove's trees drop **🪵 branches**, the bowl's open ground turns up **🪨 stones**. A *lean*, not
a lock — the off-kind still appears, just rarer — so the economies skew apart without either zone
going single-resource. This is the precondition that makes directed carry (356), the both-zone
stores readout (357), and edge-meet barter (358) mean something.

**Added to Structure Track:** none — drained from queue (5 open ≥ X=4: 348/349/356/357/358).

**Chosen this cycle:** **BACKLOG-348** — top unblocked structure item; per-zone bias in `pickKind`,
keyed by zone id, applied where `maybeSpawnResource` rolls each occupied zone. Files (`world/resource.ts`
+ the spawn glue in WorldScene) are disjoint from the lore pick (355 lives in `groveword.ts` /
`curiosity.ts` + the migrant *pick*, not the resource *spawn*), so the Coder's two-track fire stays clean.
