# Cycle 84 — Code Plan

File-disjoint tracks. Lore = `feeding.ts` + `WorldScene.checkFeeding`. Structure = `zones.ts`. No
cross-track collision; build either order.

---

## Lore track — BACKLOG-387 Greedy gobble

**Item:** greedy gobble — a hungry, prickly dino shoulders past the winner to a kept food drop (😤).

**Files to create:**
- `tests/unit/cycle-084-gobble.test.ts` — unit tests for `gobblesFood` + `gobblerAmong`.
- `tests/e2e/cycle-084-gobble.spec.ts` — in-world shoulder-past + passthrough.

**Files to modify:**
- `game/src/world/feeding.ts` — add `GOBBLE_HUNGER`, `GREEDY_AGREE`, `gobblesFood(hunger, agreeableness)`, `gobblerAmong(winner, winnerHunger, candidates)`. Reuse the existing `HUNGRIER_BY` (the gobbler must be that much hungrier than the winner). Mirror `yieldFoodTo`'s deterministic filter+sort shape.
- `game/src/scenes/WorldScene.ts`:
  - `checkFeeding` — add `agreeableness: d.traits.agreeableness` to the existing `candidates` map. In the `else` branch (no generous yield), call `gobblerAmong(eater.name, eaterHunger, candidates)`; if non-null, set `this.lastGobble = { winner: eater.name, gobbler }`, `remember` "you shouldered past <winner> and snatched the food first", `flashFeed(gobbler, '😤')`, `logEvent`, and `eatFood(gobbler)` instead of the winner. Else `this.lastGobble = null; this.eatFood(eater)`.
  - Add a `lastGobble: { winner: string; gobbler: string } | null = null` field beside `lastYield` (~line 216).
  - Add hooks beside `__yieldFood` (~line 686): `__gobbleFood` (returns `lastGobble`) and `__setTrait(name, key, v)` (mutates `d.traits[key]` for deterministic e2e — there is no existing trait setter).
  - Import `gobblerAmong` from `../world/feeding`.

**Reuse list:** `HUNGRIER_BY`, `SWARM_RADIUS`, `chebyTiles`, `inView`, `reachedFood`, `eatFood`,
`remember`, `flashFeed`, `logEvent` — all exist. `d.traits.agreeableness` already on the Dino. No new
helpers beyond the two pure functions.

**New dependencies:** none.

**Test plan:**
- Unit (`cycle-084-gobble.test.ts`): `gobblesFood` true only above/below both thresholds; `gobblerAmong` picks hungriest prickly, excludes winner, requires HUNGRIER_BY margin, ignores warm dinos, null when none.
- E2E (`cycle-084-gobble.spec.ts`): (1) hungry prickly dino 3 tiles from the drop, agreeable less-hungry winner on it → gobbler eats, 😤 + memory, `__gobbleFood()` = `{winner,gobbler}`. (2) warm hungry dino nearby → winner eats, `__gobbleFood()` null.

**Risks:** Order of 375 vs 387 — the gobble check must run only in the `else` (winner keeps food)
branch so generosity still pre-empts. The e2e winner must be hungry enough (> WELL_FED) that 375
returns null, or the gobble branch never runs.

**Estimated touch count:** ~4 files.

---

## Structure track — BACKLOG-383 Zone adjacency graph

**Item:** data-driven `ZONE_LINKS` table read by every zone helper; behavior-preserving.

**Files to create:**
- `tests/unit/cycle-084-zone-adjacency.test.ts` — `ZONE_LINKS`, `neighborThrough`, `linkEdge`, and a behavior-parity guard.

