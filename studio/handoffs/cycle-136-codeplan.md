# Cycle 136 — Code Plan

**Build order (cross-track collision):** both tracks edit `game/src/scenes/WorldScene.ts`. Build the
**structure track first** (it is the larger diff and touches `setupSave`, `runUpkeepPass`, the world-step
movement branch and the dev-hook block), then the **lore track** (`replyFor` ~6090 and `resetTic` ~3710).
The regions do not overlap; sequencing is only to keep the diffs readable.

---

## Structure track

### Item
**BACKLOG-488** — Hands on the derelict. Repair becomes a job a resident walks to, and the founding park
ships a ruin to walk to.

### Files to create
- `game/src/world/mending.ts` — the pure module. No Phaser, no WebLLM.
  - `export const MEND_GLYPH = '🛠️'` — reuse `UPKEEP_GLYPH`'s mark so the ticker and the float read as one system.
  - `export const MEND_STEPS = 40` — the errand's step budget, the `FETCH_STEPS` sizing (a corner-to-corner
    walk on a 20×15 map is ~35 manhattan steps).
  - `export const MEND_COOLDOWN_MS = 20_000` — the real-time gate between dispatches, matched to the
    CHARTER v7 migration retune (20s) so a beat lands in a normal session rather than in a spreadsheet.
  - `export interface Mend { fixer: string; zone: string; tileX: number; tileY: number; steps: number }`
  - `export function canMend(pileTotalUnits: number, cost: number): boolean` — a number in, so the module
    does not import `resource.ts` for one comparison. `pileTotalUnits >= cost && cost > 0`.
  - `export function mendLine(fixer: string, structure: string): string` — the fixer's bubble.
  - `export function mendMemory(zoneName: string, structure: string): string` — `put the <Zone>'s <glyph>
    back up` (the item's own words; the courier's pride, in this register).
  - `export function mendEventLine(fixer: string, zoneName: string, glyph: string): string` — the ticker
    line that names *who*, sitting beside 480's `patchedLine` (which still fires, so a spec written
    against 480's wording is not broken).
- `game/src/world/founding.ts` — the founding-state seed, pure data + one pure builder.
  - `export const FOUNDING_RUIN: { zone: string; tileX: number; tileY: number }` — the Grove, a tile the
    Grove's terrain reports as `grass` (check `groveTileAt`; do not drop it in the pond).
  - `export const FOUNDING_PILE: Record<string, Stockpile>` — `{ grove: { stone: 2 } }`.
  - Header carries the CHARTER v7 corollary and *why* this exists, so a future tuning pass cannot quietly
    zero it back to inert.
- `tests/unit/cycle-136-mending.test.ts`
- `tests/unit/cycle-136-founding.test.ts`
- `tests/e2e/cycle-136-mending.spec.ts`

