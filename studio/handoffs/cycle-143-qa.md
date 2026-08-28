# Cycle 143 — QA

**Gates, run on the committed tree:**

| Gate | Result |
|---|---|
| `npm run build` | clean, no type errors |
| `npx vitest run` | **2158 passed, 3 skipped** (213 files) |
| `npx --yes kill-port 5173` → `npx playwright test` | **610 passed, 1 failed** |
| `@mlc-ai/web-llm` boundary | grep finds it only under `game/src/ai/` |
| Save shape | additive-by-omission — neither track adds a save field |
| Working tree | clean at commit |

**The one e2e failure is the standing red, not a regression.** `mobile-minds.spec.ts` › "long dialogs page
GBA-style: E forward, ◀ back, ✕ closes from any page", at line 95, the ArrowLeft page-back step. This is
BACKLOG-430, catalogued since cycle 93 and reproduced on a *stashed clean HEAD* in cycle 135. Neither track
this cycle goes anywhere near the dialog input path or the keeper picker. Checked against the diff, not
assumed.

One additional spec, `cycle-071-zone-spawn`, failed in the **first** full run and passed both in isolation
and in the second full run with no source change between them — the catalogued parallel-load flake. Logged
rather than chased.

---

## Lore track — BACKLOG-510: 7 / 7 criteria pass

| # | Criterion | Verdict |
|---|---|---|
| 1 | `HATCH_TILE.tileY === foodLanding(20,15).tileY` | **PASS** — `hatch.test.ts`, asserted against `foodLanding` itself rather than restating `floor(rows * 0.45)`. |
| 2 | Hatch tile is not water on any ground in `zoneChain()` | **PASS** — all six, Saltpan included. |
| 3 | No collision with bank / huddle / founding ruin / any plot tile / any `zoneWaterTile` | **PASS** — enumerated, not spot-checked. |
| 4 | `hatchLanding` stays in the band and clamps at both edges | **PASS** — band walked across the whole rng range; clamp proven at `cols = 4` and `cols = 1`. |
| 5 | No-column landing in band; explicit column still exact | **PASS** — and the explicit path is separately pinned at `col = 99` clamping to `cols - 1`. |
| 6 | e2e: hatch rendered before any drop; piece rests within the scatter | **PASS** — `cycle-143-hatch.spec.ts`, four tests: it is there at boot, food lands in the band on the hatch's row, it is on every ground the keeper walks to (same tile each time), and the crop-harvest column passes straight through. |
| 7 | Feeding/escort/berth/gobble/pecking-order specs pass unmodified | **PASS with one reported exception**, exactly as criterion 7 requires it be reported rather than quietly fixed. `tests/unit/feeding.test.ts` › "picks a column from rand when none is given" pinned `rand → 0.5` to column 10 and `rand → 0` to column 0. That assertion *is* the old distribution, not a consumer of it, so it could not survive a change to the distribution by design. Rewritten against `HATCH_TILE`/`HATCH_SCATTER` rather than against three new literals, so it can never go stale the same way twice. **Every actual consumer — escort, berth, gobble, swarm, pecking order, shared meal — passed untouched**, which is the claim criterion 7 was really making. |

### QA's own check on the scatter

The concern behind criterion 7 is that narrowing the landing quietly flattens the five systems that read
distance to it. Checked directly rather than inferred: `startEscort`'s rush gate, `reactionToFood`'s
distance term, the berth (389) and the pecking order all continue to produce mixed outcomes across the
suite, because the distances they read are dominated by *where the dinos are* — which the cast spread
(CHARTER v7) made more varied, not less. The landing was one of two sources of variance and is now the
smaller one. No spec became trivially true.

---

## Structure track — BACKLOG-505: 10 / 10 criteria pass

| # | Criterion | Verdict |
|---|---|---|
| 1 | `zoneChain()` is six grounds, Saltpan east-end, Ridge appended | **PASS** — `saltpan.test.ts` and the e2e lens both pin the full order. |
| 2 | `otherZone('hollow')` / `linkEdge('hollow')` unchanged | **PASS** — the first-match discipline held for the third time. |
| 3 | `saltpanTileAt` regions correct; seep inside its own water block | **PASS** — plus a whole-grid water count (4 tiles, the smallest water in the park) so a later edit that widens the seep fails here. |
| 4 | Resolves through `ZONE_TERRAIN`; floor bakes whole with no salt rig | **PASS** — `TILE_RIGS.salt` asserted absent, and the e2e walks the keeper onto the ground and finds the scene live. |
| 5 | `__unsettled()` returns exactly the Saltpan on a fresh boot | **PASS** — **the assertion this item exists for.** It returned `[]` on every save shipped since cycle 140. |
| 6 | Map lens marks it unsettled on a fresh save | **PASS** — and the other five are asserted settled in the same test, so a regression that lights every badge fails too. |
| 7 | `scarcityDestOf('hollow')` returns the Saltpan | **PASS**, with **no setup at all** — no hand-placed migrations, no emptied ground. That is the difference between this cycle and cycle 120, where the frontier had to be manufactured by walking residents out first. |
| 8 | First arrival records a pioneer, files `settleMemory`, speaks `settleLine`; settled forever after | **PASS** — both the 🚩 founding line and the 🌱 settling line, then still settled after its founder leaves. |
| 9 | `foundingResidents()` / `foundingCouncils()` carry a present-and-empty saltpan | **PASS** — via the derived-from-`zoneChain` assertion 500 already wrote. |
| 10 | Full suite green; casualties updated, never weakened | **PASS** — see below. |

