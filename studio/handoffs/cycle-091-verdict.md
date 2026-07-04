# Cycle 91 — Verdict (Milestone 1, arcs 2+2)

## Lore track — BACKLOG-103 Persona from lore

**Verdict:** APPROVED
**Item:** BACKLOG-103 [ai]

**Rationale:** All nine acceptance criteria PASS; build clean, 980 unit green, 294 e2e green on
the final full run. This is the CHARTER "Living minds" core goal itself, seeded 2026-06-01 and
carried for 55 cycles — and it landed exactly on the constitution's lines. Every dino now has a
*self*: a backstory scrap, a want, a fear, a speech quirk — LLM-authored from park lore when a
model runs (once, ever — the `upgradePersona` guard makes an authored self permanent),
deterministic and name-seeded everywhere else, so headless CI, the stub brain, and a phone that
declined the download all get the full pipeline with zero inference. The persona is generated at
first need, cached, rides the save additively, restores byte-identical, and feeds every prompt
path (greet, npc_meet, intent authoring) through the existing `ctx.personality` seam —
`buildMessages` needed zero changes. The one design deviation (personas deserialize
undefined-when-absent) was forced by 15 existing round-trip pins and matches the
stockpileByZone precedent; the intent — old saves load unchanged — is intact and tested. The
NPCBrain boundary held (grep clean; `author` is optional and status-gated so it can never
trigger a download). Rex is now unmistakably Rex, in words the save remembers.

## Structure track — BACKLOG-425 Zone map lens

**Verdict:** APPROVED
**Item:** BACKLOG-425 [core]

**Rationale:** All six criteria PASS. The chain is finally one picture: press V to the new map
page and the whole world draws itself from the 383 adjacency table — three labelled boxes,
live head counts from the 316 populations, a dot where the keeper stands, connectors where the
links run. A fourth zone will appear on the map by adding its ZONE_LINKS row, zero UI edits —
the same property 398 proved for edges now holds for the world view. The ring order appended
rather than inserted, so every existing lens kept its position (the cycle-021 spec updated to
the new truth, everything else untouched). Pure model (`zoneChain` + `zoneMapModel`) in,
chrome out — the lens philosophy exactly.

## Suite

Build ✅ · 980 unit ✅ (+17) · e2e **294 passed** full run. Three parallel-load flakes across
earlier full runs (068 / 076 / 081 — all 3/3 isolated, final run green, none touching this
diff; the known cold-boot class). Boundary clean. Save change: one additive optional field
(`personas`), no version bump — and this is the last save field that should land *before* the
426 envelope, which is now the obvious next structure pick.

## Milestone 1 — Minds of their own

- Lore arc 2 (**a self to lean with**, 103) — ✅ closed this cycle.
- Structure arc 2 (**the world at a glance**, 425) — ✅ closed this cycle.
- Remaining: 104/012 (the day has a shape) and 426 (save envelope). One cycle's work if both
  land clean — the milestone could close at cycle 92.

Both tracks APPROVED → cycle 91 closes; `phase = lore-pending`; Lore-smith bumps to 92 next run.