### Files to modify
- `game/src/scenes/WorldScene.ts`
  - **imports** — add the `mending.ts` + `founding.ts` symbols; `cooldownReady` from `world/clock`;
    `pileTotal` from `world/resource`; `pickNearest` is already imported (448).
  - **new fields** — `private mend: Mend | null = null;` and `private lastMendMs = 0;` beside the
    `escort` field (~546), with the same one-line comment convention.
  - **`setupSave()` `!save` branch (~6870)** — call `this.seedFounding()` before `showKeeperInvite()`.
  - **new `private seedFounding(): void`** — pushes `FOUNDING_RUIN` into `this.cairns` with
    `derelict: true`, calls the existing `drawCairn`, merges `FOUNDING_PILE` into `stockpileByZone`,
    then `applyObjectVisibility()` so the alpha pass runs. Fresh-save only; never called on restore.
  - **new `private checkMend(): void`** — the dispatch. Guards in order: an errand already running →
    return; `cooldownReady(Date.now(), this.lastMendMs, MEND_COOLDOWN_MS)` → return if not; the **current**
    zone (`this.zoneId`) only; `this.landmarkRecords(zone).find(r => r.rec.derelict)` → return if none;
    `canMend(pileTotal(this.pileFor(zone)), REPAIR_COST)` → return if not; residents of that zone by
    chebyshev distance to the ruin → `pickNearest` → return if null. Sets `this.mend` and `this.lastMendMs`.
  - **new `private stepMend(): void`** — resolve once per world step, built exactly like `stepEscort`:
    fixer gone / left the zone → `this.mend = null`; adjacency to the target tile (the `stepEscort`
    `TILE * 1.01` test) → **resolve**: spend `REPAIR_COST` off the pile via the same largest-kind rule
    (reuse — see Reuse list), clear `rec.derelict`, `applyObjectVisibility()`, bubble `mendLine`,
    `flashFeed(fixer, MEND_GLYPH)`, `remember(...)` with `mendMemory`, `logEvent(patchedLine(...))` **and**
    `logEvent(mendEventLine(...))`, `void this.saveGame()`, `this.mend = null`. Then decrement `steps`;
    `<= 0` → `this.mend = null` with nothing spent.
  - **world step (~4180 movement branch)** — a `mending` branch for the fixer, ranked beside `gathering`
    (below `huddling`, above `moping`/`ticcing`), stepping `stepToward(cur, target)`; set
    `this.activityById[d.name] = 'working'` if that activity id exists, else reuse `'gathering'`. Call
    `this.checkMend()` and `this.stepMend()` once per world step beside the existing `stepEscort()` call.
  - **`runUpkeepPass(days = 1)` (~6550)** — the live form passes `0` as `derelict` to `runUpkeep` (bill
    only). The `days > 1` form is unchanged (`runUpkeepOverDays` keeps the full arithmetic). The
    `plan.repaired` loop stays, so the away path still patches; on the live path `plan.repaired` is
    always 0 and the loop is a no-op.
  - **dev hooks (~1386)** — `__mend` (the live errand or null), `__seedFoundingRuin(zone)` is **not**
    needed (the founding seed is real production state), `__stepMend()` to drive one deterministic
    resolve step from a spec without waiting on frame timing (the `__noticeTraces` precedent).
- `tests/e2e/cycle-128-upkeep.spec.ts` — **deliberate spec update**, per the design's constraint and
  CHARTER v7. Two assertions change because they are assertions *about the two facts this item changes*:
  1. "a fresh park owes nothing" — the `__runUpkeep(1)` → `[]` assertion **still holds** and stays. The
     `__runUpkeep(7)` → `[]` assertion becomes "the away form patches the founding ruin the Grove can
     afford", asserting the patch line rather than emptiness. Retitle the test to say what it now means.
  2. "…and patches it back up when it can" — the live `runUpkeep` no longer patches. Split: the lapse
     half is unchanged; the patch half moves to `cycle-136-mending.spec.ts` (where a body does it) and
     what remains here asserts the away form still converges. **No assertion about lapsing, the granary
     split, the cap lift or the one-landmark floor is weakened.**

### Reuse list
- `world/upkeep.ts` — `runUpkeep`, `runUpkeepOverDays`, `REPAIR_COST`, `DERELICT_ALPHA`, `patchedLine`,
  `UPKEEP_GLYPH`, `type Landmark`. **Not edited** (the design forbids it).
- `world/movement.ts` — `pickNearest` (the 448 nearest-resident tie-break, already imported),
  `stepToward`, `type Tile`.
- `world/clock.ts` — `cooldownReady` (the 333 real-time gate; migration already uses it).
- `world/resource.ts` — `pileTotal` for the affordability read.
- `WorldScene` privates — `landmarkRecords` (raise-ordered landmarks + glyph, 480), `pileFor`,
  `derelictIn`, `standingIn`, `chebyTiles`, `tileOf`, `dinoByName`, `applyObjectVisibility`, `drawCairn`,
  `flashFeed`, `showBubble`, `logEvent`, `saveGame`, `remember` (from `ai/memory`).
- `stepEscort` / `escortTarget` (381) — copy the **shape** (adjacency test, step budget, null-out on a
  missing dino), not the code. This is the established two-phase-errand pattern; the mend is its
  one-phase sibling.
