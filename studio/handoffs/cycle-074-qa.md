# Cycle 74 — QA

**Quality bar:** `npm run build` clean (type-check passes). `npx vitest run` → **752/752 unit green**
(+18: 8 shelter, 5 arrival, 4 saveGame, +1 fixture). `npx --yes kill-port 5173` then
`npx playwright test` → **236/236 e2e green** in one full run, **no flake** (the lone cold-Vite boot
timeout on the very first invocation passed on the warm re-run, and every other spec was green first
try — the catalogued cold-boot flake, not a regression). Web-llm boundary grep clean (only under
`game/src/ai/`). No `SAVE_VERSION` bump; additive saves only.

## Lore track — BACKLOG-339 (first steps in the grove): 8/8 PASS

1. **Arrival memory + groveVisited on a full crossing** — PASS. `cycle-074-arrival.spec.ts`: after
   `crossOnce('Rex')`, `__groveVisited()` contains Rex and his memory has `first time across`.
2. **🌿 bubble + one-step pause** — PASS. Same spec: `__arriving()` contains Rex right after the cross,
   and is cleared after one more `__stepWorld()` (the look-around hold). (The 🌿 bubble is the
   `showBubble(groveArrivalLine())` call on that branch.)
3. **Once ever (back + re-cross silent)** — PASS. Crossing back to the bowl, then into the grove again,
   leaves `groveVisited` with exactly one Rex — no duplicate, no second beat.
4. **Grove-only** — PASS. `firstGroveArrival(any, name, BOWL_ID) === false` (unit) + the back-crossing
   leg of the e2e files no arrival memory.
5. **`firstGroveArrival` pure truth table** — PASS. `cycle-074-arrival.test.ts`: unvisited→grove true;
   visited→grove false; any→bowl false.
6. **Additive save** — PASS. `saveGame.test.ts`: a save lacking `groveVisited` loads (→ `[]`); a
   round-trip preserves `['Rex','Sunny']`; a non-string entry is rejected; `version` stays 2.
7. **`__migrate` teleport unchanged** — PASS. `cycle-073-crossing.spec.ts` (instant teleport, no walk)
   still green; cycle-068/069 migration + persist specs green.
8. **Boundary / build / suite** — PASS. `arrival.ts` imports only `./zones`; build clean; full suite green.

## Structure track — BACKLOG-315 (dino-built shelter): 8/8 PASS

1. **Cairns below the bar unchanged** — PASS. `cycle-064-craft.spec.ts` (build one, rebuild a second)
   still green; the shelter spec stacks 3 cairns exactly as before to reach the bar.
2. **No 4th cairn while saving** — PASS. `cycle-074-shelter.spec.ts`: after 3 cairns, banking a full
   `{3,2}` worth leaves the cairn count at 3 (draining paused).
3. **One shelter at {6,4}, pile spent exactly** — PASS. Same spec: topping to `{6,4}` yields
   `__shelters().length === 1` with the pile reduced to `{branch:0, stone:0}`.
4. **Zone-scoped (308)** — PASS. The built shelter carries `zone: 'bowl'`; render gating mirrors the
   cairn (`__objVisible().shelters` + `applyObjectVisibility`). `cycle-069-zone-objects` still green.
5. **Persists + reloads** — PASS. The shelter is in the exported save under `shelters`, `version === 2`;
   restore draws it via `drawShelter` (mirrors the cairn restore loop).
6. **Pure helpers** — PASS. `cycle-074-shelter.test.ts`: `canBuildShelter`/`buildShelter` cover/short,
   spend exactly, return null when unaffordable, never mutate input; recipe richer than the cairn and
   within the per-kind cap (8) so the pile can reach it.
7. **Additive save validation** — PASS. `saveGame.test.ts`: round-trips a zoned shelter; a save lacking
   `shelters` loads (→ `[]`); a malformed entry / non-string zone is rejected.
8. **Cairns resume after a shelter; build/suite** — PASS. The `else` branch returns to ordinary cairn
   crafting once `hasShelter` is true (logic + cycle-064 parity); build clean; full suite green.

**Recommendation: APPROVE / APPROVE.** Both tracks meet every criterion; full bar green, no flake,
boundary intact, saves additive.
