# Cycle 80 — QA

**Build:** `npm run build` clean (tsc -b + vite). **Unit:** `npx vitest run` → **827/827 green**
(84 baseline files + cycle-080-loner 6 + cycle-080-needs 5 + 3 saveGame-needs additions). **E2E:**
`npx playwright test` → **252/253 green**; the single failure is `cycle-077-carry` (an *untouched*
zone-carry spec), the catalogued rotating parallel-load flake — **green isolated twice** (`--workers=1`
and in a 2-spec run), nothing in the carry/migration path was modified this cycle. web-llm boundary grep
clean; `loner.ts` + `needs.ts` import no Phaser/web-llm.

## Lore track — BACKLOG-135 (The loner)

| # | Acceptance criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Every-bond-below-floor dino reports as a loner | ✅ | unit `isLoner` true for empty/weak-tie graphs; e2e `__loners()` lists unbonded dinos |
| 2 | A dino with a bond ≥ floor is not a loner | ✅ | unit (floor counts, symmetric); e2e `__bondPair('Rex','Sunny',30)` → both excluded |
| 3 | A loner's 🥀 shows in-view; a non-loner shows none | ✅ | `refreshMopeMarks` gates on `isLoner && inView`; status proven via `__isLoner`/`__loners` |
| 4 | A loner heads for / sits at the nearest edge under no override | ✅ | `edgeTarget` unit-pinned to a wall tile for the whole grid; mope branch drives `stepToward(edgeTarget)` |
| 5 | Greeting a loner raises friendship by more (loner bonus) + 💐 once | ✅ | e2e differential: `lonerDelta − plainDelta === 4` (LONER_BONUS); 💐 bubble via `perkUpLine` |
| 6 | Greeting a non-loner is byte-identical to today | ✅ | plain branch adds `0` when not a loner; full greet/tone suites green (006/012/035/032 after isolation) |
| 7 | Pure `world/loner.ts` (no Phaser/WebLLM) | ✅ | grep PURE |

> Note on AC-4 the design wrote "distance to edge does not increase over several steps." The Coder made the
> edge-drift **probabilistic** (`MOPE_CHANCE = 0.5`) to avoid an all-unbonded fresh-bowl deadlock (every dino
> is a loner at t=0 → deterministic drift pins the whole cast to walls, no meetings, no bonds, permanent
> loners). The 🥀 tell still rides loner status continuously; only the drift is rolled. QA accepts this as the
> correct fix — a deterministic version would have frozen the social loop. Edge-drift is verified by the pure
> `edgeTarget` pin rather than a multi-step distance assertion.

## Structure track — BACKLOG-371 (Need-drive spine)

| # | Acceptance criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Fresh dino {0,0}; needs rise + clamp ≤ 1 over steps | ✅ | unit `advanceNeeds`; e2e fresh `pressingNeed` null → `__advanceNeeds(120)` → pressing |
| 2 | `pressingNeed` null below / larger above / tie→thirst | ✅ | unit exhaustive |
| 3 | Higher-energy hunger rises faster | ✅ | unit `hungerRate(eager) > hungerRate(calm)` |
| 4 | Over-hunger shows 🍖, over-thirst 💧, else none | ✅ | `refreshNeedMarks` swaps `NEED_GLYPH[pressing]`; e2e drives pressing state |
| 5 | Feeding a hungry dino resets hunger + clears 🍖 | ✅ | e2e: build 120, drop food, step to eat → min hunger < 0.1; `eatFood` calls `satisfy(…, 'hunger')` |
| 6 | A thirsty dino reaching the pond resets thirst + clears 💧 | ✅ | e2e: `__setNeed('Rex','thirst',0.9)` + `__seePond` + `__checkNeeds` → thirst 0 (via `nearPond`) |
| 7 | `needs` round-trips save/load; absent → all-zero | ✅ | unit saveGame round-trip + back-compat + malformed-rejection |
| 8 | No death: a need pinned at 1 never removes a dino | ✅ | unit (keys unchanged after 10k steps); e2e `__population` unchanged after 5000 steps |
| 9 | Pure `world/needs.ts` (no Phaser/WebLLM) | ✅ | grep PURE |

## Cross-track
- Both tracks share `WorldScene.spawnDino` (two mark pushes + needs init) and the save serialize/restore —
  built in one pass, no clobber. `forceStep` edits are in disjoint regions (loner = wander-decision; needs =
  tail). No function edited by both. Mark offsets 💤(-1.0)/🥶(-1.4)/🥀(-1.4)/🍖💧(-1.7) — distinct slots.
- **Thirst-in-bowl** is intentional, not a half-feature: the pond is grove-only, so a bowl dino quenches
  thirst after it migrates (existing system); thirst builds at half hunger's rate so 💧 stays rare. The
  wander-pull that would let a thirsty dino seek water is the explicitly deferred 372.

**QA verdict: both tracks PASS.** Recommend APPROVED for each.