- **Spending a unit off the pile:** `upkeep.ts`'s `spendOne` is module-private. Do **not** re-implement
  the largest-kind rule in `mending.ts` — export `spendOne` from `upkeep.ts`… **no**: the design forbids
  editing `upkeep.ts`. Instead call the existing public path: `runUpkeep(pile, 0, 1)` with `standing = 0`
  and `derelict = 1` returns `{ pile: <pile minus REPAIR_COST>, paid: REPAIR_COST, lapsed: 0, repaired: 1 }`
  — zero standing means zero bill, so the only thing that call does is *the repair spend*, through the
  exact function that has always done it. Use `plan.pile` and ignore `plan.repaired` (the scene owns the
  flag). Note this in the code with one line, because it is non-obvious.

### New dependencies
`none`.

### Test plan
**Unit — `tests/unit/cycle-136-mending.test.ts`**
- `canMend` is false at `pileTotal 0`, true at `>= REPAIR_COST`.
- `mendLine` / `mendMemory` / `mendEventLine` contain the fixer, the ground name and the structure glyph.
- `mendMemory` is not matched by any `WEIGHTS` regex used by the greeting/recall scorers (the 403
  precedent — a mend must not read as a slight or a gift).
- `MEND_STEPS` is at least the manhattan diagonal of the map, so an ordinary errand is not budget-bound.
- The spend seam: `runUpkeep(pile, 0, 1)` costs exactly `REPAIR_COST` and reports `lapsed: 0` — pinned so
  a future `upkeep.ts` change cannot silently make the mend charge a bill.

**Unit — `tests/unit/cycle-136-founding.test.ts`**
- `FOUNDING_RUIN.zone` is a real zone id in `zoneChain()`, and its tile is walkable
  (`zoneTileAt(grove, x, y)` is not `'water'`).
- `FOUNDING_RUIN.zone` has at least one `ROSTER` entry living there — the ruin is on a ground with hands.
- `pileTotal(FOUNDING_PILE[FOUNDING_RUIN.zone]) >= REPAIR_COST` — **the reachability pin.** A tuning pass
  that drops the founding pile below the repair cost makes the founding beat unreachable, and this test
  is the thing that says so out loud.
- `upkeepDue(0) === 0` — the founding ruin bills the Grove nothing (480's rule, re-asserted here because
  the founding state now depends on it).

**E2E — `tests/e2e/cycle-136-mending.spec.ts`**
1. *the founding park has a ruin* — boot fresh; `__landmarks('grove')` has exactly one record with
   `derelict: true`; `__standing('grove') === 0`; `__runUpkeep(1)` returns `[]`.
2. *somebody mends it* — walk the player into the Grove (the existing zone-crossing helper), drive
   `__stepMend()` in a loop up to `MEND_STEPS`; assert `__mend()` is non-null mid-errand, then that the
   landmark is no longer derelict, the ticker contains "patched up", the fixer's `__memory()` names the
   Grove, and the Grove's pile fell by `REPAIR_COST`.
3. *no pile, no mend* — `__setZonePile('grove', {})` before entering; `__mend()` stays null and the ruin
   stays derelict.
4. *the live day tick does not patch* — stock the Grove, do **not** run the errand, call `__runUpkeep(1)`;
   the ruin is still derelict.
5. Zero console errors in every test.

**E2E — `tests/e2e/cycle-128-upkeep.spec.ts`** — re-run after the deliberate edit above; the lapse,
granary-split, cap-lift and one-landmark-floor assertions must all still pass untouched.

### Risks
- **The 7-day away assertion in 128.** With a founding ruin *and* a founding pile in the Grove, the away
  form now has something to patch on a fresh park, so `__runUpkeep(7)` no longer returns `[]`. This is
  expected and is the point; the risk is editing it sloppily. Change the assertion, not the behaviour.
- **`buildUp()` in 128 uses `dinos[0]` = Rex, whose zone is the bowl.** The founding ruin is in the Grove,
  so `standing(bowl)`, the granary gate and every bowl assertion in that spec are untouched. Verify by
  running that spec, not by reasoning.
- **Boot ordering.** `loadFromDb()` resolves a beat after `create()`. `seedFounding` must run inside the
  `!save` callback (after the sprite arrays and `drawCairn` exist), not in `create()`.
