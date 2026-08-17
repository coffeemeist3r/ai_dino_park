# Cycle 133 — Code Plan

Sequence: **lore track first** (`world/tic.ts` + the ambient-step block), then **structure track**
(`world/governance.ts` + `workPriorityFor`). Both touch the save block and the dev-hook block of
`WorldScene`; keeping them in that order puts their hunks apart.

---

## Lore track — BACKLOG-407 (shared tic)

### Prior art to reuse (checked before adding anything)

- `world/tic.ts` — `TIC_BY_AXIS`, `signatureTic`, `TIC_COMPANY_RANGE`, `ticMemory`/`griefTicMemory`/
  `soothingTicMemory` (the memory-builder shape to copy), `GRIEF_BOND_FLOOR` (the "close friend" bar the
  ache and the comfort visit already share — **reused, not redefined**).
- `social/bonds.ts` — `bondPoints(bonds, a, b)` for the pairwise read. No new bond helper.
- `WorldScene.chebyTiles` — the same metric `companyNear` uses for the tic's own company read.
- `WorldScene.zoneMates(d)` — same-zone names; the watch scan filters `this.dinos` directly since it needs
  the sprites for tiles, but the zone read is the same `zoneOf(this.dinoZones, …, BOWL_ID)` call.
- `remember(...)`, `flashFeed(...)`, `logEvent(...)` — the memory/glyph/ticker trio `performTic` already uses.

### `game/src/world/tic.ts` (edit)

```ts
export function signatureAxis(p: Personality): keyof Personality   // extracted from signatureTic
export function signatureTic(p: Personality): Tic                  // now TIC_BY_AXIS[signatureAxis(p)]
export const ECHO_WATCH_RANGE = 8;
export const ECHO_BOND_FLOOR = GRIEF_BOND_FLOOR;                   // alias, not a second number
export const ECHO_WATCHES_NEEDED = 3;
export function watchingTic(dist: number): boolean                 // dist > TIC_COMPANY_RANGE && dist <= ECHO_WATCH_RANGE
export function picksUpTic(watches: number, bond: number): boolean  // watches >= NEEDED && bond >= FLOOR
export function echoedTic(t: Tic): Tic                             // same kind + glyph, label reworded as borrowed
export function echoTicMemory(label: string, friend: string): string
export function echoedLine(watcher: string, friend: string, label: string): string  // the ticker beat
```

`signatureTic` keeps its exact current answer — the extraction is mechanical, and its existing spec is the
regression net. `echoedTic` must keep `kind` (the motion the watcher performs) and `glyph` (what the player
sees), changing only the label, so every downstream reader (412 sting note, 414 grief note, 408/413 caught
openers, 424 trace) is unchanged in shape.

### `game/src/scenes/WorldScene.ts` (edit)

State (both persisted, both additive):

```ts
private ticEchoes: Record<string, keyof Personality> = {};   // watcher → the axis whose ritual it picked up
private ticWatches: Record<string, number> = {};             // `${watcher}>${performer}` → count
```

Storing the **axis** rather than the `Tic` keeps the save free of display strings — if a glyph or label is
ever reworded, an old save's echo still resolves through `TIC_BY_AXIS`. (The cycle-131 `ZONE_TERRAIN`/482
lesson: persist the key, derive the rendering.)

1. `private ticFor(d: Dino): Tic` — `const axis = this.ticEchoes[d.name]; return axis ? echoedTic(TIC_BY_AXIS[axis]) : signatureTic(d.traits);`
   Replace **all three** `signatureTic(d.traits)` call sites with it: the `__tic` dev hook (L1169), the
   ambient tic step (L3969), and the keeper read at L5847. `signatureTic` itself stays exported and
   unit-tested — it is now "what this dino was born with", which 409 will want next cycle.
2. `private watchTic(performer: Dino): Array<{ name: string; watches: number; echoed: boolean }>` — called
   from `performTic`'s **invention branch only** (once per solitary stretch, never on the every-6-steps
   re-float). For each other dino in the performer's zone:
   - skip unless `watchingTic(this.chebyTiles(this.tileOf(o), this.tileOf(performer)))`,
   - skip unless `bondPoints(this.bonds, o.name, performer.name) >= ECHO_BOND_FLOOR`,
   - skip if `this.ticEchoes[o.name]` is already set (one echo per dino, ever),
   - else increment `ticWatches[`${o.name}>${performer.name}`]`, and if
     `picksUpTic(count, bond)` → set `this.ticEchoes[o.name] = signatureAxis(performer.traits)` **or the
     performer's own echoed axis if it carries one** (read it off the same `ticEchoes` map, so a dino that
     learned from a friend teaches what it actually performs — still one hop for the learner), file
     `echoTicMemory(ticFor(performer).label, performer.name)` via `remember`, `flashFeed(o, tic.glyph)`,
     and `logEvent(echoedLine(o.name, performer.name, …))`.
   Held by `this.ambientHeld` the way `noticeTraces` is, so a driven e2e crossing can't pick up stray watches.