**Files to modify:**
- `game/src/world/zones.ts`:
  - After the `Edge` type (and `crossing`), add `interface ZoneLink`, `export const ZONE_LINKS: ZoneLink[]` (bowl-east→grove, grove-west→bowl), `neighborThrough(zoneId, edge): string | null`, `linkEdge(zoneId): Edge | null`.
  - `linkedZone` — `const to = neighborThrough(zoneId, edge); if (!to) return null;` entry x from the *exit edge* (`edge === 'east' ? tile*1.5 : cols*tile - tile*1.5`), y preserved. (Byte-identical: bowl-east→grove x=tile*1.5, grove-west→bowl x=cols*tile-tile*1.5.)
  - `otherZone` — `ZONE_LINKS.find(l => l.from === id)?.to ?? (id === GROVE_ID ? BOWL_ID : GROVE_ID)` (table for bowl/grove, old default for unknown ids — exact parity).
  - `migrationStepTarget` / `atMigrationEdge` / `crossEntryTile` — branch on `linkEdge(homeZone)` (`'west'` vs else) instead of `homeZone === GROVE_ID`. west→col 0 / arrived ≤0 / entry col cols-2; else→col cols-1 / arrived ≥cols-1 / entry col 1. (Byte-identical.)
  - `crossing` — unchanged (pure geometry).

**Reuse list:** `BOWL_ID`, `GROVE_ID`, `GROVE_ID`, `Edge`. The whole point is centralizing — no new
WorldScene call sites (signatures unchanged).

**New dependencies:** none.

**Test plan:**
- Unit (`cycle-084-zone-adjacency.test.ts`): `ZONE_LINKS` rows; `neighborThrough` linked/unlinked; `linkEdge` per zone + unknown→null; explicit parity asserts for `linkedZone`/`otherZone`/migration helpers (the cycle-059 + cycle-073 specs remain the real guardrail, run unmodified).

**Risks:** `ZONE_LINKS` must be declared after `Edge` (line 31). Keep `otherZone`'s unknown-id default
(→ grove) or the cycle-059 "unknown id" test breaks. Entry-x geometry keys on the *exit edge*, not the
zone id — confirm against the two existing `linkedZone` asserts.

**Estimated touch count:** ~2 files.

---

## Shipped

**Lore track — BACKLOG-387 (greedy gobble):**
- `game/src/world/feeding.ts` — added `GOBBLE_HUNGER`, `GREEDY_AGREE`, `gobblesFood`, `gobblerAmong` (mirrors `yieldFoodTo`; reuses `HUNGRIER_BY`).
- `game/src/scenes/WorldScene.ts` — `lastGobble` field; import `gobblerAmong`; `checkFeeding` candidates map gains `agreeableness`; the no-yield branch now runs `gobblerAmong` → gobbler eats (😤 + memory + log) else winner eats; `__gobbleFood` + `__setTrait` hooks.
- `tests/unit/cycle-084-gobble.test.ts` (new), `tests/e2e/cycle-084-gobble.spec.ts` (new).

**Structure track — BACKLOG-383 (zone adjacency graph):**
- `game/src/world/zones.ts` — `ZoneLink` interface + `ZONE_LINKS` table + `neighborThrough` + `linkEdge`; `linkedZone` / `otherZone` / `migrationStepTarget` / `atMigrationEdge` / `crossEntryTile` rewired to read the table. Signatures unchanged → no WorldScene edits. `crossing` untouched.
- `tests/unit/cycle-084-zone-adjacency.test.ts` (new).

**Deviations from plan:**
- `tests/e2e/cycle-083-generous.spec.ts` passthrough test updated (1 line): set the hungry low-bond stranger warm (`__setTrait(..., 'agreeableness', 0.9)`) so the new 387 gobble doesn't fire — isolating the 375 passthrough. 387 legitimately changes that scenario (a hungry *prickly* stranger now gobbles a well-fed winner's kept drop); the test's intent (no generous yield → winner eats) is preserved. Same pattern as cycle-074 rewritten for 377.

**Build + tests:** `npm --prefix game run build` clean. `npm run test:unit` → 874 passed (+15). Full
`npx playwright test` → 263/265; the 2 failures (cycle-077-carry, cycle-081-directed-carry) are the
catalogued parallel-load flake — both green isolated single-worker (2/2). web-llm boundary untouched.
No save change either track.
