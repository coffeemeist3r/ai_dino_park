# Cycle 113 — Verdict

Milestone 8, "The seasons bite," opens — and both opening arcs land clean.

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-173 — Season in the voice

**Rationale:** A greeted dino now lets the turning year slip into its line — a winter grumble or a spring
savour, temperament-shaded (prickly / warm / even) exactly like the hunger (368), rattled (440), and
provider (453) asides it sits beside, and composing onto them within the length cap. Summer and fall stay
deliberately silent, which is the right call: it keeps the tell a flavour beat, not an every-greet tic, and
matches the item's own examples ("grumble about winter or savour spring"). The deterministic canned line is
the floor and the WebLLM prompt carries the same nudge only in the two speaking seasons, so the LLM and
fallback paths agree and behaviour never depends on a model — the NPCBrain boundary is intact (grep clean;
`Season` enters `ai/` as a type-only import). All 7 acceptance criteria PASS, back-compat pinned. Clean,
lazy, no scope creep.

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-461 — The lean season

**Rationale:** The food economy touches the calendar for the first time. One pure `seasonGrip(season)` →
`{capDelta, spoilMarginDelta}` (winter −1/+1, summer/fall +1/−1, spring 0/0) is read at exactly one place —
the new `foodCapFor(zone)` / `spoilMarginFor()` pair in WorldScene — through which harvest banking, the
ferry accept-cap, the spoilage pass, and the two dev hooks all route, so a pile can never bank above what
spoilage will bleed (the consistency risk the plan flagged is closed by the single-helper design).
`spoilFood` gained an *optional* margin (default `SPOIL_MARGIN`, floored at 0), so every existing caller is
byte-identical and the 455 spoilage suite stayed green. The grip is player-visible (a 🌻/🌾/❄️ line on the
season turn — no silent economy change) and derived entirely from the already-persisted clock (no save
change). Foundation-first as queued: flat park-wide grip now, per-crop yield deferred to the freshly-seeded
465. All 8 acceptance criteria PASS.

## Suite

build clean · unit **1343/1343** · e2e **388/389** — the single red per full run is the catalogued
parallel-load boot-timeout flake (a *different* spec each run — controls-help/daynight one run,
cycle-085-third-zone the next — every one green isolated, none in this cycle's diff). The three new
`cycle-113-lean-season` specs passed in every full run and isolated. No regressions in the diff.

## Milestone

**Milestone 8 "The seasons bite" — arcs 1 (lore) and 1 (structure) checked off (173, 461).** Remaining:
lore 178 (migrating warmth), 215 (spring thaw relief); structure 462 (spoilage while you're away).
Milestone stays **ACTIVE**.

Both tracks APPROVED → cycle closes, phase → lore-pending; cycle bumps next run.
