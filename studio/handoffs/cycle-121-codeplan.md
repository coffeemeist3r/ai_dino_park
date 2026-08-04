# Cycle 121 — Code Plan

Two tracks. Both are "one new pure read + two seams in `WorldScene`" — the shape the last four cycles have
settled into. The reuse audit found the record each track needs already exists; neither track invents state
the park does not already keep.

**Cross-track collision:** `game/src/scenes/WorldScene.ts` and `game/src/world/saveGame.ts` only.
**Order: structure track (473) first, then lore track (362).** 473's `saveGame` field and its `WorldScene`
member sit next to the *governance* block (line ~485), 362's next to the *migration* block (line ~4640) —
far apart, but doing governance first means the save-field additions land in one pass and the lore track
rebases onto a green tree. Neither track edits a line the other edits.

---

## Structure track — BACKLOG-473

**Item:** The ground's second decision — a provider-set `WorkPriority` (`'gather'` | `'build'`).

### Files to create

- `tests/unit/cycle-121-workpriority.test.ts` — the pure governance reads.
- `tests/e2e/cycle-121-work-priority.spec.ts` — the lens read + the deferred landmark.

### Files to modify

- `game/src/world/governance.ts` — **extend, do not fork.** The second policy lives beside the first, the
  way `spendGlyph` lives beside its own hooks. Add:
  - `export type WorkPriority = 'gather' | 'build'`
  - `export const WORK_BUILD_FLOOR = 6` — pile total a `'gather'` ground wants before it spends on a
    landmark. Calibration knob; 6 is above the cairn recipe and below the granary's, so a gather-first
    ground visibly banks a while and still builds.
  - `export const GATHER_REGROW_MULT = 1.6`, `export const BUILD_REGROW_MULT = 0.6`
  - `providerWorkPriority(traits?: Personality): WorkPriority` — `(traits?.energy ?? 0.5) >= 0.5 ? 'build' : 'gather'`.
    Reads **energy**; `providerPriority` reads agreeableness. Absent traits → `'build'` = today's behaviour.
  - `landmarkDeferredForGathering(p, pileTotal): boolean` — `p === 'gather' && pileTotal < WORK_BUILD_FLOOR`.
    Exact twin of `granaryDeferredForFeeding`'s shape.
  - `granaryGateFor(p, base): number` — `p === 'build' ? Math.max(1, base - 1) : base`.
  - `workRegrowth(p, y): number` — `regrowYield` with the multiplier applied to the *delta*, clamped to
    `[0, YIELD_MAX]`. Implemented as `clamp(y + YIELD_REGROW * mult(p))`, `mult(null) === 1` exactly, so the
    `null` seam is bit-identical to `regrowYield(y)`.
  - `workGlyph(p): string` — `'🧺'` / `'🧱'` / `''`.
  - Imports `YIELD_MAX`/`YIELD_REGROW` from `./regrowth` (both already exported) — do **not** re-declare them.
- `game/src/world/handover.ts` — `handoverBeat` gains a 5th **optional** param `work?: WorkPriority`; when
  present the tail becomes `<priorityPhrase> · <workPhrase>` (`workPhrase`: `'backs to the stores'` /
  `'backs to the walls'`). Optional so every existing 4-arg call and shipped spec stays valid.
- `game/src/ui/lenses.ts` — `ZoneMapEntry` gains `work: WorkPriority | null`; `zoneMapModel` gains a
  trailing optional `works: Record<string, WorkPriority | null> = {}` param (absent → null, the same
  older-callers seam every param since 428 has used).
- `game/src/world/saveGame.ts` — add `workPriorityByZone?: Record<string, 'gather' | 'build'>` to the save
  interface + a parse guard **cloned from the `spendPriorityByZone` guard** (same string-valued object
  shape). Additive; absent → `{}`. **No `SAVE_VERSION` bump.**