- **Double-seeding.** If `setupSave` could ever run twice, the Grove would collect cairns. Guard with a
  one-shot flag or assert the array is empty before seeding.
- **`applyObjectVisibility` cost.** It is already called per zone change; one extra call at boot is fine.
- **Activity id.** If `'working'` is not a valid `activity.ts` id, reuse an existing one rather than
  widening the union — a new activity id would ripple into the book and the lens.

### Estimated touch count
`~8 files` (2 new source, 2 new unit, 1 new e2e, 1 edited e2e, `WorldScene.ts`, plus the imports).

---

## Lore track

### Item
**BACKLOG-420** — Caught again. A repeat catch inside one solitary stretch escalates pleased → teasing →
fondly resigned, worded from the dino's signature axis.

### Files to create
- `tests/unit/cycle-136-caught-again.test.ts`
- `tests/e2e/cycle-136-caught-again.spec.ts`

### Files to modify
- `game/src/world/tic.ts` — additive only; **no existing export changes**.
  - `export type CaughtRegister = 'bashful' | 'pleased' | 'teasing' | 'resigned'`
  - `export const CAUGHT_TEASE_AT = 2` / `export const CAUGHT_RESIGNED_AT = 3` — the two thresholds, named
    so a tuning pass moves a constant rather than an `if`.
  - `export function caughtRegister(catches: number, fond: boolean): CaughtRegister` — `fond ? (catches >=
    CAUGHT_RESIGNED_AT ? 'resigned' : catches >= CAUGHT_TEASE_AT ? 'teasing' : 'pleased') : 'bashful'`.
    Floors at `resigned`; a 9th catch is a 3rd catch.
  - `const TEASE_BY_AXIS: Record<keyof Personality, string>` and `const RESIGNED_BY_AXIS: Record<keyof
    Personality, string>` — one line per axis, in the voice `TIC_BY_AXIS` already established (a curious
    dino accuses you of taking notes, a jittery one of sneaking, an aloof one is pointedly unbothered).
  - `export function teaseOpener(axis: keyof Personality): string` / `export function
    resignedOpener(axis: keyof Personality): string`.
  - `export function teaseMemory(label: string): string` / `export function resignedMemory(label: string):
    string` — the twins of `fondCaughtMemory`, naming the ritual the same way.
  - `export function caughtOpener(register, axis): string` — the single entry point the scene calls, so
    the scene holds no register `switch`. Returns `bashfulOpener()` / `fondOpener()` for the two existing
    registers, **calling the existing functions** rather than duplicating their strings.
  - `export function caughtRegisterMemory(register, label): string | null` — same shape, returns
    `caughtMemory` / `fondCaughtMemory` / `teaseMemory` / `resignedMemory`.
- `game/src/scenes/WorldScene.ts`
  - **new field** `private ticCatches: Record<string, number> = {};` beside `ticCaughtFiled` (~409 region).
  - **`ticCaughtFiled`** changes from `Set<string>` to `Set<string>` keyed `` `${name}:${register}` `` —
    the smallest change that files one memory *per register* instead of one per stretch. `resetTic` deletes
    every key for that name (it currently calls `.delete(name)`; it will iterate the set).
  - **`resetTic(name)` (~3710)** — also `delete this.ticCatches[name]` and clear the per-register filed keys.
  - **`replyFor` (~6090)** — replace the two-way fork with: increment `this.ticCatches[target.name]` when
    `caught`; compute `fond` exactly as today; `const register = caughtRegister(catches, fond)`;
    `const axis = signatureAxis(personalityOf(target.name))` (the read `ticFor` already performs — reuse
    whatever accessor it uses rather than re-deriving); `text = caught ? \`${caughtOpener(register, axis)}
    ${reply.text}\` : reply.text`; file `caughtRegisterMemory(register, label)` once per
    `` `${name}:${register}` `` key. `this.caughtTic = null` stays where it is.
  - **dev hook** — `__ticCatches(name)` returning the live per-stretch count, so the e2e can assert the
    counter resets without inferring it from text.

