# Cycle 95 — QA

**Gate:** `npm run build` clean · `npx vitest run` **1042/1042** · `npx playwright test` **313/313**
(full parallel, zero flakes this run). web-llm boundary: `@mlc-ai/web-llm` imported only under
`game/src/ai/` (grep clean). No save-version bump either track.

## Lore track — BACKLOG-340 (homesick) — 6/6 PASS

| # | Criterion | Result |
|---|-----------|--------|
| 1 | `homesickDest` returns `{dest,friend}` when a ≥-floor friend is a zone away + rolls ≥ HOMESICK_ROLLS; dest steps toward the friend | PASS (unit) |
| 2 | Null when friend shares the zone / no friend clears floor / rolls < HOMESICK_ROLLS | PASS (unit) |
| 3 | Friend two zones away → the *intermediate* neighbour (bowl→fernreach friend ⇒ grove) | PASS (unit) |
| 4 | In-world: a grove dino whose closest friend is a bowl dino, once tenure ≥ 2, starts a crossing back toward the bowl, files the homesick memory, floats 🧭 | PASS (e2e) |
| 5 | Homesickness overrides the 341 settle-resist: a *settled* (tenure ≥ 5) lonely dino still leaves toward its friend | PASS (e2e) |
| 6 | Control: a dino whose closest friend shares its zone is not homesick | PASS (e2e) |

Pure (`homesickDest` proven not to mutate bonds). Reuses `closestFriend`+`GRIEF_BOND_FLOOR`+
`griefEdge` so 340/414 always agree on which friend + which way. No WebLLM, no NPCBrain breach.

## Structure track — BACKLOG-418 (per-zone crops) — 6/6 PASS

| # | Criterion | Result |
|---|-----------|--------|
| 1 | `cropOf`: bowl → berries/🍓, grove → greens/🥬, fernreach/unknown → bowl fallback | PASS (unit) |
| 2 | `stageGlyph`: seed/sprout/empty share STAGE_GLYPH; ripe = zone crop; grove ripe (🥬) ≠ sprout (🌿) ≠ greens food emoji | PASS (unit) |
| 3 | Every `CROP_BY_ZONE` food is a real FOODS id | PASS (unit) |
| 4 | In-world: the grove plot ripens to a 🥬 marker (a glyph, not the berry rig) and harvests **greens** into the feeding loop | PASS (e2e) |
| 5 | The bowl plot is byte-identical: berries food, 🍓 marker, the baked berry-bush prop (an Image) | PASS (e2e) |
| 6 | Build clean, grove plot round-trips, no save-version bump | PASS |

## Note — one pre-existing spec updated (not a regression)

`cycle-079-grove-plot.spec.ts` pinned the *old* behavior (grove harvest drops `berries`). BACKLOG-418
deliberately changes that — the grove now grows its own crop (greens) — so the assertion was updated
to `greens` (and the comment). This is the feature's intended change landing in a test that named the
old value, caught by the full run and corrected; the spec now reads the true per-zone divergence it was
always titled for ("the grove grows its **own** crop"). No other spec pinned grove-berries (grepped).

## No cross-track interference
homesick.ts + plot.ts disjoint; WorldScene migration methods vs plot methods disjoint. Both tracks
recommend **APPROVE**.
