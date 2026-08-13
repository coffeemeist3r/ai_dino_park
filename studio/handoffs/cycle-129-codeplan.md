# Cycle 129 — Code Plan

Two pure functions, two thin scene gates, two dev hooks, two unit specs, two e2e specs. Sequence:
structure track first (it touches a read that several hooks call), then the lore track.

---

## Structure track — BACKLOG-481 (the council decides the work priority)

### Prior art to reuse (do not restate)

| What | Where |
|---|---|
| Who sits on a ground's council | `game/src/ai/roles.ts` → `zoneCouncil(candidates, zoneId)` (479) |
| The roster the seating reads | `WorldScene.zoneCandidates()` — one builder, already shared by `providerFor` / `zoneCouncils` |
| How a dino votes | `game/src/world/governance.ts` → `providerWorkPriority(traits)` (473) — the energy read, unchanged |
| The words for a call | `WORK_CALL.options[].meaning` (477) — the legend table, so ticker and legend can't drift |
| The once-per-step tail | `WorldScene.forceStep()` end, beside `checkProviderHandover()` (467) |

### Files

**1. `game/src/world/governance.ts`** — add below `providerWorkPriority`:

```ts
export function councilWorkPriority(
  votes: readonly WorkPriority[],
  tieBreak: WorkPriority | null,
): WorkPriority | null
```
- `votes.length === 0` → `null` (the compatibility seam — no council, no council decision).
- count `build` vs `gather`; strict majority wins.
- exact tie → `tieBreak ?? votes[0]`. Never `null` once there is at least one vote.
- Header comment: why the work call and not the spend call; why the tie falls to the provider and then to
  seat 1 (most-banked first, `zoneCouncil`'s own order); that this is BACKLOG-031.

Also add a small helper used by the ticker so the words come off the table, not a literal:

```ts
export function workCallMeaning(p: WorkPriority): string   // WORK_CALL.options.find(...)!.meaning
```

**2. `game/src/scenes/WorldScene.ts`**

- `councilFor(zone: string): string[]` — `zoneCouncil(this.zoneCandidates(), zone)`. One roster build per
  call (the constraint: `workPriorityFor` runs on the regrowth tick).
- `workPriorityFor(zone)` becomes:
  1. `const council = this.councilFor(zone)`
  2. if `council.length`: `votes = council.map(n => providerWorkPriority(this.dinoByName(n)?.traits))`,
     `tieBreak` = the provider's own vote when there is a provider, else `null`;
     `const p = councilWorkPriority(votes, tieBreak)`; if `p` → store in `workPriorityByZone[zone]`, return.
  3. else: today's body, verbatim (standing provider → its call; else the lingering stored call; else `null`).
- New field `private lastWorkCallByZone: Record<string, WorkPriority> = {}` — **not persisted** (a live read
  of a live situation, the `shortsByZone` precedent). On load it is `{}`, so the first council beat after a
  reload can fire once; acceptable and noted in the verdict.
- `private checkCouncilCall(): void` — the once-per-step tail beat:
  ```
  for each zone: if councilFor(zone).length === 0 → continue
                 const p = workPriorityFor(zone); if (!p) continue
                 if (this.lastWorkCallByZone[z] === p) continue
                 const first = this.lastWorkCallByZone[z] === undefined
                 this.lastWorkCallByZone[z] = p
                 if (!first) log `🗳️ the ${zoneName}'s council calls it: ${workCallMeaning(p)}`
  ```
  **The `first` guard matters:** without it every park logs a vote beat on its first council step, which is
  not a *change*. The beat is for turnover, and the first seating is not turnover.
  Called from `forceStep`'s tail, immediately after `checkProviderHandover()`.
- Dev hook beside `__councils`:
  ```ts
  (window as any).__councilVotes = (zone: string) => { seats, votes, tieBreak, call }
  ```
- Fix the stale comment on `checkProviderHandover`'s `workPriorityFor` argument (it says "the incoming
  provider sets *both* calls" — now it reports the council's call).

**3. `game/src/world/governance.test.ts`** — extend (colocated; vitest includes `game/src/**`):
- empty votes → `null` for both a supplied and a null tie-break
- single seat → that seat's vote
- `['build','build','gather']` → `'build'`; `['gather','gather','build']` → `'gather'`
- `['build','gather']` + `'gather'` → `'gather'`; + `null` → `'build'` (= `votes[0]`)
- `workCallMeaning('gather')` is exactly `WORK_CALL.options[0].meaning` (pin: the ticker reads the table)

**4. `tests/e2e/cycle-129-council-vote.spec.ts`**
- boot; assert `__councils()` empty for every zone and `__workPriority(bowl)` unchanged on a fresh park
  (the inert claim).
- `__creditBank(name, n)` + `__setTrait(name, 'energy', v)` to seat a 3-dino council whose majority
  disagrees with the top banker; assert `__councilVotes(bowl).call` is the majority and `__workPriority(bowl)`
  agrees with it.
- flip one member's energy, step, assert the ticker carries `council calls it` exactly once and does not
  repeat on a second step.
- zero console errors (the standing convention).

---

## Lore track — BACKLOG-389 (the berth)

### Prior art to reuse

| What | Where |
|---|---|
| The per-opponent disposition | `game/src/world/pecking.ts` → `dispositionToward` / `peckingScore` (401) |
| The live memory ring | `recall(this.memory, name)` (already imported in `WorldScene`) |
| The rush read | `feeding.ts` → `reactionToFood` — **unchanged**, the berth is a gate around it |
| Tile distance | `WorldScene.chebyTiles` / the `Math.hypot` the food branch already computes |
| A one-off flash + ticker | `flashFeed(d, glyph)` + `logEvent(...)` |

### Files

**1. `game/src/world/pecking.ts`** — add:

```ts
export function givesBerthTo(memories: readonly string[], nearer: readonly string[]): string | null
```
- map `nearer` → `{ name, score: peckingScore(m, n), disp: dispositionToward(m, n) }`
- keep only `disp === 'wary'` (filtered through the disposition, never the raw score — the `peckingLine`
  discipline, and the reason a one-off loss produces no berth)
- sort by `score` ascending (most negative = most feared), then `name.localeCompare` for the tie
- return the first name or `null`
- Header comment: the feet, not the tile; why no memory is filed (the ring is the source the disposition
  is parsed from).

**2. `game/src/scenes/WorldScene.ts`** — in `stepDinos`' food branch, inside `if (this.food && this.foodLanded)`,
*before* the `reactionToFood` check:

```ts
const nearer = this.dinos
  .filter(o => o.name !== d.name && this.inView(o) &&
               Math.hypot(this.tileOf(o).tileX - this.food!.tileX, this.tileOf(o).tileY - this.food!.tileY) < dist)
  .map(o => o.name);
const feared = nearer.length ? givesBerthTo(recall(this.memory, d.name), nearer) : null;
if (feared) {
  if (!this.berthedThisDrop.has(d.name)) {
    this.berthedThisDrop.add(d.name);
    this.lastBerth = { name: d.name, rival: feared };
    this.flashFeed(d, '👀');
    this.logEvent(`👀 ${d.name} hung back — ${feared} got to the food first`);
  }
} else if (reactionToFood(...) === 'rush') { ...unchanged... }
```
- `private berthedThisDrop = new Set<string>()` and `private lastBerth: {name,rival}|null = null`, both
  cleared where a drop is created (`dropFood`, beside `this.foodLanded = false`) and where a drop is
  consumed (`eatFood`, beside `this.food = null`). Not persisted.
- Dev hook `(window as any).__berth = () => this.lastBerth ? {...this.lastBerth} : null;` beside `__standFood`.
- Note: a berthing dino simply falls through to its normal behaviour (wander / tic / huddle), so `continue`
  is **not** used — the branch does nothing but log, and control drops to the rest of the step. That is the
  whole point: it goes on with its life.

**3. `game/src/world/pecking.test.ts`** — extend, one case per acceptance bullet (empty memories, wary hit,
wary miss when the rival isn't nearer, confident → null, two-feared ordering, exact-tie lexicographic,
disposition-null filtered).

**4. `tests/e2e/cycle-129-berth.spec.ts`**
- boot, take two names; `__remember` the 394 slink-off string twice so A is `wary` of B (the pattern
  cycle-128's spec established); assert `__disposition(A,B) === 'wary'`.
- `__placeDino` (or the existing placement hook the 375/387 specs use) to put B nearer the drop than A,
  `__dropFood()`, step; assert `__berth()` is `{name: A, rival: B}` and A's tile did not move toward the
  food, while B's did.
- assert the ticker line appears exactly once across two steps.
- a control: a dino with no history rushes (nothing in `__berth()`).
- zero console errors.

---

## Test plan (both tracks)

1. `npm run build`
2. `npx vitest run` (root config — both roots)
3. `npx --yes kill-port 5173` then `npx playwright test`
4. `grep -rn "@mlc-ai/web-llm" game/src --include=*.ts` → hits only under `game/src/ai/`

## Risks

- **The berth and the escort (381).** A wary dino that hangs back can be read as "missing the meal" by
  `startEscort` and be walked to the food by a friend. Left in by design (Designer's call); watch for an
  e2e whose loner assertion now has a second stranded candidate.
- **The vote beat firing from a read.** `workPriorityFor` is called from the regrowth tick, the granary
  gate, the landmark defer and the lens. All logging lives in `checkCouncilCall`, once per step.
- **First-seating noise.** Guarded by the `first` check; without it a fresh park logs a "council calls it"
  the first time anyone banks a unit.
- **Existing e2e that seat councils** (`cycle-127-council.spec.ts`) may now also change a work priority.
  It asserts seats, not calls, so it should be untouched — verify rather than assume.

## Blockers

None.
