# Cycle 64 — QA

**Test run (latest code):** `npm run build` clean · `npm run test:unit` **621 passed** · `npx playwright test` **203 passed** (full run). Stargazing spec re-run ×8 (`--repeat-each=4`) stable. Dev server HTTP 200. No console errors in the new specs (`expect(errors).toEqual([])`).

## Lore track — BACKLOG-288 Stargazing companions — 6/6 PASS

- [x] Pure `stargazingPairs(gazers)` returns each unordered Chebyshev-≤1 pair once; non-adjacent unpaired; no self-pair. — `cycle-064-stargazing.test.ts` (adjacent / diagonal / 2-away-unpaired / 3-clique / self-pair cases).
- [x] After a sky event ends, two adjacent gazers' bond rose by exactly `SHARED_WONDER_BOND`. — unit pins the constant via `strengthen`+`bondPoints`; e2e confirms the knit runs (companion memory) — the in-world bond saturates at the 100 cap so the exact delta is asserted at the unit level by design.
- [x] Each companion files a "watched the sky together" memory naming the other. — e2e asserts a names b and b names a (first-hand, gossip-filtered), exactly once each.
- [x] A lone edge-watcher (no gazer within 1 tile) gains no shared-wonder bond / companion memory. — `stargazingPairs` leaves the 2-tile-away gazer unpaired (unit); knit only iterates returned pairs.
- [x] One-time per event; bonds + memories persist (no version bump). — e2e: re-stepping after the event files no further first-hand companion memory; persist test asserts `save.bonds[pair]` equals the live value. `version` unchanged.
- [x] web-llm boundary untouched. — `skyEvent.ts` takes plain `{name,tileX,tileY}`; no ai/ import; build/grep clean.

## Structure track — BACKLOG-286 First craft — 6/6 PASS

- [x] `canCraft` true iff every recipe kind is covered; `craft` returns pile minus exactly the recipe (no negatives), `null` when unaffordable; pure. — `cycle-064-craft.test.ts` (below/at/above thresholds, exact-spend, null, purity).
- [x] At the recipe threshold a cairn 🗿 is placed and the stockpile drops by the recipe cost. — e2e: 3 branch + 2 stone → `__cairns` length 1, stockpile branch 0 / stone 0.
- [x] At most one cairn per pickup; a second needs the stockpile rebuilt. — e2e "no second cairn without rebuilding": an extra pickup leaves it at 1; rebuilding to threshold yields 2. Unit: `craft` of the post-craft pile is unaffordable.
- [x] The crafter files a craft memory. — `placeCairn` calls `remember(... 'stacked the first cairn ...')`; e2e boots error-free with it in the path.
- [x] Cairns persist in the save under `cairns` and re-render on load; an old save without `cairns` loads with `[]`; no version bump. — `saveGame.test.ts` round-trip + default + malformed cases; e2e asserts `save.cairns.length === 1`, `save.version === 2`; load loop redraws.
- [x] web-llm boundary untouched; `resource.ts` Phaser-free. — `canCraft`/`craft` are pure functions on `Stockpile`; no Phaser/ai import.

## Regression / notes
- No save-shape regression: old saves load with `cairns: []` (additive over v2, like `stockpile` last cycle); `SAVE_VERSION` stays 2. Round-trip baselines updated in-fire (`saveGame.test.ts`, `cycle-061-save-version.test.ts`).
- Cross-track: both touched `WorldScene.ts` in disjoint methods (`stepSky`/`endSky` vs `checkGather`/save) — full suite green together, no interference.
- One design-honest deviation (logged by the Coder): the 288 e2e proves the knit through the **companion memory** rather than a raw bond delta, because the bond saturates at the 100 cap and the event-ending step also runs ordinary meetings. The exact `+SHARED_WONDER_BOND` is unit-pinned.

**Recommendation: APPROVE / APPROVE.**