- `game/src/scenes/WorldScene.ts`:
  - New member `workPriorityByZone: Record<string, WorkPriority> = {}` beside `spendPriorityByZone`.
  - New `workPriorityFor(zone): WorkPriority | null` — an exact structural copy of `spendPriorityFor`
    (standing provider → recompute + store; else the lingering stored value; else `null`).
  - `buildOnGather` — two edits: the granary gate becomes
    `granaryGateFor(this.workPriorityFor(zone), GRANARY_AFTER_STRUCTURES)`, and the bias-landmark build is
    skipped when `landmarkDeferredForGathering(this.workPriorityFor(zone), pileTotal(this.pileFor(zone)))`.
  - The regrowth tick (line ~1598) — `regrowYield(...)` becomes
    `workRegrowth(this.workPriorityFor(zone), this.yieldByZone[zone] ?? YIELD_MAX)`.
  - The handover call site passes the work priority as the new 5th arg.
  - `zoneWorks()` beside `zoneSpends()`, passed to `zoneMapModel`; the lens box template appends
    `${e.work ? ' ' + workGlyph(e.work) : ''}` after the spend glyph.
  - Save write + load for `workPriorityByZone` (mirror the `spendPriorityByZone` lines exactly).
  - Dev hook `__workPriority = (zone?: string) => this.workPriorityFor(zone ?? this.zoneId)` beside
    `__spendPriority` (line ~1008).

### Reuse list

- `game/src/world/governance.ts` — the whole 463 policy shape (temperament read → persistent enum → hooks →
  glyph). This is an extension of that module, **not** a new one.
- `game/src/world/regrowth.ts` — `YIELD_MAX` / `YIELD_REGROW` / the clamp semantics. Do not re-derive.
- `game/src/world/resource.ts` — `pileTotal` for the build floor. Already imported by WorldScene.
- `game/src/world/handover.ts` — `priorityPhrase`'s pattern for the second phrase.
- `game/src/ui/lenses.ts` — the trailing-optional-param convention on `zoneMapModel`.
- `providerFor` / `dinoByName` in WorldScene — the provider read `spendPriorityFor` already uses.

### New dependencies

none.

### Test plan

**Unit — `tests/unit/cycle-121-workpriority.test.ts`**
- `providerWorkPriority`: `energy 0.9 → 'build'`, `0.1 → 'gather'`, `undefined → 'build'`, boundary `0.5 → 'build'`.
- Axis independence: `{energy: 0.9, agreeableness: 0.1}` → `'build'` + `'bank'`; mirrored fixture → `'gather'` + `'feed'`.
- `landmarkDeferredForGathering`: `null`/`'build'` false for 0..12; `'gather'` true below 6, false at 6 and above.
- `granaryGateFor`: `'build'` shaves one, floors at 1 (`base 1 → 1`); `'gather'`/`null` pass through.
- `workRegrowth`: `null` equals `regrowYield` exactly for 0, 0.5, 1; ordering `gather > null > build` at 0.5;
  all three clamp to `[0, YIELD_MAX]` at 0 and 1.
- `workGlyph`: 🧺 / 🧱 / `''`.
- `handoverBeat` with the 5th arg names both calls; without it the 4-arg output is unchanged (regression pin).
- `zoneMapModel` with no `works` arg → every entry `work: null` (older-caller pin).
- `saveGame`: a payload with `workPriorityByZone` round-trips; one without it parses with the field
  `undefined`; a non-string value returns `null`.

**E2E — `tests/e2e/cycle-121-work-priority.spec.ts`**
- Boot, force a zone's provider to a calm dino, drive gathers with `__stepWorld`, assert `__cairns()` count
  does not grow while `pileTotal` is under the floor and does once it clears it.
- Open the zone-map lens with a standing provider and assert the box text carries both governance glyphs.

### Risks

- **The regrowth hook is per-tick and per-zone.** `workPriorityFor` walks `providerFor`, which is a derived
  read; calling it inside the spawn loop for every zone every tick is 4 calls per tick — cheap, but if
  `providerFor` turns out to be expensive, hoist a `zoneWorks()` map outside the loop. Check before shipping.
- `GRANARY_AFTER_STRUCTURES` is read in more than one place (`buildOnGather` gate **and** `baseLandmarks`
  callers). Only the `buildOnGather` gate takes `granaryGateFor`; grep before editing so a second read site
  doesn't silently keep the old gate and produce a half-applied policy.
- Existing 454/463 e2e specs assert granary timing. A `'build'` provider shaving the gate could move a
  shipped assertion. **If a shipped spec's provider happens to be energetic, the correct fix is to pin the
  provider's temperament in the spec, not to weaken the policy** — the cycle-119/120 precedent (the
  production code generalized; the assertion encoded an outgrown assumption).

### Estimated touch count

~8 files.

---

## Lore track — BACKLOG-362

**Item:** A ground you come to miss — the departure clock and the first migration *pull*.

### Files to create

