# Cycle 105 — QA

**Verdict: PASS / PASS.** Both tracks meet every acceptance criterion in `cycle-105-design.md`.

## Gates

| Gate | Result |
|---|---|
| `npm run build` | clean |
| `npx vitest run` | **1211 / 1211** (134 files, +24 this cycle) |
| `npx playwright test` (full) | **357 specs — 356 pass, 1 known flake** (see below) |
| WebLLM boundary | `grep` for `@mlc-ai/web-llm` outside `game/src/ai/` → no hits |
| Save format | unchanged — the escort is transient, terrain is derived |
| Tree / main | clean, green |

### The e2e flake

Two full runs were needed (the first surfaced a genuine stale assertion, fixed — see below). The
final full run had exactly one failure: `cycle-028-realtime.spec.ts` "T toggles the scale knob to
60× and the clock HUD shows it". It passes isolated in 1.1s, it is a wall-clock/HUD spec nowhere
near this diff (no thirst, no food, no terrain, no bond graph), and the failing spec **moved**
between the two runs — the catalogued parallel-load flake's signature. Noted, not a regression.

## Shipped tests pinning superseded behavior

Four shipped assertions failed against 445 not because the change is wrong but because they pinned
the *old* truth. Each was updated to the new one, keeping its original intent:

1. `tests/unit/cycle-086-fernreach-terrain.test.ts` — "returns null for the bowl (plain grass, no
   layout)". The bowl has a layout now. Rewritten to assert the bowl routes to its own ground and is
   still neither grove nor Fernreach terrain; the null contract survives for an unknown zone id.
2. `tests/e2e/cycle-086-fernreach-terrain.spec.ts` — pinned `tilemap_grass_20x15` as the bowl's floor
   key; now `terrain_bowl_20x15`.
3. `tests/e2e/cycle-067-grove-terrain.spec.ts` — same, via `toContain('grass')`; now `terrain_bowl`,
   with the untinted assertion untouched (the bowl is still the one zone with no tint).
4. `tests/e2e/cycle-102-need-seek.spec.ts` — "thirst pulls only in the grove (its water is
   grove-only)". This was the shipped truth *and* the defect 445 exists to close. Inverted to pin
   what is still worth pinning: the thirst target follows the dino into whichever zone it's in, and
   differs between zones.

`__groundReady` / `__groundSize` also had to change: both read a hardcoded `tilemap_grass_${COLS}x${ROWS}`
key and went false the instant the bowl started baking its own terrain. They now read the live floor
texture, which is the question they were always really asking ("is the ground there / how big is it").

## Lore track — BACKLOG-381 (brought to the hatch)

Spec: `tests/e2e/cycle-105-brought-to-hatch.spec.ts` (8 specs, run `--repeat-each=3` → 24/24) +
`game/src/world/fetch.test.ts` (11 unit tests).

| Criterion | Result |
|---|---|
| Loner + peer bonded ≥ floor → escort starts, phase `to-loner` | PASS |
| The friend is the highest-bond peer, not the nearest | PASS (unit) |
| No peer above the floor → no escort, loner keeps moping | PASS |
| A loner that *did* rush is not fetched | PASS (unit — `missingTheMeal`) |
| The friend's step goes to the loner even inside rush range | PASS |
| The nudge fires exactly once; phase flips to `to-food` | PASS |
| The fetched loner keeps a memory naming its friend | PASS (both halves asserted) |
| In `to-food` the loner walks in and does not withdraw | PASS |
| The escort clears on arrival / budget | PASS |
| One escort at a time | PASS |
| E2E shows the escort running end to end | PASS |
| Save format unchanged | PASS |

**One criterion was changed in the fire, deliberately.** The design said the escort clears when "the
food is gone". Implemented literally it made the feature unobservable: an escort takes ~20 world
steps (`stepToward` moves one axis per step, so a leg costs manhattan distance) and the swarm clears
a drop in about three. The nudge would essentially never have fired — 381 would have shipped as dead
code that passed its own unit tests. The errand now outlives the meal and aims at the hatch tile the
food landed at. This is the design's own sentence taken seriously: *"Being brought to the hatch does
not guarantee a meal; it guarantees a chance at one."* The loner is still walked in from the wall; it
may simply find the ground empty. The e2e pins both halves — the errand survives an `__eat` mid-walk,
and it still terminates (arrival or budget), never running forever.

The floor correction from the codeplan (`FETCH_BOND_FLOOR = 4 < LONER_FLOOR = 8`) is pinned by a
constants-relation unit test plus a test proving a peer in `[4, 8)` is actually reachable — the
assertion that would have caught the original design bug.

## Structure track — BACKLOG-445 (the waterhole)

Spec: `tests/e2e/cycle-105-waterhole.spec.ts` (7 specs) + `tests/unit/cycle-105-waterhole.test.ts`
(11 unit tests) + the `nearPond` guard appended to `cycle-079-pondsight.test.ts`.

| Criterion | Result |
|---|---|
| `zoneTileAt(BOWL_ID, …)` non-null; `'water'` on the block, `'grass'` elsewhere | PASS |
| Waterhole clear of huddle tile, plot tile, food row, east edge | PASS (all four pinned) |
| Thirst seek target non-null in all three zones, and is that zone's water | PASS |
| A thirsty dino at its own zone's water is reset — bowl **and** Fernreach | PASS |
| Dry ground does not reset thirst | PASS |
| Grove behavior unchanged | PASS (`zoneWaterTile(GROVE) === grovePondTile`) |
| Pond-sight (359) / pond-swap (346) stay grove-only | PASS (unit guard + e2e guard) |
| Bowl floor still renders | PASS (`__groundReady`, zero console errors) |
| Save format unchanged | PASS |

The anti-drift invariant is worth noting: a unit test asserts that for **every** zone, the tile
`zoneWaterTile` returns is itself `'water'` under that zone's own `zoneTileAt`. The three landmark
helpers are hand-synced to their layout functions (a latent drift `grovePondTile` has carried since
cycle 102); this makes a desync fail loudly. BACKLOG-449, seeded this cycle, is the structural fix.

## Notes for the Validator

- Both tracks are Milestone 5's final arcs. With these, the milestone's checklist closes.
- Deathless is intact: 445 adds places to drink, nothing punishes not drinking.
- The one behavior change beyond spec (the escort outliving the meal) is argued above; the Validator
  should judge whether that reading of the design is legitimate or a REWORK.
- Diff is 11 files, comfortably inside the v6 ~15-file arc budget.
