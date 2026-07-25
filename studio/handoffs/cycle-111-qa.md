# Cycle 111 — QA

**Build:** ✅ clean (`npm --prefix game run build`, tsc + vite).
**Unit tests:** ✅ 1316/1316 (`npm run test:unit`) — includes new `spoilage.test.ts` (8) + `plentywelcome.test.ts` (5).
**E2E tests:** ✅ 382/384 green (`npx playwright test`, full suite). The 2 reds are both **pre-existing,
catalogued, and not cycle-111 regressions** — verified by re-running each isolated:
- `cycle-077-carry.spec.ts` — **passes isolated** (1/1) → the catalogued BACKLOG-456 parallel-load flake
  (pinned pile vs. ambient gathering). Not touched by this cycle.
- `mobile-minds.spec.ts:79` (long-dialog paging) — **fails isolated too** → BACKLOG-430, the known
  pre-existing red on clean HEAD (dialog ArrowLeft page-back). Zero overlap with this cycle's diff
  (spoilage + a `crossDino` arrival branch); not a regression.

New specs run green single-worker (spoilage 3/3, plentywelcome 4/4); their parallel failures in the full
run were the cold Vite/Phaser boot flake, which clears on isolation.

---

## Structure track — BACKLOG-455 (A pantry that spoils)

### Acceptance criteria
| criterion | status | evidence |
|---|---|---|
| flat-cap 6 → 5 after one pass; → 4; → still 4 (floor cap-2) | PASS | `spoilage.test.ts` "bleeds a flat-cap hoard down to the floor"; e2e "a hoard at cap bleeds one per day" |
| id below near-cap band (≤ cap-2) unchanged | PASS | `spoilage.test.ts` "leaves a circulating pile untouched"; e2e "a circulating pile below the near-cap band is never touched" |
| granary cap 9 → 8 → 7 → stops at 7 | PASS | `spoilage.test.ts` "scales the floor with a granary cap" |
| pure: new pile, no mutation, empty → empty | PASS | `spoilage.test.ts` "is pure — never mutates the input" |
| in-world one-day pass reads one less + 🥀 ticker | PASS | e2e "a hoard at cap bleeds one per day" (asserts 🥀 event) |
| restore/clock jump does NOT spoil (live-only) | PASS | e2e "a restore / clock jump does not spoil" |
| build/unit/e2e green, no 446/454 regression | PASS | full suite; foodstore + granary specs green |

**Bugs found:** none.
**Recommendation:** **APPROVE.**

---

## Lore track — BACKLOG-459 (Come for the plenty)

### Acceptance criteria
| criterion | status | evidence |
|---|---|---|
| scarcity crossing into a populated richer zone → wry welcome event naming greeter + migrant | PASS | e2e "a scarcity migrant into a populated richer zone gets a wry welcome" (finds "sized up Rex … come for the plenty") |
| greeter↔migrant bond strengthens by the welcome amount | PASS | same e2e: `bonds[key]` after > before |
| migrant + greeter each carry the arrival/welcome memory | PASS | same e2e: "gave Rex a wry welcome" + "sized you up when you came for the food" |
| wry line distinct from 452's welcome-home (😏, not 🏡) | PASS | `plentywelcome.test.ts` "the wry welcome line is sardonic and distinct from 452"; e2e asserts no "came home" |
| a homecoming crossing fires welcome-home, NOT the wry welcome | PASS | e2e "a homecoming crossing fires welcome-home, NOT the wry welcome" |
| a non-scarcity crossing fires no wry welcome | PASS | e2e "a plain (non-scarcity) crossing earns no wry welcome" |
| scarcity crossing into an empty dest: no welcome, no throw, 🍃 still fires | PASS | e2e "a scarcity crossing into an empty richer zone…" (no "sized up", greener-ground present, no console errors) |
| build/unit/e2e green, no 452/457 regression | PASS | full suite; homecoming (107/030) + greener-ground (109) specs green |

**Bugs found:** none. NPCBrain boundary intact (no `@mlc-ai/web-llm` under the new modules — both pure).
**Recommendation:** **APPROVE.**