3. `performTic` calls `this.watchTic(d)` at the end of its invention branch, after the performer's own
   memory/log — the performer's beat reads first in the ticker.
4. Dev hooks beside `__inventTic`: `__ticEcho(name)` → `{ axis, tic } | null`, `__ticWatches(a, b)` → number,
   `__watchTic(name)` → the `watchTic` pass (the `__noticeTraces` precedent — one path for game and spec).
5. Save: add `ticEchoes` + `ticWatches` to the save object and restore with `?? {}`. No envelope bump.

### Tests — `game/src/world/tic.test.ts` (extend)

Band edges (3 false / 4 true / 8 true / 9 false), `picksUpTic` truth table incl. the 7-bond and 2-watch
negatives, `signatureAxis`↔`signatureTic` agreement across a table of personalities, `echoedTic` preserves
kind+glyph and changes the label, both string builders name what they promise.

### Risk

The one real risk is **double-counting**: `performTic`'s invention branch is guarded by `ticInvented`, which
`resetTic` clears when company or a need returns — so a dino that keeps re-forming its ritual near a parked
friend accrues one watch per stretch, which is the intent. Do **not** hang the scan off the every-6-steps
re-float; that would turn 3 watches into 3 steps.

---

## Structure track — BACKLOG-485 (the bill reaches the call)

### Prior art to reuse

- `world/governance.ts` — `WorkPriority`, `councilWorkPriority`, `workCallMeaning`, `WORK_CALL`. The modifier
  lives here beside the call it modifies; **no new module**.
- `world/upkeep.ts` — `UPKEEP_GLYPH` (🛠️) for the ticker line, already the mark for a lapse and a patch-up.
- `WorldScene.derelictIn(zone)` (L2145) — the count already exists; nothing new derives it.

### `game/src/world/governance.ts` (edit)

```ts
export function billLean(derelict: number): WorkPriority | null   // derelict > 0 ? 'gather' : null
export function calledWork(voted: WorkPriority | null | undefined, derelict: number): WorkPriority | null
export function billCallLine(zoneName: string): string            // 🛠️ …turns to gathering — its own walls are coming down
```

`calledWork(x, 0)` must return `x` unchanged for `'gather' | 'build' | null | undefined` — that identity is
the whole compatibility argument and gets its own unit test.

### `game/src/scenes/WorldScene.ts` (edit)

1. `workPriorityFor(zone)`: leave the council/provider/lingering ladder **exactly** as it is (it still writes
   `workPriorityByZone`, which is what a patched-up ground returns to), and wrap only the three `return`
   points — cleanest as an inner `decide()` closure or a local `base`, then a single
   `return calledWork(base, this.derelictIn(zone));` at the end. The stored decision is never the leaned one.
2. `checkCouncilCall`: change the guard from `if (!this.councilFor(z.id).length) continue;` to also proceed
   when `this.derelictIn(z.id) > 0`, and pick the line by cause —
   `billLean(this.derelictIn(z.id))` non-null and equal to the new call → `billCallLine(z.name)`, else the
   existing 🗳️ vote line. First-seating seeding guard unchanged.

### Tests — `game/src/world/governance.test.ts` (extend)

`billLean` at 0/1/3; the `calledWork(x, 0) === x` identity over all four inputs; `calledWork('build', 1)` and
`calledWork(null, 1)` both `'gather'`; `billCallLine` names the zone.

### Risk

`workPriorityFor` is called several times a tick from several hooks — the added `derelictIn(zone)` is an
array filter over the landmark arrays, same cost class as the reads already in that function. Acceptable; no
caching (a cache is the thing that would go stale the moment a landmark lapses mid-tick).

---

## e2e — `game/tests/e2e/cycle-133-*.spec.ts`

- **Lore:** park two bonded dinos 5 tiles apart in one zone, force the watcher's bond ≥ 8 via the existing
  bond dev hook, drive three `__inventTic` + `__watchTic` passes on the performer, assert `__ticWatches` is 3,
  `__ticEcho(watcher)` names the performer's axis, and the ticker carries the echo line. Negative twin: same
  drive at 2 tiles (and at 12) leaves the echo null.
- **Structure:** force a landmark derelict in a zone whose call is `'build'`, assert `__workPriority(zone)`
  is `'gather'` and the 🛠️ line posted; patch it up (`__runUpkeep` with a stocked pile) and assert the call
  returns to `'build'`.

Both specs use the ambient hold (456) so the driven scenario isn't perturbed.

## Blockers

None known at plan time.
