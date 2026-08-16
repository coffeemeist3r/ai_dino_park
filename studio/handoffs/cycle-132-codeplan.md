# Cycle 132 — Code plan

Prior art read before planning: `world/tic.ts` (405/410/414 — two onset shorteners already compose by
`Math.min`), `WorldScene.resolveContest` (387/390/394 — both loser sites in one function), `world/standings.ts`
(482), `ai/roles.ts:zoneCouncil` (479), `WorldScene.councilFor` / `zoneCouncils` / `workPriorityFor` /
`checkCouncilCall` (481), `WorldScene.checkSpoilage` + `checkUpkeep` (455/480 — the live-only day-boundary
discipline), `world/saveGame.ts` (`pioneers` / `seenZones` / `workPriorityByZone` guard shapes).

**Reuse, not re-implementation, in both tracks.** 412 adds a constant + a predicate + a builder to the module
that already owns the other two shorteners; it does not add a module. 484 adds a module for the *term* but
calls `zoneCouncil` through the existing `standings()` fold for the derivation itself — 482's one-derivation
promise is the thing being protected.

---

## Lore track — BACKLOG-412

### `game/src/world/tic.ts` (extend — no new module)

- `export const TIC_AFTER_STEPS_STUNG = 6` — below `TIC_AFTER_STEPS_HOMESICK` (12) and
  `TIC_AFTER_STEPS` (20). A fresh wound reads faster than unfamiliar ground.
- `export const STING_FADES_AFTER_STEPS = 24` — the window, in the dino's own wander steps.
- `export function stingIsFresh(stepsSince: number): boolean` — `stepsSince >= 0 && stepsSince < STING_FADES_AFTER_STEPS`.
- `export function soothingTicMemory(label: string): string` — the distinct memory; names the ritual and
  says why, e.g. `` `it went badly at the hatch — you ${label} until it stopped smarting` ``.

### `game/src/world/tic.test.ts` (extend)

- Stung threshold ordering: `0 < TIC_AFTER_STEPS_STUNG < TIC_AFTER_STEPS_HOMESICK < TIC_AFTER_STEPS`.
- `stingIsFresh` at 0, at the boundary−1, at the boundary (false), past it (false).
- `soothingTicMemory` names the label and differs from `ticMemory` for the same label.
- Composition: `Math.min(ticAfterFor(intent, TIC_AFTER_STEPS), TIC_AFTER_STEPS_HOMESICK, TIC_AFTER_STEPS_STUNG)`
  is the stung constant for every intent — no shortener can outrank a fresh sting.
- `inventsTic(TIC_AFTER_STEPS_STUNG, TIC_AFTER_STEPS_STUNG)` true; one below, false.

### `game/src/scenes/WorldScene.ts`

- Field: `private stungAt: Record<string, number> = {}` — dino → the wander-step count at which it was
  stung. Not persisted (the `berthedThisDrop` / `lastWorkCallByZone` precedent).
- Field: `private stepTicks = 0` — a monotonic wander-step counter, incremented once per `forceStep`
  ambient pass. (Check first for an existing counter; reuse if one is already there.)
- Field: `private soothedFiled = new Set<string>()` — the once-per-sting memory guard, cleared when a
  dino is stung afresh.
- `resolveContest`, hold branch: after `slunkOffMemory` is filed, `this.sting(gobblerName)`.
- `resolveContest`, cede branch: after the gobbler eats, `this.sting(eater.name)` — the ceding winner is
  the one left with nothing.
- `private sting(name: string)`: records `stungAt[name] = this.stepTicks`, deletes `soothedFiled` entry.
- `private stungNow(name: string)`: `stingIsFresh(this.stepTicks - (this.stungAt[name] ?? -Infinity))`.
- Onset site (the `ticAfter` block ~line 3840): `if (this.stungNow(d.name)) ticAfter = Math.min(ticAfter, TIC_AFTER_STEPS_STUNG);`
  — one more `Math.min`, added *after* the homesick line so all three compose.
- In the `ticcing` branch, on the step the anchor is first set: if `stungNow` and not in `soothedFiled`,
  file `soothingTicMemory(tic.label)` instead of nothing new, and add to `soothedFiled`. The plain 405
  `ticMemory` path is untouched for unstung dinos.
- Dev hook: `(window as any).__sting = (name?: string) => ...` — with a name, stings that dino (so the e2e
  need not stage a full standoff twice); with none, returns `{ [name]: stepsSince | null }` for every dino.

### `tests/e2e/cycle-132-soothing.spec.ts` (new)

