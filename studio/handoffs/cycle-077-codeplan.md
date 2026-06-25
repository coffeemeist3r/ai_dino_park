# Cycle 77 — Code Plan (two tracks)

## Lore track — BACKLOG-346 Pond-swappers

**Item:** Two grove-visited dinos who meet swap pond notes — a small shared-place bond + a memory each.

**Files to create:** none.

**Files to modify:**
- `game/src/world/groveword.ts` — add `POND_BOND` const, `pondSwapMemory(other)`, `pondSwap(visited, a, b)` (pure; no Phaser/AI import).
- `game/src/scenes/WorldScene.ts`
  - new private `pondSwapBeat(a, b)` — `if (!pondSwap(this.groveVisited, a, b)) return false;` then file `pondSwapMemory(b)` on `a` and `pondSwapMemory(a)` on `b` via `remember`, `this.bonds = strengthen(this.bonds, a, b, POND_BOND)`, `this.logEvent('🌿 <a> and <b> compared notes on the grove')`, return true.
  - call `this.pondSwapBeat(a.name, b.name)` in `converse`, **after** the sympathy/grateful else-if block (additive, independent of the cold/grove cascade — fires whenever both have visited).
  - dev hook `(window as any).__pondSwap = (a, b) => this.pondSwapBeat(a, b);` beside `__spreadGroveWord`.
  - import `pondSwap`, `pondSwapMemory`, `POND_BOND` from `../world/groveword`.

**Reuse list:** `remember`/`recall` (`ai/memory`), `strengthen`/`bondPoints` (`social/bonds`, already imported), the `converse` seam + `groveVisited` set + `logEvent`. The whole beat is the stargazing-companions shape (`knitStargazers`, BACKLOG-288) on the meet seam — no new primitive.

**New dependencies:** none.

**Test plan:**
- Unit (`tests/unit/groveword.test.ts`, extend): `pondSwap` true iff both visited & distinct (false for one/neither/self); `pondSwapMemory('Twitch')` contains `Twitch` and **does NOT** contain `GROVE_NEWS_TOKEN` (so it can't re-spread); `POND_BOND` is a positive int `≤ SHARED_WONDER_BOND`.
- E2E (`tests/e2e/cycle-077-pond-swap.spec.ts`): cross Rex and Mossback each into the grove (the `crossOnce` helper) so both are grove-visited; `__pondSwap('Rex','Mossback')` → true, both carry `traded pond stories with <other>`, `__bond('Rex','Mossback')` rose; `__pondSwap('Rex','Sunny')` (Sunny never crossed) → false, no memory, bond flat. Zero console errors.

**Risks:** The swap memory must stay clear of `GROVE_NEWS_TOKEN` or a swap would make a dino re-spread grove news — pinned by unit test. The beat fires every qualifying meet (no cooldown); bonds saturate at 100, harmless — out of scope to gate.

**Estimated touch count:** ~3 files (groveword.ts, WorldScene.ts, +1 unit/+1 e2e). 

## Structure track — BACKLOG-329 Carry between zones

**Item:** A dino completing a visible crossing ferries one banked resource from the zone it leaves to the zone it enters.

**Files to create:** none.

**Files to modify:**
- `game/src/world/resource.ts` — add two pure helpers:
  - `pickCarry(src, dest)`: the `ResourceKind` to ferry = the most-stocked kind in `src` that `dest` can still accept (`(src[k]??0)>0 && !atCap(dest,k)`), sorted by `src` count desc (stable → ties resolve in `RESOURCE_GLYPH` order: branch before stone); `null` if none.
  - `takeResource(pile, kind)`: pile minus one of `kind`, floored at 0 (pure, returns new map).
- `game/src/scenes/WorldScene.ts`
  - in `crossDino`, after the crossing `logEvent` and before the `firstGroveArrival` block: compute `const carry = pickCarry(this.pileFor(home), this.pileFor(dest));` and when non-null, `this.stockpileByZone[home] = takeResource(this.pileFor(home), carry);` `this.stockpileByZone[dest] = bankResource(this.pileFor(dest), carry);` `this.logEvent('<glyph> <name> carried a <kind> to <destZoneName>')`. (`home`/`dest` already bound at the top of `crossDino`.)
  - import `pickCarry`, `takeResource` from `../world/resource` (extend the existing import block; `bankResource`/`atCap`/`RESOURCE_GLYPH`/`pileFor`/`zoneById` all already in scope).

**Reuse list:** `pileFor` (328), `bankResource`/`atCap` (285/309, already imported), `RESOURCE_GLYPH`, `zoneById`. Carry adds to `dest` via the existing `bankResource` (cap-clamped, but `pickCarry` already excluded capped kinds so it always lands).

**New dependencies:** none.

**Test plan:**
- Unit (`tests/unit/cycle-077-carry.test.ts`, new): `pickCarry` picks the most-stocked acceptable kind; `null` for an empty src; `null` when dest is at cap for every kind src offers; `takeResource` decrements and floors at 0; **conservation** — `takeResource(src,k)` total + `bankResource(dest,k)` total = original two-pile total.
- E2E (`tests/e2e/cycle-077-carry.spec.ts`): bank a branch in the bowl pile, `crossOnce('Rex')` (bowl→grove); assert bowl `branch` 0 and grove `branch` 1 (conserved); a second crosser out of an empty bowl pile carries nothing. Zero console errors.

**Risks:** Carry must ride **only** `crossDino` (the visible walk), never the instant `__migrate`/`relocate` — those are untouched, so every cycle-068/069/071 migration & zone spec stays green. `pickCarry`'s sort must be deterministic (stable sort over `RESOURCE_GLYPH` order) for a reproducible e2e.

**Estimated touch count:** ~4 files (resource.ts, WorldScene.ts, +1 unit/+1 e2e).

## Cross-track collision check

Both tracks edit `WorldScene.ts` but in **different methods** — lore in `converse` (+ a new `pondSwapBeat`), structure in `crossDino` — and different import lines (`groveword` vs `resource`). No region overlap; build either order. No shared test files (separate new spec files; groveword unit extended by lore only). No save-format change either track.

---

## Shipped (Coder)

**Files touched:**
- `game/src/world/groveword.ts` — `POND_BOND=3`, `pondSwapMemory(other)`, `pondSwap(visited,a,b)` (346).
- `game/src/world/resource.ts` — `pickCarry(src,dest)`, `takeResource(pile,kind)` (329).
- `game/src/scenes/WorldScene.ts` — import both; carry transfer in `crossDino` (home→dest pile, log); `pondSwapBeat(a,b)` private + call in `converse` after the sympathy/grateful block; `__pondSwap` hook.
- `tests/unit/groveword.test.ts` — +5 pond-swap tests; `tests/unit/cycle-077-carry.test.ts` — +7 carry tests.
- `tests/e2e/cycle-077-pond-swap.spec.ts`, `tests/e2e/cycle-077-carry.spec.ts` — new.

**Deviations:** none. Carry adds to dest via the existing `bankResource` (pickCarry already excludes capped kinds). No save change either track, no deps, NPCBrain boundary intact.

**Build + tests:** `npm run build` clean (type-check passes). `npm run test:unit` → 787 passed (+12). Dev server renders (HTTP 200). Both new e2e specs green warm (cold-server first run hit the documented `__ready` boot flake; green on warm re-run). phase → qa-pending.
