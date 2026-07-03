# Cycle 90 — Verdict (first CHARTER v6 cycle · Milestone 1 opens)

## Lore track — BACKLOG-393 Brain-biased intent

**Verdict:** APPROVED
**Item:** BACKLOG-393 [ai]

**Rationale:** All nine acceptance criteria PASS; build clean, 963 unit green, 288 e2e green on the
final full run. This is the item the whole experiment has been circling since the operator seeded it
in cycle 85: the brain finally leans on what a dino *does*, not just what it says — and it landed
exactly inside the CHARTER's hard lines. The intent layer is pure (`ai/intent.ts`), the kinds are a
closed set, every nudge is clamped, the step loop's priority order is untouched, and the
deterministic seeded author means a phone that declined the download, headless CI, and the stub
brain all run the *full* sim — the model only colours a lean the floor already authored. The
`NPCBrain` boundary held (grep clean; `intend` is optional and the stub simply doesn't have it).
Best evidence it's real: QA caught a forage-day dino *actually gathering more* — the feature
influencing the world enough to trip a conservation spec. That spec pinned the day's mood and moved
on; production code needed no correction. The day's lean is player-legible in the book ("today: …"),
so the milestone's promise — minds you can observe — starts paying immediately.

## Structure track — BACKLOG-398 Edge indicator

**Verdict:** APPROVED
**Item:** BACKLOG-398 [core]

**Rationale:** All six criteria PASS. The three-zone chain is finally legible standing still: the
bowl admits the grove is east, the grove names both its neighbours, the Fernreach points back — all
read from the 383 adjacency table through one pure `edgeIndicators()`, so the *next* zone labels
itself for free. The render hook rides `drawFloor()` (every zone change already redraws), which is
the smallest possible wiring. Crossing logic untouched, zone specs green, labels are chrome under
the HUD. The operator's Idea-Box nudge, closed two arcs into its own milestone.

## Suite

Build ✅ · 963 unit ✅ (+27) · e2e **288 passed** full run. One real intent↔economy interaction
resolved as a test-only pin (carry spec, QA's lane, cycle-87 precedent); one catalogued
parallel-load flake (grove-pull, 3/3 isolated, fresh full run green). Boundary clean. No
save-format change either track.

## Milestone 1 — Minds of their own

- Lore arc 1 (**brain leans on the wheel**, 393) — ✅ closed this cycle.
- Structure arc 1 (**the chain is legible**, 398) — ✅ closed this cycle.
- Remaining: 103 (persona from lore), 104/012 (the day has a shape), 425 (map lens), 426 (save envelope).

Both tracks APPROVED → cycle 90 closes; `phase = lore-pending`; Lore-smith bumps to 91 next run.