- `game/src/world/yearning.ts` — the pure read.
- `tests/unit/cycle-121-yearning.test.ts`
- `tests/e2e/cycle-121-yearning.spec.ts`

### `yearning.ts` — the module contract

```ts
/** dino → zoneId → the in-game day it last crossed *out* of that ground. */
export type LeftDays = Record<string, Record<string, number>>;

export const YEARN_DAYS = 3;          // days away before a ground starts calling
export const CURIOUS_YEARN_DAYS = 2;  // a curious dino (curiosity >= 0.5) misses a place sooner

export function markLeft(map: LeftDays, name: string, zone: string, day: number): void;
export function yearnThreshold(traits?: Personality): number;   // curiosity >= 0.5 ? CURIOUS : YEARN_DAYS
export function yearnedZone(                                     // the ground missed longest, or null
  map: LeftDays, name: string, home: string, day: number,
  reachable: readonly string[], threshold: number,
): string | null;
export function clearLeft(map: LeftDays, name: string, zone: string): void;  // arriving ends the yearning
export function yearnMemory(zoneName: string): string;   // `💭 haven't seen ${zoneName} in a while`
export function yearnLine(): string;                     // '💭'
export function yearnEvent(name: string, zoneName: string): string; // `💭 ${name} misses ${zoneName} — heads back`
export function yearnedFor(memories: readonly string[]): string | null; // book read, off the ring
export function yearnBookLine(zoneName: string): string; // `misses ${zoneName}`
```

`yearnedZone` iterates `reachable` **in input order** (`zoneNeighbors(home)` order, i.e. `ZONE_LINKS`
order), keeps the entry with the smallest recorded day (longest away) and a strict `<` for the tie, so the
first neighbour in chain order wins — the `richestNeighbor` / `unsettledNeighbor` precedent, and the
BACKLOG-456 rule against `Math.random()` in a migration decision. Skips `home` and any zone with no
recorded departure.

`yearnedFor` reads the live memory ring for the `💭 haven't seen ` prefix (the `taughtCount` / `foodwebStanding`
precedent: a standing is what a dino *remembers*, not a second persisted tally), returning the most recent
match so the book tracks the current longing.

### Files to modify

- `game/src/scenes/WorldScene.ts`:
  - Member `leftDays: LeftDays = {}` beside `seenZones` (line ~469); dev hooks
    `__leftDays = () => JSON.parse(JSON.stringify(this.leftDays))` and
    `__yearnDest = (name: string) => this.yearnDestOf(this.dinoByName(name))` beside `__seenZones` (~1093).
  - `crossDino` (~4756): after `setZone`, `markLeft(this.leftDays, d.name, home, day)` and
    `clearLeft(this.leftDays, d.name, dest)` — you have arrived, so you no longer miss it. Mirror both in
    the instant relocate path (~4879) beside its `markSeen`.
  - New `yearnDestOf(d): string | null` beside `plentyDestOf` — `yearnedZone(this.leftDays, d.name, home,
    getWorldClock().now().day, zoneNeighbors(home).map(l => l.to), yearnThreshold(d.traits))`.
  - New `seedYearning()` called from the same cadence as `seedPlentyWord` — for each dino with a
    `yearnDestOf`, file `yearnMemory(zoneName)` **deduped** against the ring exactly the way `seedPlentyWord`
    dedupes its plenty memory (`recall(...).some(e => e.includes(...))`).
  - `pickMigrant` (~4709): new tier **after** the `primed` (plenty) tier and **before** the
    `poorestResidents` fallback — `const yearning = candidates.filter(d => this.yearnDestOf(d))`.
  - `scarcityMigrate` (~4699): `const dest = primed ?? this.yearnDestOf(d) ?? this.scarcityDestOf(home)`.
    When the yearn destination wins, log `yearnEvent` and float `yearnLine()` over the dino via the existing
    `flashFeed` departure path (the `greenerGroundLine` precedent), and pass `reason: undefined` — a
    yearning move is not a scarcity move and must not fire 457's greener-ground beat.
  - `bookRows` (~2555): `yearn: (() => { const z = yearnedFor(recall(this.memory, d.name)); return z ? yearnBookLine(z) : undefined; })()`.
  - Save write (~5613) `leftDays: this.leftDays` and load (~5697) `this.leftDays = save.leftDays ?? {}`.