### Reuse list
- `world/tic.ts` — `bashfulOpener`, `fondOpener`, `caughtMemory`, `fondCaughtMemory`, `fondOfBeingCaught`,
  `signatureAxis`, `TIC_BY_AXIS` (for the label), `type Tic`. The two new registers **call** the two old
  openers through `caughtOpener` rather than restating their text, which is what keeps
  `cycle-088-caught-mid-tic` and `cycle-089-fond-caught` green by construction.
- `ai/personality.ts` — `AXES`, `type Personality`. `ai/brain.ts` — `FOND_MIN` (already imported by tic.ts).
- `WorldScene` privates — `ticFor`, `heartsFromPoints`, `remember`, `recall`, `this.friendship`.

### New dependencies
`none`.

### Test plan
**Unit — `tests/unit/cycle-136-caught-again.test.ts`**
- `caughtRegister` table: `(1,true)='pleased'`, `(2,true)='teasing'`, `(3,true)='resigned'`,
  `(9,true)='resigned'`, `(1..9,false)='bashful'` — the non-fond row is the flatness the design wants.
- `caughtOpener('pleased', axis) === fondOpener()` and `caughtOpener('bashful', axis) === bashfulOpener()`
  for **every** axis — the compatibility seam is "the old path *is* the old function".
- `teaseOpener` returns a **distinct** string for all five axes (a `new Set(...).size === 5` assertion) —
  the distinctness criterion, pinned. Same for `resignedOpener`.
- No tease/resigned opener contains the substrings the existing specs match (`'caught mid-fidget'`,
  `"don't mind"`) — asserted, so a reworded opener cannot silently collide with an older spec.
- `teaseMemory` / `resignedMemory` embed the ritual label and are not matched by the greeting `WEIGHTS`
  regexes (the 403 precedent).

**E2E — `tests/e2e/cycle-136-caught-again.spec.ts`**
1. *the register climbs* — fond dino, `__inventTic`, greet four times; assert opener 1 is the 413 text,
   2 is neither existing opener, 3 and 4 are identical to each other and different from 2.
2. *warmth earns the tease* — a 0-hearts dino greeted three times returns the bashful text every time.
3. *two dinos, two teases* — two fond dinos with different `signatureAxis`, both caught twice, return
   different tease text.
4. *a new stretch starts warm* — after the count resets (drive `__inventTic` again after a reset, or use
   `__ticCatches` to confirm zero), the next catch is the 413 opener again.
5. *one memory per register* — `__memory(name)` after four catches contains exactly one tease-flavoured
   and one resigned-flavoured note.
6. Zero console errors.

**E2E regression** — `cycle-088-caught-mid-tic.spec.ts` and `cycle-089-fond-caught.spec.ts` must pass
**unedited**. If either needs a change, the seam was built wrong.

### Risks
- **`ticCaughtFiled` is read elsewhere.** Grep before changing its shape; if any other beat reads it,
  add a second set rather than repurposing it.
- **The counter must increment on the *caught* path only**, not on every greet, or an ordinary
  conversation would burn a dino's registers before it ever ticced.
- **A cancelled greet.** `caughtTic = null` on cancel (line ~6045) must run *before* any increment, or a
  dismissed dialog would advance the register. Increment inside the `if (caught)` block, nowhere else.
- **`resetTic` iterating a Set** — a `for (const k of [...this.ticCaughtFiled])` copy, not a live-mutating
  iteration.
- **Non-persistence is deliberate.** Do not add the counter to `currentSaveData()`; the design says so and
  a save key would need a compatibility story for zero player-visible gain.

### Estimated touch count
`~4 files`.

---

## Combined

**Estimated touch count:** `~12 files` — arc-sized, under the CHARTER v6 ceiling of ~15.

**Boundary check:** neither track imports `@mlc-ai/web-llm`. Both new modules are pure TypeScript with no
Phaser import. The lore track prefixes a deterministic frame to whatever the brain returned — the model is
never asked to be teasing, so the `NPCBrain` boundary is unchanged.

**Save check:** the structure track writes only existing fields (`cairns`, `stockpileByZone`); the lore
track persists nothing. No version bump, no migration, old saves load unchanged.
