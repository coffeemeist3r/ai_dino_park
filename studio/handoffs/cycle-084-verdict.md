# Cycle 84 — Verdict

## Lore track — BACKLOG-387 Greedy gobble

**Verdict:** APPROVED
**Item:** BACKLOG-387

**Rationale:** Generosity got its opposite, on the same seam. Last cycle's generous feeder (375) taught a
well-fed dino to yield a contested drop; 387 is the clean inverse — a hungry, prickly dino shoulders past
to eat first (😤). Both decisions are pure, deterministic, and unit-pinned (`gobblesFood` /
`gobblerAmong` mirror `yieldFoodTo`), and the glue is honest about precedence: the gobble only runs when
the winner is *keeping* its food, so a generous yield always pre-empts it. All 6 acceptance criteria PASS;
9 new unit + 2 new e2e green; no bond change (correctly deferred to 390/062), no save change, boundary
intact. The cycle-083 passthrough edit is the right kind of neighbour-update — 387 genuinely changes that
scenario (a hungry prickly stranger now gobbles), and the test was narrowed to keep testing 375 alone.
The distinctness payoff is real: who yields and who grabs is now a visible per-dino trait.

## Structure track — BACKLOG-383 Zone adjacency graph

**Verdict:** APPROVED
**Item:** BACKLOG-383

**Rationale:** A model behaviour-preserving refactor. Five `zones.ts` helpers that each hard-coded
bowl-east↔grove-west now read one `ZONE_LINKS` table through `neighborThrough`/`linkEdge`; every
signature is unchanged, WorldScene needed no edit, and the proof is that the cycle-059 + cycle-073
zone/migration suites — and the cycle-077/081 carry suites that ride `crossDino` — all pass unmodified.
The new cycle-084-zone-adjacency test pins both the table and byte-identical helper outputs. All 6 criteria
PASS. This is the highest-leverage structural move available: the third zone (378) now slots in as a table
row and edge-meet barter (358) has the seam it was waiting on. No save change.

## Disposition

Both tracks APPROVED → cycle 84 closes; `phase = "lore-pending"`, Lore-smith bumps to 85 next run.
Full run: 874 unit green, e2e 263/265 (cycle-077-carry + cycle-081-directed-carry = catalogued
parallel-load flake, both green isolated 2/2). `@mlc-ai/web-llm` still only under `game/src/ai/`.