### Criterion 10 in detail — every spec that changed, and why

24 assertions across 17 files. QA read each edit against the rule "*updated* because the park changed,
never *weakened* to accommodate it":

- **17 pure enumerations** (chain order, `ZONES` length, zone-map ids/names/counts/keeper flags, edge
  indicator lists, `hopDistances` maps, the plaque tally string, capacity and crowding maps). Each gained
  one entry. None dropped an assertion.
- **`cycle-140-residency`** — the one that mattered most, and it got **stronger**. It asserted
  `groundsWithoutResidents()` is `[]`; it now asserts it is *exactly* `[SALTPAN_ID]`. A second empty
  ground, or an empty ground that is not the frontier, now fails. Weakening it to
  `expect(...).toHaveLength(1)` or deleting it would have been the easy move and would have thrown away
  the only mechanical statement of CHARTER v7's third change. Not done.
- **`cycle-141-bank`** — grass → not-water, with the reason written into the test. QA's judgement: this is
  a *correction*, not a weakening. The test's own comment always said its purpose was to stop a terrain
  edit drowning the heap; grass was a proxy for that which happened to hold while every ground was mostly
  grass. It now asserts the thing it was for, on all six grounds.
- **`cycle-120-unsettled`** — the assertion this arc has now flipped twice, and both flips are recorded in
  the spec body rather than edited away. It read `['hollow','ridge']` before 500, `[]` after 500, and
  `['saltpan']` now.
- **`tests/unit/feeding.test.ts`** — covered under lore criterion 7 above.

### An unplanned finding QA is escalating rather than closing

`cycle-143-saltpan.spec.ts` pins it deliberately: **when the Saltpan's founder walks back out, the Hollow
begins reading unsettled.** `isUnsettled` treats only the bowl as an origin, and 343 records a pioneer at
*arrival* — so any ground whose residents were *spawned* has no pioneer, and reads as "nobody has ever
lived here" the moment it empties. The Grove, Fernreach, Hollow and Ridge are all in that state.

This is not introduced by this cycle (it is 500's spread cast meeting 474's origin clause) and it is not in
either item's scope. It is worth a Structure-Track item because it is BACKLOG-505's *second* candidate
already half-implemented by accident and pointing the wrong way: the park will happily call a ground the
cast has lived on since boot a place nobody has ever seen. Flagged to the Validator.

---

## Reachability (CHARTER v7) — QA's independent read

QA does not take the Designer's reachability paragraph on trust; both were re-derived from the specs.

**Lore track.** `cycle-143-hatch.spec.ts` boots a fresh save and finds the hatch rendered before any input,
on all six grounds, at the same tile each time; then drops food and watches it come to rest beside it. The
player presses the first key anyone presses and food comes out of an object instead of out of the sky. No
second resident, no day boundary, no lens. **Reachable.**

**Structure track.** `cycle-143-saltpan.spec.ts` boots a fresh save and finds six grounds on the map, the
unsettled badge lit on the sixth for the first time in the park's shipping history, and the Hollow's
migration destination already pointing at it with nothing set up by hand. **Reachable**, and — the sharper
point — reachable *without* the setup cycle 120's equivalent specs needed.

**One honest limit, stated rather than buried.** The Saltpan is four hops from spawn, so a player who walks
rather than watches needs four crossings to stand on the crust. What is reachable in ten minutes without
walking is the lens badge, the migration and the settling beat. QA does not think that fails the bar — the
frontier is *supposed* to be far, and the ticker narrates the migration wherever the player is standing —
but the Validator should weigh it rather than have it hidden.

**A note on evidence.** The preview browser is unavailable in an unattended run (dev servers can't be
started without someone present to approve them), so no screenshot accompanies this. The e2e suite is a
real Chromium against a real build and is the evidence used.