1. **Inert without a sting** — boot, an unstung dino left alone does not tic before `TIC_AFTER_STEPS`.
2. **The production sting** — drive a real contested drop through the existing `__contest` path (the 401
   hook that runs `resolveContest` itself), assert the loser reads stung on `__sting()`.
3. **The shortened onset** — step that loser alone past `TIC_AFTER_STEPS_STUNG` but short of the normal
   threshold; assert `__tic(name).invented` is true and `__memory(name)` contains the self-soothing note.
4. **The window closes** — a dino stung and then left long enough reads unstung again.
5. Zero console errors on every spec.

---

## Structure track — BACKLOG-484

### `game/src/world/term.ts` (new, pure)

```ts
export interface Seating { seats: Record<string, string[]>; day: number }
export function heldSeats(s: Seating | null, zone: string): string[] | null
export type TermChange = { zone: string; kind: 'first' | 'turnover'; seated: string[]; before: string[] }
export function reseat(held: Seating | null, fresh: Record<string, string[]>, day: number): { seating: Seating; changes: TermChange[] }
export function sameSeats(a: readonly string[], b: readonly string[]): boolean  // set equality, order-insensitive
export function turnoverLine(zoneName: string, seated: readonly string[]): string
```

- `heldSeats` returns `null` (not `[]`) for a zone with no held entry — `null` is "read live", `[]` is
  "held, and seats nobody". The whole fallthrough hinges on that distinction.
- `reseat` emits `kind: 'first'` when the prior held entry was absent, `'turnover'` when it existed and the
  **set** differs, and nothing when the set matches (regardless of order). The new seating always stores the
  fresh **order** — a re-order without a membership change updates the held order silently, which is what
  keeps 481's `votes[0]` tie-break honest without inventing a beat.
- `turnoverLine` reuses 🗳️ (no new glyph).

### `game/src/world/term.test.ts` (new)

Set-equality vs. order; first-seating vs. turnover vs. no-change; a zone dropping to zero seats is a
turnover; the day is carried; `heldSeats` null-vs-empty; the line names the ground.

### `game/src/world/saveGame.ts`

- Interface: `councilSeats?: Record<string, string[]>` (the `seenZones` guard shape verbatim) and
  `councilTermDay?: number` (non-negative finite; the `crossings` numeric guard shape).
- Both added to the parse block and the returned object. Additive; absent → read live.

### `game/src/scenes/WorldScene.ts`

- Fields: `private councilSeats: Record<string, string[]> | null = null;` and `private councilTermDay = 0;`
- `councilFor(zone)`: `heldSeats(this.seating(), zone) ?? councilOf(this.standings(), zone)`.
- `zoneCouncils()`: same fallthrough per zone, one `standings()` derivation only if any zone falls through.
- `private seating(): Seating | null` — `this.councilSeats ? { seats: this.councilSeats, day: this.councilTermDay } : null`.
- `private checkTerm(t: GameTime)`: `if (t.day <= this.councilTermDay) return;` then `runTerm(t.day)`.
  Registered as its own `clock.onHour` listener beside `checkSpoilage` / `checkUpkeep` (live-only, so a
  restore or away-jump fires nothing). Armed on boot/restore exactly as `lastSpoilDay` is (two sites: the
  boot arm ~6059 and the restore arm ~6102), so a jump never fires a spurious term.
- `private runTerm(day: number)`: derive fresh seats from `standings()` for every zone, `reseat(...)`, store,
  log one `turnoverLine` per `'turnover'` change (never for `'first'`), persist once if anything changed.
- Save write: `councilSeats: this.councilSeats ?? undefined`, `councilTermDay: this.councilTermDay`.
- Restore: `this.councilSeats = save.councilSeats ?? null; this.councilTermDay = save.councilTermDay ?? 0;`
- Dev hooks: `__seating = () => ({ seats: this.councilSeats, day: this.councilTermDay })` and
  `__forceTerm = () => this.runTerm(getWorldClock().now().day)` (drives the term without waiting a day).
- `__councils` keeps its current signature; its comment gains the term note.

### `tests/e2e/cycle-132-term.spec.ts` (new)

1. **A fresh park is unchanged** — no held seating, `__councils()` equals the live derivation, `__seating()`
   reads `{ seats: null }`.
2. **The seats hold** — seat a council (the `seatThree` shape from `cycle-129-council-vote.spec.ts`),
   `__forceTerm()`, then bank a fourth dino past a seat and step; assert `__councils()` has **not** moved and
   `__councilVotes(zone).seats` still names the held three.
