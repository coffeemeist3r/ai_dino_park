# Cycle 83 — QA

**Build:** `npm run build` clean (type-check passes). **Unit:** `npx vitest run` → **859 passed**
(+12 vs cycle-82's 847). **E2e:** `npx --yes kill-port 5173` then `npx playwright test` →
**263/263 passed, full run, no flake this run** (exit 0). web-llm boundary grep clean (only under
`game/src/ai/`). No save-format change either track (`SAVE_VERSION` still 2).

## Lore track — BACKLOG-375 Generous feeder

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Hungry winner (> WELL_FED) keeps its own meal (null even with a worthy friend) | PASS | unit `cycle-083-generous` "a hungry winner keeps its own meal" |
| 2 | No yield when no candidate clears both bars (low bond, or not HUNGRIER_BY hungrier) | PASS | unit "does not yield to a low-bond friend" / "not meaningfully hungrier" |
| 3 | Well-fed winner + qualifying friend → that friend; multi-candidate → hungriest, tie→bond, deterministic | PASS | unit "yields to a well-fed winner…" / "picks the hungriest qualifying friend" |
| 4 | E2e: friend gets the meal (hunger sated, friendship rises), winner does not eat, winner↔friend bond rises | PASS | e2e "a well-fed winner yields the meal…" (friend hunger <0.1 from 0.9, points up, winner hunger >0.05, bond up) |
| 5 | Winner files "let <friend> eat first" memory + 🤝; `__yieldFood()` reports {giver, eater} | PASS | e2e same test (memory assertion + `__yieldFood` === {giver, eater}) |
| 6 | No qualifying friend → winner eats exactly as before; favorite/comfort/cold paths untouched; no save change | PASS | e2e "passthrough" (winner eats, `__yieldFood` null) + cycle-025/027/082 feeding specs green |

## Structure track — BACKLOG-377 Zone-distinct craft

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | `zoneStructure` bowl→cairn, grove→shelter, unknown→cairn; `structureRecipe` cairn/lean-to recipes | PASS | unit `cycle-083-zone-craft` (zoneStructure + structureRecipe tables) |
| 2 | Bowl banks → cairns only, never a lean-to, however many accrue | PASS | e2e `cycle-074-shelter` "the bowl stacks cairns and never a lean-to" (4 cairns, 0 shelters) |
| 3 | Grove banks {6,4} → one 🛖 lean-to, never a cairn | PASS | e2e "the grove raises a lean-to and never a cairn" (1 shelter zone=grove, 0 cairns, baked prop) |
| 4 | directedCarry aims at the destination zone's structure recipe (grove→{6,4}, bowl→{3,2}) | PASS | unit "directedCarry under the grove/bowl recipe…"; e2e cycle-081 still green (branch is the bigger deficit under both) |
| 5 | Cairn/shelter pile-math byte-identical; cycle-074 spec updated to the 377 truth; retired escalation-bar assertion dropped | PASS | cycle-074-shelter unit (recipe-math unchanged) + e2e (rewritten, green) |
| 6 | No save-format change; cairns/shelters still persist + zone-scope (308); web-llm untouched | PASS | e2e save.version===2, shelters persisted; boundary grep clean |

**Flake note.** This full run was clean (263/263, no isolated re-run needed). cycle-081-directed-carry
was confirmed green isolated (`--workers=1`) earlier when it rotated into the catalogued parallel-load
flake set on an interim run — it is unrelated to this diff (lives in resource/crossDino, and carries
branch under both the old and new recipe). Both tracks recommended **APPROVE**.

phase → validator-pending.
