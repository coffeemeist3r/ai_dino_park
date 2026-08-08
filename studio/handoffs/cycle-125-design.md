# Cycle 125 — Design

Milestone 12, arc 1 on each track. Lore: the loner leans on the keeper (370). Structure: the parallel-load
e2e seam (456), built before the milestone loads the suite with a fifth ground.

---

## Lore track — BACKLOG-370: Lonely lean on the keeper

**The gap.** `world/loner.ts` has shipped since cycle 80 with `edgeTarget(tile, cols, rows)` — the *nearest
of the four walls to the dino itself*. A loner withdraws to whichever wall it happened to be standing near.
That is correct for a dino with nothing left, and wrong for the specific dino this item is about: one whose
every dino-bond is under the floor but whose **keeper** friendship is deep. The one relationship it still
has has never had any bearing on where it goes when it withdraws. 135's own closing note names 370 as the
beat that fixes this, and it has sat queued for 45 cycles.

**The beat.** A loner with real hearts (BACKLOG-016 friendship) stops moping at the *nearest* wall and mopes
at the wall **the keeper is standing by** — it withdraws toward you rather than away from everyone. The
withdrawal stops being avoidance and becomes a bid for attention. A loner with no keeper relationship is
completely unchanged: it still takes the nearest wall.

**Design.**

- Pure additions to `game/src/world/loner.ts` — no new module (the loner read lives there; a second file
  would split one concept across two).
  - `LEAN_HEARTS = 4` — the heart floor at which the keeper outranks the nearest wall. Well clear of a
    fresh park (every dino is 0 hearts at spawn, and every dino is also a loner at spawn), so the feature
    is **dormant on a fresh save by construction**.
  - `leansOnKeeper(hearts: number, floor = LEAN_HEARTS): boolean` — a pure predicate.
  - `keeperEdgeTarget(keeper: Tile, cols: number, rows: number): Tile` — the wall tile *the keeper is by*:
    the nearest of the four walls **to the keeper**, at the keeper's own position along it. Same shape and
    same tie-break order as `edgeTarget` (left, right, top, bottom) so the two read identically.
  - `leanMemory(): string` — `'waited by the glass for the keeper'`, filed **once per solitary stretch**.
- `WorldScene.forceStep`, the `moping` branch only. Today: `stepToward(cur, edgeTarget(cur, COLS, ROWS), …)`.
  After: when `leansOnKeeper(heartsFromPoints(this.friendship[d.name] ?? 0))`, the target is
  `keeperEdgeTarget(this.playerTile(), COLS, ROWS)` instead. **Same-zone only** — a loner in another zone
  than the keeper's view takes the nearest wall as before (`this.inView(d)`), because a cross-zone dino
  walking at a keeper it cannot see is not a bid, it is a bug.