3. **The term moves them** — `__forceTerm()` again; assert the seats now include the newcomer and the ticker
   carries exactly one 🗳️ turnover line for that ground.
4. **First seating is silent** — the first `__forceTerm()` on a freshly-seated ground logs no turnover line.
5. **Round-trip** — save/reload, assert `__seating()` survives and the seats did not silently re-derive.
6. Zero console errors on every spec.

---

## Risk register

1. **The `null` vs `[]` fallthrough** (structure). If `heldSeats` returns `[]` for an absent zone, every
   ground on a fresh save reads "seats nobody" *permanently* until its first term, and 481 goes inert for a
   day. Pinned by unit and by e2e spec 1.
2. **Frozen ties** (structure). Holding membership without order would let `votes[0]` flip mid-term. The
   seating stores the fresh order on every reseat, including the no-beat re-order case.
3. **Spurious terms on restore** (structure). `onHour` never fires on `clock.set`, but `councilTermDay` must
   still be armed at both the boot and restore sites or the first live hour after a jump fires a term against
   a day it never saw. Same two-site arm as `lastSpoilDay`.
4. **Growing 483's debt** (lore). The sting is taken from the event at both `resolveContest` sites. No memory
   string is parsed. Grep the diff for `recall(` in the tic path before committing.
5. **Threshold inversion** (lore). If `TIC_AFTER_STEPS_STUNG` were ever raised above the homesick constant
   the `Math.min` silently ignores it. A unit spec asserts the ordering rather than the value.
6. **Suite load** (both). Two new e2e specs on a suite that ran 504/504 last cycle. BACKLOG-486 is queued for
   the general fix and is *not* in scope here; QA notes the run either way.

No file is touched by both tracks except `WorldScene.ts` (disjoint regions: the feeding/tic block vs. the
governance block) and `saveGame.ts` (structure only). ~10 files.

---

## Shipped (coder, 2026-08-16 03:40)

Both tracks landed as planned, 8 files:

- `game/src/world/tic.ts` — `TIC_AFTER_STEPS_STUNG` (6), `STING_FADES_AFTER_STEPS` (24), `stingIsFresh`,
  `soothingTicMemory`.
- `game/src/world/term.ts` (new) — `Seating`, `heldSeats`, `sameSeats`, `reseat`, `turnoverLine`.
- `game/src/world/term.test.ts` (new, 14) + `tests/unit/cycle-132-soothing-tic.test.ts` (new, 10).
- `game/src/world/saveGame.ts` — `councilSeats` + `councilTermDay`, both guarded, both additive.
- `game/src/scenes/WorldScene.ts` — `sting` / `stungNow` / the third `Math.min` / the soothing branch in
  `performTic`; `seating` / `checkTerm` / `runTerm` and the held-seating fallthrough in `councilFor` +
  `zoneCouncils`; the term armed at both the boot and restore sites; save + restore; hooks `__sting`,
  `__seating`, `__forceTerm`.
- `tests/e2e/cycle-132-soothing-tic.spec.ts` (new, 4) + `tests/e2e/cycle-132-term.spec.ts` (new, 4).

**Two departures from the plan, both discovered by a failing spec.**

1. **The `worldSteps` counter already existed**, so the planned `stepTicks` field was not added — the sting
   is timestamped against `this.worldSteps`, the same counter `leaveTrace` (424) stamps a pace trace with.
   One fewer field for the same behaviour.

2. **The lore e2e had to bond its subject.** The first draft isolated the stung dino by trait alone and both
   its specs failed nondeterministically — a dino with no bonds is a *loner* (135), and the mope roll
   (`MOPE_CHANCE`) outranks the tic in the wander branch, so the ritual formed a step or two late at random.
   Bonding the subject to a zone-mate fixes it and does a second job: it makes `strange` false, which takes
   410's homesick shortener out of the picture too, so the only thing shortening the onset in that spec is
   the sting. The control test is honest for the same reason — an unstung, bonded, non-strange dino carries
   the full 20.

**Risk register outcome.** (1) `null` vs `[]` held — the first term spec asserts a fresh park reads live and
seats live on banking. (2) Order is held: `reseat` always stores the fresh order, unit-pinned. (3) Both arm
sites done (`create` and `syncSeason`), and the reload spec asserts no term fires after a restore. (4) Zero
`recall(` in the tic path; the sting is taken from the event at both `resolveContest` sites — 483 not grown.
(5) Ordering asserted rather than the value. (6) Suite load: QA's call.

`npm run build` clean. `npx vitest run` 1777/1777 (was 1753; +24). The eight new e2e specs pass on their
own; the full run is QA's.
