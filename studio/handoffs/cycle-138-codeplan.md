# Cycle 138 — Code Plan

Order: **lore track first, structure track second.** Both edit `game/src/scenes/WorldScene.ts`
and `game/src/world/saveGame.ts`; the regions are far apart (tic block ~L4450 / save block
~L7090 vs `checkCouncilCall` ~L800 / `parseSave` ~L500) but the Coder should land, build and
test the lore track before starting the structure track so a failure has one author.

---

## Lore track

**Item:** BACKLOG-421 — the ritual drifts (the tic gets a *haunt*).

### Files to create

- `tests/unit/cycle-138-haunt.test.ts` — the pure drift/anchor suite.
- `tests/e2e/cycle-138-haunt.spec.ts` — two stretches, two anchors, from a fresh save.

### Files to modify

- `game/src/world/tic.ts`
  - Add `export interface Haunt { tileX: number; tileY: number; drifts: number; }` and
    `export type Haunts = Record<string, Record<string, Haunt>>;` (dino → zone → haunt).
  - Add `HAUNT_RETURN_RANGE = 6` — furthest a dino will walk back to its habit.
  - Add `HAUNT_DRIFT_NOTED = 4` — drifts before the path is worth remarking on.
  - Add `hauntDistance(a, b)` — Chebyshev, so "6 tiles away" means the same in both axes.
    **Check `world/distance.ts` first**; if a Chebyshev helper already lives there, import
    it and add nothing.
  - Add `driftHaunt(h: Haunt, seed: number, cols, rows): Haunt` — one tile, deterministic.
    Direction from a **pure integer hash** of `(seed, h.drifts)` over the eight neighbours
    (reuse the `ring`-style table already in `ticStep`'s `circle` branch, extended to 8);
    clamp to the grid; `drifts + 1`. Must *not* call `rand()` — `world/rng.ts` is a global
    stream and a haunt that moves differently on reload is not a habit.
  - Add `hauntSeed(name: string): number` — a small string hash. **Reuse first:** grep for
    an existing name-hash (`ai/personality.ts` seeds personality from the name); if one is
    exported, use it and add nothing.
  - Add `ticAnchorFor({ haunt, at, cols, rows, seed })` — the one decision the scene calls:
    - no haunt → `{ anchor: at, haunt: { ...at, drifts: 0 } }` (first stretch, unchanged);
    - haunt further than `HAUNT_RETURN_RANGE` from `at` → same as no haunt (re-seat);
    - else → `next = driftHaunt(haunt, seed, cols, rows)`, `{ anchor: next, haunt: next }`.
  - Add `hauntDriftMemory(label)` and `hauntDriftedLine(name, glyph)` — the one-time memory
    and the ticker beat at `HAUNT_DRIFT_NOTED`. Wording in the register the file's other
    memory builders use (`ticMemory`, `griefTicMemory`).
- `game/src/scenes/WorldScene.ts`
  - New field `private ticHaunts: Haunts = {}` beside `ticAnchor`, plus
    `private hauntNoted = new Set<string>()` (lifetime, keyed `name:zone`, **not** cleared
    by `resetTic` — the 409 `ticsFormed` precedent).
  - New private `anchorForTic(d): Tile` that owns the whole choice: grief (414) first,
    exactly as now and **without touching `ticHaunts`**; else `ticAnchorFor(...)`, storing
    the returned haunt at `ticHaunts[name][zoneOf(d)]`, and firing the memory + ticker line
    once when `haunt.drifts >= HAUNT_DRIFT_NOTED` and `hauntNoted` does not hold the key.
  - The `ticcing` branch's `if (this.ticAnchor[d.name] === undefined)` block calls
    `anchorForTic(d)` instead of inlining the grief/`cur` fork.
  - `__inventTic` calls `anchorForTic(d)` too (replacing `??= this.tileOf(d)`), so the hook
    and production drive the same path — the `__noticeTraces` precedent.
  - New dev hook `__ticHaunt(name)` returning `{ haunt, anchor }` for the current zone.
  - `serialize`: write `ticHaunts: this.ticHaunts`.
  - `restore`: `this.ticHaunts = save.ticHaunts ?? {}`.
- `game/src/world/saveGame.ts`
  - `SaveData.ticHaunts?: Record<string, Record<string, { tileX: number; tileY: number; drifts: number }>>`
    with the additive comment in the `ticEchoFrom` house style.
  - Parse + return it in the nested-record idiom already used by `leftDays`
    (dino → zone → number) — same validation shape, numbers instead of one number.

### Reuse list

- `game/src/world/tic.ts` — `ticStep`, `griefAnchor`, `griefEdge`, `ticMemory` (voice and
  clamp idiom). The clamp helper inside `ticStep` is the pattern for `driftHaunt`.
- `game/src/world/movement.ts` — `Tile`; `stepToward` is already the walk-back path in the
  `ticcing` branch. **Do not add a second walk.**
- `game/src/world/distance.ts` — check for a tile-distance helper before writing one.
- `game/src/ai/personality.ts` — check for the exported name-hash before writing one.
- `game/src/world/saveGame.ts` — `leftDays` parse block is the copy-target.
- `tests/e2e/helpers.ts` — `boot`, `gatherToBowl`; `tests/e2e/cycle-137-warmth.spec.ts` is
  the hook-driving pattern (`__inventTic` / `__resetTic` / `__placeDino`).

### New dependencies

none.

### Test plan

Unit — `tests/unit/cycle-138-haunt.test.ts`:
- `driftHaunt` moves exactly one tile (Chebyshev 1) and increments `drifts`.
- Deterministic: two calls with identical inputs give the identical tile.
- Clamped: a haunt at `(0,0)` and at `(cols-1, rows-1)` stays in bounds over 20 drifts.
- Meanders: four consecutive drifts for one seed are not all the same delta.
- `ticAnchorFor` with no haunt returns `at` and seeds `drifts: 0` (first stretch unchanged).
- `ticAnchorFor` with a haunt 2 tiles away returns a tile adjacent to the haunt, not `at`.
- `ticAnchorFor` with a haunt `HAUNT_RETURN_RANGE + 1` away re-seats at `at`, `drifts: 0`.
- `hauntDriftMemory` names the ritual label it is given.

E2E — `tests/e2e/cycle-138-haunt.spec.ts`, from a fresh save:
- Place one dino, `__inventTic`, read `__ticHaunt().anchor` → A. `__resetTic`, `__inventTic`
  again from the same tile, read anchor → B. Assert `B !== A` and Chebyshev(A,B) === 1.
- Third stretch from a tile 8 away: assert the anchor is the dino's own tile (re-seat), and
  that it did not walk across the ground.
- Zero console errors, per the house rule.

Also touched: `tests/unit/saveGame.test.ts` — a `ticHaunts` round-trip and an absent-key case.

### Risks

- **`ticAnchor` is deleted by `resetTic`; `ticHaunts` must not be.** Getting this backwards
  makes every stretch a first stretch and the whole feature inert (and the e2e will say so).
- The grief branch must not write a haunt. If it does, a dino that grieves once relocates its
  habit to the map edge permanently.
- `driftHaunt` must not use `rand()`. The e2e seeds the world dice; a haunt drawn from that
  stream would couple this feature to every other spec's draws.
- The dino walks back to the anchor before performing. With a drift of one tile per stretch
  and a re-seat beyond 6, the walk is short — but if `HAUNT_RETURN_RANGE` is raised later,
  a dino can burn a whole stretch walking and never perform. Leave a `ponytail:` note.

### Estimated touch count

~6 files.

---

## Structure track

**Item:** BACKLOG-489 — one cause-aware announce gate (+ the `catchWarmth` parse defect).

### Files to create

- `game/src/world/gates.ts` — the seam.
- `tests/unit/cycle-138-gates.test.ts` — the three rules.
- `tests/e2e/cycle-138-billcall.spec.ts` — the reachable beat on a fresh save.

### Files to modify

- `game/src/scenes/WorldScene.ts`
  - Delete `lastWorkCallByZone` and `lastSpendCallByZone`; add one
    `private callLog: CauseLog<string> = {}` (keys `${zone}:work` / `${zone}:spend` so the
    two votes cannot collide on one ground).
  - `checkCouncilCall`: for the work call, the cause is `BILL_CAUSE` when
    `lean === call`, else `COUNCIL_CAUSE`; feed `recordCall` and announce on its verdict,
    choosing `billCallLine` vs the council wording exactly as now. Delete the
    `!seeding || lean === call` branch and the `seeding` / `seedingSpend` locals.
  - Spend call: `recordCall(..., COUNCIL_CAUSE, spend)`, announce on the verdict.
  - Keep both un-persisted and keep the comment saying why (a live read of a live situation).
- `game/src/world/saveGame.ts` — parse + return `catchWarmth` in the `foodBanked` idiom.
- `tests/unit/saveGame.test.ts` — the whole-shape round-trip spec (BACKLOG-498).
- `tests/unit/` (existing discontent spec, or a new case in the gates spec) — pin that
  `soundsDiscontent` fires on a ground with `lastDay === null`.

### Reuse list

- `game/src/world/governance.ts` / `ballot.ts` — `workCallMeaning`, `spendCallMeaning`,
  `billLean`, `billCallLine`. **No wording changes.**
- `game/src/world/saveGame.ts` — the `foodBanked` parse block, verbatim shape.
- `game/src/world/discontent.ts` — `soundsDiscontent` read-only; it is the control.
- No existing gate abstraction exists (grepped: the only two are the inline records being
  replaced), so `gates.ts` is greenfield by necessity, not by preference.

### New dependencies

none.

### Test plan

Unit — `tests/unit/cycle-138-gates.test.ts`:
- same value re-recorded → `announce === false`, log unchanged.
- virgin key + `seedsSilently` cause → `false`, value recorded.
- virgin key + non-seeding cause → `true`.
- **seeded key + a second, never-seen cause, same value → `true`** (the whole item).
- recorded cause + changed value → `true`.
- a cause on key A does not affect key B.
- `soundsDiscontent(shorts >= threshold, null, day)` → `true` (the not-a-defect control).

Unit — `tests/unit/saveGame.test.ts`:
- `catchWarmth` survives serialize → parse.
- a full-shape `SaveData` with every optional key populated round-trips to deep equality.
- a save with no `catchWarmth` still parses.

E2E — `tests/e2e/cycle-138-billcall.spec.ts`, fresh save:
- Drive a ground to a standing council work call, then make it derelict, then step; assert
  `billCallLine(zone)` appears in `__ticker()` exactly once. Use the existing derelict /
  council dev hooks (grep `__derelict`, `__council`); if the needed hook does not exist,
  add the smallest one that drives production's own path, not a second one.
- Regression in the same spec: a ground's first work call and first spend call are silent.

### Risks

- **The bill cause is derived, not stored.** `lean === call` decides which cause is
  recording. If the lean later changes to a *different* value than the council's call, the
  cause flips back to `council` and the value differs anyway, so it announces — correct, but
  the Coder should assert it rather than assume it.
- Existing 481/485/487 specs are the regression net. Run them before touching anything else,
  so a red one is provably pre-existing.
- The `catchWarmth` repair changes observable behavior on reload (the ceiling now bites).
  Any existing spec that reloads and re-earns warmth would go red — grep for one; there is
  none expected, since the field was never restored.
- BACKLOG-430's long-dialog e2e is red on clean HEAD. Do not chase it.

### Estimated touch count

~6 files. Combined cycle: ~12 files, inside the arc-sized ceiling.