- The one-shot memory fires when a leaning loner **arrives** on its keeper-edge tile, guarded by a transient
  `leanFiled: Set<string>` cleared by `resetTic` (company or a need ends the solitary stretch — the same
  seam 408's `ticCaughtFiled` uses). Deliberately reusing that guard rather than inventing a second one.
- The `moping` decision itself, `MOPE_CHANCE`, the 🥀 mark, `LONER_BONUS`, and `isLoner` are **untouched**.
  This item changes *where a moping loner walks*, not who mopes or how often.
- No save-shape change: `friendship` and `bonds` both already persist; `leanFiled` is transient.
- Dev hook `__leanTarget(name)` → the tile that dino's mope branch would aim at right now (or `null` if it
  isn't a leaning loner), so the e2e can assert the decision without racing the walk.

**Acceptance criteria (lore)**

1. `leansOnKeeper(4)` is true; `leansOnKeeper(3)` is false; `leansOnKeeper(10)` is true.
2. `keeperEdgeTarget` returns the wall nearest the *keeper* at the keeper's own row/column, for each of the
   four walls (four cases).
3. `keeperEdgeTarget` breaks a tie in the same order as `edgeTarget` (left before right before top before
   bottom), asserted on a keeper at the exact centre of an even grid.
4. `edgeTarget` is byte-identical to its cycle-80 behaviour — its existing specs pass unchanged.
5. A loner at ≥ `LEAN_HEARTS` hearts, in the keeper's zone, aims its mope step at `keeperEdgeTarget`, not
   `edgeTarget` (e2e via `__leanTarget`).
6. A loner **below** `LEAN_HEARTS` hearts aims at `edgeTarget` — the cycle-80 behaviour, unchanged.
7. A loner in a different zone from the keeper aims at `edgeTarget` regardless of hearts.
8. A non-loner returns `null` from `__leanTarget` (the branch is not reached).
9. `leanMemory()` is filed at most once per solitary stretch, and re-armed after `resetTic`.
10. A fresh park files no lean memory and shows no behaviour change: every dino is 0 hearts, so every mope
    is the nearest wall (e2e, negative assertion on a fresh save).
11. `npm run build` clean; no `@mlc-ai/web-llm` import outside `game/src/ai/`.
12. The save round-trips with no new field.

---

## Structure track — BACKLOG-456: the parallel-load e2e seam

**The gap.** 431 shipped `__pauseAmbient`, which gates the three **wall-clock timers** (`maybeStartSky`,
`forceStep`, `maybeMigrate`). It does nothing about what happens *inside* a `forceStep` the spec drives
itself. Four catalogued specs drive `__stepWorld` in a loop and are broken by ambient work riding those same
steps. They are not one bug; they are three mechanisms.

**Design — three separate, minimal changes.**

**(a) A deeper hold: `ambientHeld`.** A second flag, distinct from `ambientPaused` (which stays exactly as
it is — widening the existing hook would change behaviour under every spec that already calls it). When
held, `forceStep` skips exactly three things:

- the pairwise **meeting** loop (`recordMeet` / `strengthen` / `checkLonerLift` / `flashMeet` / `converse`),
- `maybeSpawnResource()`,
- `checkGather()`.

Nothing else. Movement, crossings, needs, feeding, plots, barter, eggs and the governance hooks all still
run, because every one of the four specs is *driving* one of those and a blanket freeze would break them.

Hooks: `__holdAmbient()`, `__releaseAmbient()`, `__ambientHeld()`. Naming deliberately parallel to 431's.

**(b) A deterministic homesick pick.** `pickMigrant`'s homesick tier is
`homesick[Math.floor(Math.random() * homesick.length)]`. Every migration pick shipped since cycle 109 —
`richestNeighbor` (450), `unsettledNeighbor` (474), `hopToward` (475), `pondCompanion` (360) — is
positional on purpose, each citing this item. This is the last random pick in a set the specs assert
identity on. It becomes `homesick[0]` (first in `this.dinos` order), which is the same "first in list order
wins" rule the other four use.

**(c) A save-settle helper.** `saveGame()` is called as `void this.saveGame()` in ~10 places — fire and
forget, which is correct for play and is exactly the reload race in `cycle-121-work-priority`. Add
`__flushSave()` returning the `saveGame()` promise, so a spec can `await page.evaluate(() => (window as
any).__flushSave())` before `page.reload()`. No production behaviour change whatsoever.

**Then move the four specs onto the seam:**

| Spec | Mechanism | Change |
|---|---|---|
| `cycle-077-carry` | pinned pile vs. spawn/gather | wrap the driven crossing in `__holdAmbient` / `__releaseAmbient` |
| `cycle-097-carry-pressure` | pinned pile vs. cairn drain | same |
| `cycle-076-news-pull` | ambient meetings mutate `bonds` → homesick branch | same, **plus** (b) makes the pick deterministic if it is reached at all |
| `cycle-121-work-priority` | reload races the IndexedDB write | `await __flushSave()` before `page.reload()` |

**Acceptance criteria (structure)**

1. `__ambientHeld()` is `false` on boot; `__holdAmbient()` makes it `true`; `__releaseAmbient()` `false`.
2. Held: a `__stepWorld` with two dinos on the same tile records **no** meeting and **no** bond change.
3. Held: `__stepWorld` spawns no resource and banks no gathered resource — a pinned pile total is
   unchanged across 10 driven steps.
4. Released: all three resume — the same 10 steps produce meetings/bonds again (the hold is a hold, not a
   permanent disable).
5. Held: movement, crossings and needs still run — a driven crossing completes under the hold.
6. `ambientPaused` and its three hooks are unchanged; a spec that calls only `__pauseAmbient` behaves
   exactly as before.
7. `pickMigrant`'s homesick tier returns the first homesick candidate in list order, asserted over 20 calls
   with two eligible homesick dinos (the `pondCompanion` precedent).
8. The tiers above and below homesick are untouched — the cycle-076/078 identity pins pass unchanged.
9. `__flushSave()` resolves, and a value written immediately before it survives a reload (e2e).
10. All four catalogued specs are moved onto the seam and pass.
11. Two consecutive **full** `npx playwright test` runs are green, including all four.
12. `npx vitest run` green; `npm run build` clean.
13. No production code path reads `ambientHeld` outside the three skipped calls (grep-checkable).
14. No save-shape change.

---

## Cross-track note

The two tracks share no file. 370 touches `world/loner.ts` and the `moping` branch of `forceStep`; 456
touches the meet loop / spawn / gather calls at the *tail* of `forceStep`, `pickMigrant`, the dev-hook
block, and `tests/e2e/`. The Coder should land 456 first: 370's e2e wants a quiet park, and the hold is
what supplies one.
