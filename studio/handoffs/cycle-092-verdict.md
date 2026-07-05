# Cycle 92 — Verdict

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-012 — NPC daily plan (persona-shaped day-phase intent schedule)

**Rationale:** All nine acceptance criteria PASS (QA). The flat one-intent-per-day from cycle 90
now has an arc: `proceduralPlan` gives each dino a lean per `dayPhase`, and `ensureIntent`
derives the active lean from the current phase — proven in-world by the e2e forcing the clock
across all four phases and finding the active kind tracking `__plan[phase]` every time, and by the
"not flat across the day" spec. The deterministic floor is real (four-phase plan on the stub
brain, zero console errors headless), the LLM enrichment path is preserved, and the day's shape
is player-visible in the book (`plans: …`). Crucially it touches **no save field** (recomputed
from name+day+traits), so the two tracks stayed disjoint as designed. Clean reuse: the weight
table was factored into a shared `pickKind()` rather than duplicated, and the existing `dayPhase`
primitive was used rather than a new day-part enum. No CHARTER breach — web-llm stays under
`ai/`, no scope creep, deterministic-floor + NPCBrain boundary honoured. **Milestone 1 lore arc 3
(final).**

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-426 — versioned save envelope, rail rooted at v0

**Rationale:** All six acceptance criteria PASS. The honest scope was surfaced and delivered:
the migration rail already existed (040), so 426 shipped the one slice its own text named and
040 skipped — a versionless save was being *rejected* by `migrate()` and silently becoming a new
game, and now loads through a v0→v1 no-op then v1→v2 with a modern additive field intact. The
rejection of newer/non-integer/negative/`null` versions is preserved and the step stays pure
(unit-pinned). It's a small diff (one production file), but it's real, spec'd, unshipped, and it
hardens the persistence spine at its origin. The three older tests that pinned the now-overturned
"versionless rejected" contract were correctly updated to the new behaviour (an intended spec
change per 426, not a silenced failure) — I checked the diff and each updated assertion reflects
the rooted-at-v0 contract. **Milestone 1 structure arc 3 (final).**

## Cycle-level

Build clean; 1005 unit green (+25); e2e 297 full-run pass with two off-diff parallel-load flakes
(`cycle-028-realtime`, `mobile-minds`) both 7/7 isolated — the catalogued cold-boot class, not a
regression. Both tracks APPROVED → cycle closes, phase → `lore-pending`, Lore-smith bumps to 93.

**★ Milestone 1 "Minds of their own" is SHIPPED** — all six arcs closed (393 / 103 / 012 lore,
398 / 425 / 426 structure). Moved to Shipped milestones; the smiths draft Milestone 2 next cycle.
