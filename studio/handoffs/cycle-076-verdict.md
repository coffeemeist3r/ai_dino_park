# Cycle 76 — Verdict

## Lore track — BACKLOG-345: News pulls a newcomer

**Verdict:** APPROVED
**Item:** BACKLOG-345

**Rationale:** All 6 acceptance criteria PASS. Grove news now *moves a body*: `groveCurious` is a clean pure predicate (bowl home ∧ never-crossed ∧ carries the 342 token), and `pickMigrant` prefers a curious dino while falling back to the old uniform random when none is curious — so the migration spine's existing behavior is untouched (the 072/073/074 specs stay green) and the nudge is one-time by construction (crossing adds the dino to `groveVisited`). No save change, `NPCBrain` boundary intact, no scope creep. The e2e proves the payoff end-to-end: a dino that only *heard* about the pond is the one the roll pulls across.

## Structure track — BACKLOG-328: Per-zone stockpile

**Verdict:** APPROVED
**Item:** BACKLOG-328

**Rationale:** All 6 acceptance criteria PASS. The economy is genuinely local now: each zone banks, caps, and spends its own pile, the plaque Stores line follows the keeper across a crossing, and the cairn/shelter build spends the builder's zone. The pure `resource.ts` helpers were reused unchanged (they already took a pile arg) — the laziest correct shape. The save is additive (no `SAVE_VERSION` bump): `stockpileByZone` is validated one level deeper than `stockpile`, the legacy field is kept as the bowl pile for back-compat, and a pre-328 save's global pile migrates into the bowl on restore. The gather/zone regression spec (069) passes isolated, confirming no breakage. This unblocks carry-between-zones (329) and resource bias (348).

**E2E note:** full runs show 2 rotating failures out of 240, a different pair each run, all passing isolated — the known parallel-load flake (CHARTER quality bar), not a regression. Accepted.

**Cycle close:** both tracks APPROVED → `phase = lore-pending`; Lore-smith bumps to 77 next run. The two zones now have separate economies (328) and the bowl's gossip can pull a curious dino across to see the grove for itself (345) — the social and structural halves of "the second zone is a real place," shipped on disjoint paths.