- `game/src/ui/lenses.ts` — `BookRow` gains optional `yearn?: string`; `bookLines` prints it right after
  `r.taught` (the two zone-standing lines sit together).
- `game/src/world/saveGame.ts` — `leftDays?: Record<string, Record<string, number>>` + a parse guard: object
  of objects of **finite numbers**. Closest existing guard is `seenZones` (object → nested check); the
  numeric leaf follows `harvestedByZone`'s non-negative-number check. Additive; **no `SAVE_VERSION` bump.**

### Reuse list

- `game/src/world/taught.ts` — `SeenZones` is the sibling record; `yearning.ts` deliberately keeps its own
  map rather than widening `SeenZones` into `{zone: {seen, leftDay}}`, which would touch 364's shipped
  parse guard and every 364 spec for no behavioural gain.
- `plentyDestOf` / `seedPlentyWord` / the `plentyTarget` tier in `pickMigrant` — the exact template for a
  memory-primed destination + a migrant tier. Copy the shape, including the neighbour-reachability check.
- `world/frontier.ts` + `world/greenerground.ts` — the memory/line/event quartet naming convention.
- `remember` / `recall` (`social/memory`), `flashFeed`, `logEvent`, `getWorldClock().now().day`,
  `zoneNeighbors`, `zoneById`, `zoneOf` — all already imported by WorldScene.
- `taughtCount`'s prefix-scan pattern for `yearnedFor`.

### New dependencies

none.

### Test plan

**Unit — `tests/unit/cycle-121-yearning.test.ts`**
- `yearnedZone` null for an empty map; null for a departure `< threshold` days ago; the zone at exactly
  `threshold` qualifies.
- Two qualifying grounds → the one left longest ago; equal days → first in `reachable` order; the same
  inputs give the same answer across 100 calls (determinism pin).
- `home` is never returned even when it has a stale departure record.
- A zone not in `reachable` is never returned.
- `yearnThreshold`: `curiosity 0.9 → 2`, `0.1 → 3`, `undefined → 3`; both thresholds eventually qualify.
- `markLeft` overwrites an earlier stamp for the same ground; `clearLeft` removes it and is a no-op for an
  unknown dino/zone.
- `yearnedFor` finds the memory, returns null for a ring with none, and returns the **most recent** when the
  ring holds two.
- `yearnMemory` / `yearnEvent` / `yearnBookLine` wording pins.
- `saveGame`: `leftDays` round-trips; absent parses `undefined`; a non-numeric leaf returns `null`.
- `bookLines` prints the `yearn` line when set and omits it when not.

**E2E — `tests/e2e/cycle-121-yearning.spec.ts`**
- Boot → `__startMigrationTo(name, dest)` + `__stepWorld` until the crossing lands → `__leftDays()` carries
  the source ground for that dino.
- Advance the clock past the threshold → `__yearnDest(name)` returns the source ground; `__memory()` carries
  the `💭` line exactly once after two world steps.
- `__maybeMigrate()` in a park with no grove-pull / homesick / plenty-primed dino picks the yearning dino,
  its destination is the missed ground (with a richer neighbour deliberately present), and `__events()`
  carries `misses`.
- Open the collection book and assert `misses <Zone Name>` renders.

### Risks

- **`pickMigrant` tier placement is load-bearing.** The cycle-076/078 grove-pull picks and the cycle-109/111
  appeal picks are pinned by shipped specs. The new tier must sit strictly below `primed` and strictly above
  `poorestResidents`. Verify by running those specs, not by reading them.
- **`seedYearning` fires on the migration cadence**, which is the same cadence BACKLOG-456's flakes live on.
  Keep it inside the `ambientPaused` guard the other cadence callbacks use, or the `__pauseAmbient` seam
  stops holding still and the catalogued flakes get a new sibling.
- **The 456 `cycle-076-news-pull` spec** drives ~40 `__stepWorld` calls and asserts an exact migrant
  identity. If any of its dinos crosses and then idles past the threshold, the new tier could take the pick.
  It sits below the plenty tier but *above* the scarcity fallback, and that spec's assert lands on a
  homesick pick — expected safe, but it is the single most likely spec to move. Check it explicitly.
- A dino that has never left anywhere yearns for nothing: a fresh save must produce zero `💭` memories.
  Assert it, so the beat can't become ambient noise on day one.

### Estimated touch count

~6 files (3 new, 3 modified). **Combined cycle: ~13 files** — within the CHARTER v6 arc size.
