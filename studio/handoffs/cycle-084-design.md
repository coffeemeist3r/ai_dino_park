# Cycle 84 — Design

Two tracks, file-disjoint. Lore = BACKLOG-387 (greedy gobble) in `feeding.ts` + `checkFeeding` glue.
Structure = BACKLOG-383 (zone adjacency graph) in `zones.ts`. No shared files.

---

## Lore track — BACKLOG-387 Greedy gobble

**Item:** BACKLOG-387 [emergent] Greedy gobble — a hungry, low-agreeableness dino shoulders past a
friend to a contested food drop first (😤), so giving way reads as a trait, not a universal.

**Why this cycle:** Last cycle shipped the generous half (375): a well-fed winner yields a contested
drop to a hungrier friend. 387 is the inverse pole on the *same swarm-candidate seam* — a hungry,
prickly dino that won't wait its turn. Together they make the feeding rush a personality tell: some
dinos give way, some grab. The cleanest distinctness beat the loop has, and it grounds 389–392.

**What ships:** When food lands and a dino reaches it first (the winner), the existing 375 check runs
first. If the winner is well-fed and yields to a friend → unchanged (375). If the winner is *keeping*
its food (hungry, no generous yield), a new check looks at the swarm beside it: if a hungry, prickly
dino (low agreeableness) that is meaningfully hungrier than the winner is standing within the swarm,
that dino **shoulders past and eats first** instead of the winner — flashing 😤, filing a "shouldered
past <winner>" memory, and logging `😤 <gobbler> shouldered past <winner> to the food`. No bond change
(that funk/standoff is 062/390's job). If no gobbler qualifies, the winner eats as before.

**Acceptance criteria:**
- [ ] `gobblesFood(hunger, agreeableness)` is true only when hunger ≥ GOBBLE_HUNGER AND agreeableness ≤ GREEDY_AGREE; false otherwise.
- [ ] `gobblerAmong(winner, winnerHunger, candidates)` returns the hungriest qualifying gobbler (prickly tie-break), excludes the winner, requires the gobbler be ≥ HUNGRIER_BY hungrier than the winner, and returns null when none qualify.
- [ ] In-world: a hungry prickly dino three tiles from a food drop, with a less-hungry agreeable winner on the food, eats the food instead of the winner; the gobbler flashes 😤 and files a "shouldered past <winner>" memory; `__gobbleFood()` returns `{ winner, gobbler }`.
- [ ] When the only nearby swarm dino is warm (high agreeableness) or not hungrier than the winner, the winner eats and `__gobbleFood()` is null (passthrough — 375/cycle-25 behavior intact).
- [ ] Generosity still wins when it applies: a well-fed winner beside a hungrier high-bond friend yields (375) and no gobble fires (the gobble check only runs when the winner keeps its food).
- [ ] Build clean, unit + e2e green, no save change, web-llm boundary untouched.

**Out of scope:** bond/standoff consequences (390/062), memory of who bullied whom (389), the gobbler's
regret (391), the book tally (392). Just the shoulder-past beat + its 😤 tell.

**Constraints:** Must not change the 375 yield path or the cycle-25 single-eater passthrough. Pure
decision in `feeding.ts`; `checkFeeding` glue only. Additive only — no save change. Reuses the existing
`HUNGRIER_BY` constant.

---

## Structure track — BACKLOG-383 Zone adjacency graph

**Item:** BACKLOG-383 [core] Zone adjacency graph — collapse the hard-coded binary bowl↔grove link
into one data-driven `ZONE_LINKS` table read by every zone helper. Behavior-preserving.

**Why this cycle:** Five functions in `zones.ts` hard-code bowl-east↔grove-west. Adding a third zone
(378) or edge-meet barter (358) would mean touching every one. One adjacency table read by all of them
makes the next zone a data row, not a rewrite. Highest-leverage structural move; unblocks 378 + 358.

**What ships:** A `ZONE_LINKS: { from, edge, to }[]` table (the bowl↔grove pair) plus two readers,
`neighborThrough(zoneId, edge)` and `linkEdge(zoneId)`. `linkedZone`, `otherZone`,
`migrationStepTarget`, `atMigrationEdge`, and `crossEntryTile` are rewired to read the table. Every
signature is unchanged and every output is byte-identical for bowl/grove, so WorldScene and the
existing zone suite need no edits beyond the new table test. `crossing` (pure geometry) is untouched.

**Acceptance criteria:**
- [ ] `ZONE_LINKS` contains exactly the bowl-east→grove and grove-west→bowl rows; `neighborThrough('bowl','east')==='grove'`, `neighborThrough('grove','west')==='bowl'`, and any unlinked edge → null.
- [ ] `linkEdge('bowl')==='east'`, `linkEdge('grove')==='west'`, unknown zone → null.
- [ ] `linkedZone` outputs are byte-identical to pre-refactor for both linked edges and null for the two unlinked edges (cycle-059 spec stays green unmodified).
- [ ] `otherZone('bowl')==='grove'`, `otherZone('grove')==='bowl'`, unknown id → grove (cycle-059 spec stays green unmodified).
- [ ] `migrationStepTarget` / `atMigrationEdge` / `crossEntryTile` outputs byte-identical to pre-refactor (cycle-073 spec stays green unmodified).
- [ ] Build clean, full unit + e2e green (the existing zone/migration/crossing/carry suites are the behavior guardrail), no save change.

**Out of scope:** Adding a third zone (378), edge-meet barter (358), any new behavior. Pure refactor.

**Constraints:** No behavior change — the existing suite must pass unmodified. No new exports beyond the
table + its two readers. Keep `Edge` typed; declare the table after `Edge` exists. No WorldScene edit
(signatures preserved). File-disjoint from the lore track.
