# Cycle 102 — Verdict

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-443 — Predator/prey in the book

**Rationale:** The food web is now legible in the collection book. A carnivore reads its recent catches
(`🦖 brought down N meal(s)`), a herbivore its recent escapes (`💨 slipped N hunt(s)`), and a dino with no
food-web history shows no line — all read out of the memory the hunt already files (437's `you brought
down a meal`, 367's `you slipped <hunter>'s hunt`), so it's a pure surfacing with no new state and no
persistence change. Diet-keyed (`dietOf`) so catches and escapes never cross. All acceptance criteria PASS
(unit `foodwebStanding`/`catchTally`/`escapeTally` + `bookLines`; e2e `cycle-102-book-foodweb`). Reuse is
clean (recall, dietOf, the existing hunt glyphs), no boundary breach. This is Milestone 4's final **lore**
arc.

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-436 — Need pulls the body

**Rationale:** The need-drive finally moves the body. A dino whose hunger or thirst is pressing leans its
wander toward relief — hunger toward the hatch feeding zone, thirst toward the grove pond (grove-only, the
one place thirst is slaked; elsewhere it just wanders, correctly deferring the local waterhole to 445). The
pull is a genuine *lean*: gated by `needSeeks` (`NEED_PULL_CHANCE=0.6`) and slotted **below every ritual**
in the wander ladder (huddling / gathering / moping / ticcing / socializing all still win; a pressing need
already makes a dino "disturbed" so the solitary tic yields to it), and keeper drops still win the food
rush. Deathless and additive — no dino removed, no new save field (rides the 371 `needs` map). All
acceptance criteria PASS (unit `needSeeks` + `grovePondTile`; e2e `cycle-102-need-seek` proves the target
selection and the body being pulled to 0 distance). This is Milestone 4's final **structure** arc.

## Milestone

Both approvals check off the last two arcs of **Milestone 4 "The hunt has weight"** — all 6 arcs now `[x]`.
**Milestone 4 SHIPPED (cycle 102).** Moved to Shipped milestones; the smiths draft Milestone 5 next open.

## Bookkeeping
- Build clean, vitest 1153/1153, e2e 330/330 (full warm run).
- 443 + 436 → `[x]`, moved to `BACKLOG-archive.md`; CHANGELOG cycle-102 entry added.
- Structure Track now: 444 / 445 / 446 open.
- `currentItem` = null, `structureItem` = null, `lastVerdict` = APPROVED, `structureVerdict` = APPROVED, `phase` = lore-pending.
