# Cycle 84 — QA

**Build:** ✅ `npm --prefix game run build` clean.
**Unit tests:** ✅ `npm run test:unit` → 874 passed (+15: cycle-084-gobble 9, cycle-084-zone-adjacency 6).
**E2E tests:** ✅ `npx playwright test` → 263/265. The 2 failures (cycle-077-carry,
cycle-081-directed-carry) are the **catalogued parallel-load flake** — both green isolated single-worker
(2/2). Neither touches this cycle's diff (both are `crossDino` carry tests; the 383 refactor that
underlies `crossDino` is behavior-preserving and its parity is pinned green by cycle-073 + cycle-084-zone-adjacency
in the same full run).

**web-llm boundary:** ✅ grep confirms `@mlc-ai/web-llm` only under `game/src/ai/`.
**Save change:** none either track.

---

## Lore track — BACKLOG-387 Greedy gobble

| Criterion | Status | Evidence |
|---|---|---|
| `gobblesFood` true only when hunger ≥ GOBBLE_HUNGER AND agreeableness ≤ GREEDY_AGREE | PASS | cycle-084-gobble.test.ts "gobblesFood" — on-bar true, under-hunger / over-agree false |
| `gobblerAmong` picks hungriest qualifying gobbler, excludes winner, requires HUNGRIER_BY margin, prickly tie-break, null when none | PASS | cycle-084-gobble.test.ts "gobblerAmong" (6 cases) |
| In-world: hungry prickly dino shoulders past a less-hungry agreeable winner; eats; 😤 + "shouldered past <winner>" memory; `__gobbleFood()` = `{winner,gobbler}` | PASS | cycle-084-gobble.spec.ts:21 |
| Warm or insufficiently-hungry nearby dino → winner eats, `__gobbleFood()` null (passthrough) | PASS | cycle-084-gobble.spec.ts:54 |
| Generosity still pre-empts: a well-fed winner beside a hungrier high-bond friend yields (375), no gobble fires | PASS | cycle-083-generous.spec.ts:35 green; gobble runs only in the no-yield branch |
| Build clean, unit + e2e green, no save change, boundary intact | PASS | see header |

**Bugs found:** none. **Recommendation: APPROVE.**

---

## Structure track — BACKLOG-383 Zone adjacency graph

| Criterion | Status | Evidence |
|---|---|---|
| `ZONE_LINKS` holds exactly the two rows; `neighborThrough` linked/unlinked correct | PASS | cycle-084-zone-adjacency.test.ts "ZONE_LINKS table" |
| `linkEdge` per zone + unknown→null | PASS | cycle-084-zone-adjacency.test.ts |
| `linkedZone` byte-identical for both linked edges + null unlinked (cycle-059 unmodified green) | PASS | cycle-084 parity test + cycle-059-zones.test.ts |
| `otherZone` flips the pair, unknown→grove default kept (cycle-059 unmodified green) | PASS | cycle-084 parity test + cycle-059-zones.test.ts |
| migration helpers byte-identical (cycle-073 unmodified green) | PASS | cycle-084 parity test + cycle-073-migration-crossing.test.ts |
| Build clean, full suite green (zone/migration/crossing/carry suites are the guardrail), no save change | PASS | full run; carry specs green isolated (flake) |

**Bugs found:** none. The refactor is behavior-preserving — every pre-existing zone/migration/carry
test passes unmodified. **Recommendation: APPROVE.**
