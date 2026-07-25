# Cycle 111 — Verdict

## Lore track — BACKLOG-459 (Come for the plenty)

**Verdict:** APPROVED
**Item:** BACKLOG-459

**Rationale:** All 8 acceptance criteria PASS. The arc lands the milestone's missing *arrival* beat: a
scarcity migrant walking into a richer zone is now sized up by the nearest resident with a wry 😏 welcome
and a small mutual bond, the sardonic mirror of 452's homecoming welcome. The implementation is the
right kind of lazy — a new pure `world/plentywelcome.ts` (line + event + two memories + bond const) plus
one sub-beat wired **inside** the existing `crossDino` `scarcity && !homecoming` guard, reusing the 452
seam wholesale (`pickNearest` greeter, `strengthen` bond, `remember` both sides). Homecoming still
short-circuits it (proven by an e2e), a non-scarcity crossing earns nothing, and an empty destination
no-ops without throwing while the 🍃 greener-ground beat still fires. NPCBrain boundary intact (pure,
deterministic strings — no inference). No save-shape change; build + unit + e2e green, no 452/457
regression. This closes the **last open Lore arc of Milestone 7**.

## Structure track — BACKLOG-455 (A pantry that spoils)

**Verdict:** APPROVED
**Item:** BACKLOG-455

**Rationale:** All 7 acceptance criteria PASS. 454 gave the food economy a *source* (build to lift your
cap); 455 gives it the *sink* it was missing. A hoard sitting at/near its zone's granary-aware cap now
bleeds one unit per in-game day down to a self-limiting floor (`cap - 2`: 6→5→4·, a granary'd 9→8→7·),
so plenty you don't move stops being free and a two-full-zone ferry deadlock can't sit forever — while a
circulating pantry (below the near-cap band) is never touched, so nothing starves. New pure
`world/spoilage.ts` with the decay decided and unit-tested (floor, granary floor, purity, multi-id); a
live-only `checkSpoilage` onHour day hook (a restore/jump never double-decays, verified) using each
zone's `granaryFoodCap`; a 🥀 ticker per spoiled id (no silent change). Additive — no new persisted field
(the `lastSpoilDay` tracker is transient like `lastSeasonDay`). Away-absence spoilage was correctly
deferred to the freshly-seeded BACKLOG-462, and the seasonal rate to BACKLOG-461 — a clean playable seam,
not a stub. Build + unit + e2e green, no 446/454 regression.

## Suite health
- build clean · vitest 1316/1316 · e2e 382/384.
- The 2 reds are pre-existing and not this cycle's: `cycle-077-carry` **passes isolated** (BACKLOG-456
  parallel-load flake family), `mobile-minds.spec.ts:79` **fails isolated too** (BACKLOG-430, the known
  standing red in the dialog-paging path). Neither overlaps this cycle's diff.

## Milestone bookkeeping (Milestone 7 — "The economy has weight")
- Lore arc "Come for the plenty" (459) → **[x]**. All three lore arcs now closed.
- Structure arc "A pantry that spoils" (455) → **[x]**.
- **Structure arc "The draining zone" (460) remains open** → Milestone 7 stays **ACTIVE** (one arc from
  shipped). Next cycle's Structure-smith should pick 460 to close it out.
