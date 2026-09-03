# Cycle 149 — Code Plan

Order of work: **structure track first** (both tracks append to `REACHABILITY_REGISTER`, and 121's entry
reads 523's `FOUNDING_HOUR`).

---

## Structure track — BACKLOG-523

**Item:** The hour a save opens on.

**Files to create:** `tests/unit/cycle-149-founding-hour.test.ts`

**Files to modify**
- `game/src/world/clock.ts` — add `export const FOUNDING_HOUR = 8` immediately beside `ACTIVE_SCALE` /
  `AWAY_SCALE` under one shared note; `WorldClock._time` initialises `hour: FOUNDING_HOUR`.
- `game/src/world/reachability.ts` — import `FOUNDING_HOUR`, `chronotypeOf`, `atRest`; add
  `export function castSplitAt(hour: number): boolean` (walks `foundingResidents()`, derives traits via
  `seededPersonality`, returns true only when at least one resident is `atRest` and at least one is not);
  append the `BACKLOG-523` register entry whose `holds` is `() => castSplitAt(FOUNDING_HOUR)`.

**Reuse list (MUST use, do not reinvent)**
- `game/src/world/founding.ts` → `foundingResidents()` — who wakes on which ground. Do not read `ROSTER`.
- `game/src/world/chronotype.ts` → `chronotypeOf`, `atRest` — rule 1 of the register header: go through the
  production function that owns the fact.
- `game/src/ai/personality.ts` → `seededPersonality(name)` — the same name-seeded derivation `Dino` uses.
- `game/src/world/reachability.ts` → the existing `ReachabilityEntry` shape and `darkEntries()` walk.
- The existing `tests/unit` reachability spec stays untouched; the new claim gets its own file.

**New dependencies:** none.

**Test plan**
- Unit `tests/unit/cycle-149-founding-hour.test.ts`:
  - a fresh `WorldClock` reports `{ day: 1, hour: FOUNDING_HOUR, minute: 0 }` — no literal on either side.
  - `castSplitAt(FOUNDING_HOUR)` is `true` on the shipping roster.
  - there exists an hour at which `castSplitAt` is `false` **because everybody is up**, and one at which it
    is `false` **because everybody is down** — found by scanning 0..23 rather than by naming hours, so the
    test cannot go stale against a season or `OWL_SHIFT` change.
  - the register contains an entry whose `id` includes `BACKLOG-523`, and `darkEntries()` is empty.
- E2E: none. This track's whole claim is a unit-checkable invariant; the observable half is that the park
  opens exactly as it did, which every existing boot spec already asserts.

**Risks**
- `reachability.ts` currently has no `personality` import; adding one must not drag Phaser in (it does not —
  `personality.ts` is pure).
- The scan-for-a-dark-hour test will fail if some season leaves the cast never split at any hour. If that
  turns out to be true for a season, the test scans **spring** (the founding season) and says so.

**Estimated touch count:** ~3 files.

---

## Lore track — BACKLOG-121

**Item:** Keeper-shaped routine — the vigil at the hatch.

**Files to create**
- `game/src/world/vigil.ts` — the pure module.
- `game/src/world/vigil.test.ts` — co-located unit tests (the `world/*.test.ts` house pattern).
- `tests/unit/cycle-149-vigil-reach.test.ts` — the two reachability reads (Glade at the founding hour, Rex at
  night) asserted through production functions.
- `tests/e2e/cycle-149-vigil.spec.ts` — the live beat.

**Files to modify**
- `game/src/world/saveGame.ts` — additive `visitHours?: number[]` on the save interface; parse/validate it
  beside `savedAt` (array of finite numbers or reject); serialise it. **No version bump** — additive-optional
  is exactly what the v0→v1 step note describes.
- `game/src/world/reachability.ts` — append the `BACKLOG-121` entry after 523's, reusing `castSplitAt`'s
  neighbours: `foundingResidents()[BOWL_ID]` filtered by `atRest(FOUNDING_HOUR, …)` must be non-empty.
- `game/src/scenes/WorldScene.ts` — fields `vigil: Vigil | null`, `lastVigilMs`, `visitHours`; `vigilMarks`
  array built alongside `rouseMarks` via the existing `makeHourMark`; `checkVigil()` / `stepVigil()` called
  from the same world-step site as `checkMend()` / `stepMend()`; `refreshVigilMarks()` called from
  `refreshRouseMarks`'s neighbourhood with the precedence rule (a vigil keeper shows 👀 and **not** 👁);
  boot records the visit into `visitHours`; `saveGame()` writes the field; a `__stepVigil` dev hook mirroring
  `__stepMend` so a spec can drive the errand deterministically.

**Reuse list (MUST use, do not reinvent)**
- `game/src/world/mending.ts` + `checkMend`/`stepMend` in `WorldScene` — the errand pattern: dispatch under a
  `cooldownReady` gate, walk with `stepToward`, resolve on chebyshev ≤ 1, cancel free on budget exhaustion or
  the dino leaving the ground. Copy the *shape*, including the `__stepMend`-style hook.
- `game/src/world/clock.ts` → `cooldownReady(now, last, ms)` — the 333 wall-clock gate. Do not write another.
- `game/src/world/movement.ts` → `stepToward`; `WorldScene.chebyTiles`, `tileOf`, `dinoByName`, `inView`.
- `game/src/world/hatch.ts` → `HATCH_TILE`. Do not re-derive the tile.
- `game/src/world/chronotype.ts` → `atRest` via the scene's existing `isResting(d)`. **No `chronotypeOf`
  comparison against `'owl'` anywhere in this track** — that is the design's whole point.
- `game/src/social/friendship.ts` → `heartsFromPoints`, and `homecoming.ts` as the register model for warmth
  graded by hearts. `vigilLine` mirrors `spokenLine`'s shape; it does **not** import from `homecoming.ts`.
- `WorldScene.showBubble`, `flashFeed`, `logEvent`, `remember(this.memory, …)` — all four already exist.
- `chronotype.ts`'s `DOZE_ART_KEY`/`ROUSE_ART_KEY` convention for the new `VIGIL_ART_KEY = 'vigil'` +
  `VIGIL_GLYPH = '👀'`, declared in `vigil.ts` and added to `worldPlacedProps()` so BACKLOG-526 has a host
  the day it is drawn.

**New dependencies:** none.

**Test plan**
- Unit `game/src/world/vigil.test.ts` — every acceptance bullet on the pure module: the history cap and
  newest-kept ordering; `habitualHour` on empty / single / modal / tie inputs; `hoursApart` wrap; the
  anticipation window in and out; `vigilKeeper` on fondest / all-zero / empty.
- Unit `tests/unit/cycle-149-vigil-reach.test.ts` — the founding-hour read resolves to `Glade` and the
  night read to `Rex`, both computed from `foundingResidents()` + `atRest` + `vigilKeeper` with an empty
  friendship book; `darkEntries()` empty; the register carries a `BACKLOG-121` entry.
- Unit — extend the existing save round-trip spec: `visitHours` survives a round trip, an absent field loads
  as `[]`, a malformed one is rejected. (Find the existing `saveGame` spec and add cases; do not create a
  parallel save spec.)
- E2E `tests/e2e/cycle-149-vigil.spec.ts` — boot a fresh save, drive the errand via `__stepVigil`, assert one
  dino ends within a tile of the hatch carrying the vigil mark and that an event line was logged; then, with
  a save whose `visitHours` say the keeper comes at a far hour, assert no vigil is dispatched.

**Risks**
- **The step site.** `checkVigil`/`stepVigil` must sit *below* the sleeping/crossing/fleeing/stalking
  branches in the movement precedence ladder (see the `4851–4870` comment block). Putting a social errand
  above a hunt or a migration is a mistake this file has already made once and documented.
- **Two errands, one dino.** `checkVigil` must skip a dino that is `this.mend?.fixer` (and vice-versa is not
  needed — the mend has priority as the older, ground-owned errand).
- **The founding visit is the fragile half.** Seeding the history at boot must happen *before* the first
  `checkVigil`, must be idempotent across reloads (a save with a history is never re-seeded), and must never
  write an hour literal.
- **Save shape.** Additive only. Confirm an old fixture save (no `visitHours`) still loads — there are
  existing fixtures in the save spec to reuse.
- **Mark stacking.** 👀 shares the 💤/👁 slot. Precedence must be asserted, not assumed: a resting dino never
  keeps a vigil (so 💤 and 👀 cannot collide), but an owl at night *can*, so `refreshRouseMarks` must hide 👁
  for the vigil keeper.

**Estimated touch count:** ~9 files across both tracks — inside the arc-sized envelope, no split needed.
