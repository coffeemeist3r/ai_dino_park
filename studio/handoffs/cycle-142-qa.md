# Cycle 142 — QA

Gates run from the repo root on the committed tree.

| Gate | Result |
|---|---|
| `npm run build` | clean |
| `npx vitest run` | **2125 passed / 2 skipped**, 211 files |
| `npx --yes kill-port 5173 && npx playwright test` | **602 passed / 1 failed** |
| `@mlc-ai/web-llm` boundary | only `game/src/ai/webllm.worker.ts` and `game/src/ai/webllmBrain.ts` |
| Working tree | clean at commit |

**The one e2e red:** `cycle-139-glad.spec.ts:53` timed out in `boot` waiting for the canvas to be
*visible* — the earlier of the two boot waits, i.e. Vite/Phaser had not painted, not a game assertion.
Re-run isolated: **6/6 green in 5.9s.** The catalogued cold-boot/parallel-load flake, not a regression;
nothing in this cycle's diff is within reach of that spec. Notably `mobile-minds.spec.ts` — the standing
red catalogued as BACKLOG-430 — **passed** in this run, which is consistent with the cycle-129/135
observations that it fails serial and passes under load.

---

## Lore track — BACKLOG-507

| # | Criterion | Verdict |
|---|---|---|
| 1 | `world/wear.ts` exports `wearKey` + pure `marksOn` | **PASS** — new module, no Phaser import |
| 2 | `marksOn` sorted by dino name | **PASS** — `unit: is sorted by name, not by object-key order` |
| 3 | omits no-haunt-here and null-kind dinos | **PASS** — two unit cases |
| 4 | `wearKey('pace')` is `tic_pace`; rig for pace, none for fuss | **PASS** — asserted against `PROP_RIGS` |
| 5 | a solitary pace/circle ritual wears the ground; it was bare before | **PASS** — e2e, both halves |
| 6 | the mark outlives the stretch ending | **PASS** — e2e `resetTic` then still there |
| 7 | a drift moves the mark, one sprite, never accumulating | **PASS** — e2e asserts `toHaveLength(1)` + the new tile |
| 8 | a `fuss` dino produces no mark and no error | **PASS** — e2e, with the haunt asserted laid all the same |
| 9 | off-ground marks not visible; crossing shows them | **PASS** — see note below |
| 10 | a restore with `ticHaunts` draws its marks | **PASS** — see note below |
| 11 | `__wornMarks()` dev hook | **PASS** — reports the sprites, not the model |
| 12 | e2e spec covering appear / drift / fuss | **PASS** — `cycle-142-wear.spec.ts`, 4/4 |

**Note on 9 and 10 (how they are covered, and honestly what is not).** Both route through the *same*
single call site: `syncWear()` is called from `applyObjectVisibility()`, which the zone cross, the founding
pass and the save restore all already go through — that is the coder's stated reason for putting it there
rather than at four sites. So the mechanism is shared with the bank heap (504), whose per-zone visibility
and restore-resync are pinned by `cycle-141-bank.spec.ts`, and the off-ground case is additionally
structural: `syncWear` reads `this.zoneId` and **destroys** sprites not on the active ground rather than
hiding them, so an off-ground mark cannot be visible because it does not exist. What is *not* separately
pinned by a spec of its own is a cross-then-look-back sequence. Flagged rather than claimed. It is one
`__setZone` round-trip away and belongs in the next cycle's spec sweep.

## Structure track — BACKLOG-503

| # | Criterion | Verdict |
|---|---|---|
| 1 | obsidian appended **last** in `RESOURCE_GLYPH` | **PASS** — `toEqual(['branch','stone','frond','obsidian'])` |
| 2 | `pickKind(_, ridge)` is obsidian across the stream | **PASS** — 8 rand values incl. both sides of 0.75 |
| 3 | no other ground, and no omitted/unknown zone, can roll it | **PASS** — every ground in `zoneChain()` × 8 rands |
| 4 | `zoneStructure(ridge)` is beacon; recipe is `BEACON_RECIPE`; affordability both ways | **PASS** |
| 5 | the other four grounds' `zoneStructure` unchanged | **PASS** |
| 6 | `canBuildGranary` false without a shard, true with one | **PASS** |
| 7 | `world/quarry.ts` with the lookup, `needsQuarry`, `quarryDest` | **PASS** — ground derived from `ZONE_EXCLUSIVE`, not re-declared |
| 8 | destination tier order asserted | **PASS, but not the order the design wrote** — see below |
| 9 | in-game: Ridge spawns are obsidian, other grounds' never | **PASS** — through `__biasKind`, the production bundle |
| 10 | `__quarryDest` dev hook | **PASS** |
| 11 | e2e covering spawn, structure, and the errand | **PASS** — `cycle-142-obsidian.spec.ts`, 5/5 |
| 12 | the bank heap counts obsidian like any other unit | **PASS** — `pileTotal` untouched; 504's specs green |

**Criterion 8 — the design's order was wrong and the code does not implement it.** The design specified
hearsay > yearning > **quarry** > frontier > appeal. Built that way, the quarry tier took the whole of
scarcity migration dormant: on a fresh save no ground holds obsidian, so every ground has a live errand and
every migrant runs one. Thirteen e2e specs across 450 / 457 / 458 / 111 said so. The shipped order is
hearsay > yearning > frontier > **a genuinely richer neighbour** > quarry, and the errand is the read
`scarcityDestOf` reaches when nothing else is pulling. QA's judgement: this is the design being corrected
by the build, not the build drifting from the design, and the correction is the CHARTER v7 corollary
applied in the direction the studio less often checks — a new system must not be made reachable by taking
an old one dormant. It is pinned in both directions by the fifth e2e case (errand live and losing to
plenty; errand winning when the plenty is removed). **The design document's stated ordering is now stale
and the Validator should note it rather than let it stand as the record.**

## Findings QA is filing rather than fixing

1. **`__seedGranaryReady` held a copy of `GRANARY_RECIPE`.** Five of the thirteen reds were nothing to do
   with migration: three upkeep specs and two bill-call specs went red about a granary none of them was
   testing, because a dev hook named "granary ready" hardcoded `{branch: 3, stone: 3}` beside the constant
   it was mirroring. Fixed in this cycle (the hook now spreads the recipe). Filing the *class*: this is the
   third sighting of the pattern BACKLOG-483 and BACKLOG-495 already describe — a claim written down twice
   goes stale in one of the two places, and the only thing that surfaces it is moving the constant.
2. **The errand has no cooldown.** A ground with no obsidian has a live errand on every migration roll
   until one comes home. Below a richer neighbour that is no longer harmful, but it means the *first*
   quiet migration after boot is always an errand rather than sometimes one. Worth a look when 505 next
   touches the tier stack.
3. **Nothing spends obsidian except the granary and the beacon.** By design this cycle (the tithe on every
   structure recipe was specced out of scope), but it means a ground that has fetched one shard has no
   reason to fetch a second until it is granary-ready. The follow-up item is the answer.
