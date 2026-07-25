# Cycle 111 — Code Plan (two tracks)

**Cross-track collision:** both tracks edit only `game/src/scenes/WorldScene.ts` (different methods — 455
adds a per-day spoilage hook + food dev-hooks; 459 adds a branch in `crossDino`). No shared lines. Build
**Structure track (455) first**, then Lore track (459), so the `crossDino` edit lands on a clean file.

---

## Structure track — BACKLOG-455 (A pantry that spoils)

### Item
Banked food at/near a zone's cap slowly decays across in-game days, self-limiting to a safe floor.

### Files to create
- `game/src/world/spoilage.ts` — pure module:
  - `export const SPOIL_MARGIN = 1;` — the calibration knob ("at/near cap" = within this of cap).
  - `export function spoilsAtCap(count: number, cap: number): boolean` → `count > 0 && count >= cap - SPOIL_MARGIN`.
  - `export function spoilFood(pile: FoodPile, cap: number = FOOD_STOCKPILE_CAP): FoodPile` — returns a new
    pile with one unit removed from each id where `spoilsAtCap`; returns the **same** object reference when
    nothing spoils (cheap no-op, twin of `bankFood`'s at-cap short-circuit). Imports `FoodPile` +
    `FOOD_STOCKPILE_CAP` from `./foodstore`.
  - `export function spoiledLine(zoneName: string, emoji: string): string` → `🥀 ${zoneName}'s ${emoji} spoiled`.
- `game/src/world/spoilage.test.ts` — unit tests (see Test plan).

### Files to modify
- `game/src/scenes/WorldScene.ts`:
  - Import `spoilFood, spoiledLine, SPOIL_MARGIN` from `../world/spoilage`.
  - Add field `private lastSpoilDay = 0;` (transient tracker, next to `lastSeasonDay`/`lastDawnDay`).
  - In `setupSeasons()`: after `this.lastSeasonDay = clock.now().day;` set `this.lastSpoilDay = clock.now().day;`
    and register `clock.onHour((t) => this.checkSpoilage(t));` (a third onHour listener, live-only).
  - In `syncSeason()` and the `__setClock` dev hook: set `this.lastSpoilDay = day;` so a restore/jump never
    triggers a spurious catch-up spoil (mirrors `lastSeasonDay`).
  - New method `private checkSpoilage(t: GameTime)`: return unless `t.day > this.lastSpoilDay`; set
    `this.lastSpoilDay = t.day;` then for each zone in `zoneChain()` compute `cap = granaryFoodCap(this.hasGranary(zone))`,
    `next = spoilFood(this.foodStoreFor(zone), cap)`; if `next !== pile`, diff the ids that dropped, log a
    `spoiledLine` per dropped id, assign `this.foodPileByZone[zone] = next`. `void this.saveGame()` once if
    anything changed. (Fires once per in-game day; a multi-day jump only spoils one pass — the away-catch-up
    day-count spoilage is BACKLOG-462, out of scope.)
  - Dev hooks (next to `__setZoneFoodPile`, ~line 918): `__foodStore(zone)` → `{ ...this.foodStoreFor(zone) }`;
    `__spoilFood()` → run one spoilage pass across all zones now (reuse `checkSpoilage` body via a private
    `runSpoilage()` both call) and return the zones' piles, so QA can assert decay deterministically without
    waiting on the clock.

### Reuse list
- `world/foodstore.ts`: `FoodPile`, `FOOD_STOCKPILE_CAP` (types + flat cap). MUST reuse — no new pile type.
- `world/granary.ts`: `granaryFoodCap(hasGranary)` — the granary-aware cap. MUST reuse (already imported).
- `world/zones.ts`: `zoneChain()`, `zoneById()` for the per-zone loop + names (already imported).
- `WorldScene.foodStoreFor` / `hasGranary` — existing accessors.
- The `onHour` day-boundary + `lastXDay` guard pattern from `checkSeasonTurn`/`checkDawnChorus`.

### New dependencies
none.

### Test plan
- Unit (`world/spoilage.test.ts`):
  - flat cap 6: `{berries:6}` → pass → `{berries:5}` → pass → `{berries:4}` → pass → still `{berries:4}` (floor cap-2).
  - below threshold: `{berries:4}` (cap 6) unchanged; `{berries:5}` (cap 6) → 4 then stops.
  - granary cap 9: `{berries:9}` → 8 → 7 → stops at 7.
  - purity: input object not mutated; returns same ref when nothing spoils; empty pile → empty.
  - multi-id: `{berries:6, greens:6, roots:3}` → berries 5, greens 5, roots unchanged.
- E2E (`tests/e2e/cycle-111-spoilage.spec.ts`):
  - seed a zone to cap via `__setZoneFoodPile`, call `__spoilFood()`, assert `__foodStore` reads one less
    and a `🥀 … spoiled` ticker line is in `__events`.
  - a below-floor pile (`{berries:4}`) is untouched by `__spoilFood()`.
  - `__setClock`/restore does not spoil (call it, assert pile unchanged, no 🥀 line).

### Risks
- The onHour listener must be **live-only** — confirm `clock.onHour` never fires on `clock.set()` (it
  doesn't; `checkDawnChorus` relies on the same). The `lastSpoilDay` reset in `syncSeason`/`__setClock`
  is the belt-and-suspenders guard.
- Don't spoil below the floor — the `count >= cap - SPOIL_MARGIN` guard already prevents a runaway; the
  floor test pins it.

### Estimated touch count
~4 files (2 new spoilage + 1 WorldScene + 1 new e2e).

---

## Lore track — BACKLOG-459 (Come for the plenty)

### Item
A scarcity migrant arriving in a richer, non-home zone gets a wry welcome + small bond from the nearest resident.

### Files to create
- `game/src/world/plentywelcome.ts` — pure module (mirror of `belonging.ts`'s welcome helpers):
  - `export const PLENTY_WELCOME_BOND = 2;` — small, same weight as `WELCOME_BOND`.
  - `export function plentyWelcomeLine(): string` → `'😏 Come for the plenty, have you?'` (wry; distinct
    from 452's `'🏡'` / "welcome home").
  - `export function plentyWelcomeEvent(resident: string, migrant: string): string` → `👋 ${resident} sized up ${migrant}, come for the plenty`.
  - `export function plentyWelcomeMemory(migrant: string, zoneName: string): string` → the resident's trace:
    `you gave ${migrant} a wry welcome to ${zoneName}` (no leading article — the storesFedLine trap).
  - `export function plentyWelcomedMemory(zoneName: string): string` → the migrant's trace:
    `${zoneName} sized you up when you came for the food`.
- `game/src/world/plentywelcome.test.ts` — unit tests (see Test plan).

### Files to modify
- `game/src/scenes/WorldScene.ts`:
  - Import `plentyWelcomeLine, plentyWelcomeEvent, plentyWelcomeMemory, plentyWelcomedMemory, PLENTY_WELCOME_BOND`
    from `../world/plentywelcome`.
  - In `crossDino`, inside the existing `if (cross?.reason === 'scarcity' && !homecoming)` block (the
    greener-ground beat), **after** the migrant's 🍃 memory/bubble/log, add the wry-welcome sub-beat:
    gather `residents` of `dest` excluding `d.name` with Cheby distances (copy the homecoming block's
    `residents`/`pickNearest` pattern), `const greeter = pickNearest(residents);` and `if (greeter)`:
    `this.bonds = strengthen(this.bonds, greeter, d.name, PLENTY_WELCOME_BOND);`
    `this.memory = remember(this.memory, greeter, plentyWelcomeMemory(d.name, zoneById(dest).name));`
    `this.memory = remember(this.memory, d.name, plentyWelcomedMemory(zoneById(dest).name));`
    `this.flashFeed(this.dinoByName(greeter)!, '😏');` (or `showBubble` — match homecoming's `flashFeed`)
    `this.logEvent(plentyWelcomeEvent(greeter, d.name));`
  - No new field, no save change (memory + bonds already persisted).

### Reuse list
- `social/bonds.ts`: `strengthen` (already imported). MUST reuse — no new bond math.
- `world/movement.ts`: `pickNearest` (already imported, used by the homecoming block).
- `ai/memory.ts`: `remember` (already imported).
- `WorldScene.chebyTiles`, `tileOf`, `dinoByName`, `flashFeed`, `logEvent` — all used by the adjacent
  homecoming block; copy that shape exactly.
- The `reason === 'scarcity' && !homecoming` guard already computed in `crossDino` — reuse, don't recompute.

### New dependencies
none.

### Test plan
- Unit (`world/plentywelcome.test.ts`):
  - `plentyWelcomeLine()` contains 😏 and is NOT the 🏡 homecoming string.
  - `plentyWelcomeMemory('Rex','The Grove')` contains 'Rex' + 'The Grove', no `the The Grove`.
  - `plentyWelcomedMemory('The Grove')` contains 'The Grove', no double article.
  - `PLENTY_WELCOME_BOND` is a small positive number.
- E2E (`tests/e2e/cycle-111-plentywelcome.spec.ts`, reuse cycle-109's `crossUntilArrived`/`migrate`/`__maybeMigrate`):
  - Rex alone in grove, everyone else in richer bowl → `__maybeMigrate()==='Rex'`, cross him back; assert a
    `sized up Rex` / wry welcome event is logged, a greeter↔Rex `__bond` rose vs. before, Rex carries the
    `sized you up` memory and the greeter the `wry welcome` memory.
  - Homecoming control: a dino returning to its settled root fires 🏡 welcome-home, NOT the 😏 wry welcome.
  - Non-scarcity control: `__startMigration('Twitch')` (plain) fires no wry-welcome event.
  - Empty-dest control: scarcity-cross into a zone with no other resident → no throw, no wry welcome, 🍃
    greener-ground beat still logged.

### Risks
- Ordering: the wry welcome must sit **inside** the `scarcity && !homecoming` guard so a homecoming never
  triggers both. The homecoming block runs earlier and sets `homecoming` truthy, short-circuiting this.
- `flashFeed` vs `showBubble`: the migrant already shows the 🍃 bubble this same beat; use `flashFeed` on
  the **greeter** (a different sprite) so the two bubbles don't collide — matches the homecoming welcome.

### Estimated touch count
~3 files (2 new plentywelcome + 1 WorldScene) + 1 new e2e = ~4.

**Combined estimated touch count: ~7 files. Well within the arc budget.**

---

## Shipped (Coder)

**Structure track (455) — built first:**
- Created `game/src/world/spoilage.ts` (`SPOIL_MARGIN`, `spoilsAtCap`, `spoilFood`, `spoiledLine`).
- Created `game/src/world/spoilage.test.ts` (8 cases: floor, granary floor, purity, multi-id, below-band).
- `WorldScene.ts`: import; `lastSpoilDay` field; armed in `setupSeasons` + reset in `syncSeason`; third
  `onHour` listener → `checkSpoilage`; new `runSpoilage()` (granary-aware cap per zone, 🥀 line per dropped
  id, one save if changed); `__spoilFood` dev hook. Reused existing `__zoneFoodPile` reader for QA.

**Lore track (459) — built second:**
- Created `game/src/world/plentywelcome.ts` (`PLENTY_WELCOME_BOND`, wry line, event, two memories).
- Created `game/src/world/plentywelcome.test.ts` (5 cases incl. distinct-from-452, no double article).
- `WorldScene.ts`: import; wry-welcome sub-beat inside `crossDino`'s existing `scarcity && !homecoming`
  guard — `pickNearest` greeter, `strengthen` bond, both-side memories, greeter `showBubble`, event line.

**Deviations:** greeter beat uses `showBubble` (readable wry line) rather than `flashFeed` (a squished
14px glyph) — the migrant already shows the 🍃 bubble on a different sprite, so no collision. No new
persisted field for either track (memory/bonds already persisted; `lastSpoilDay` transient like
`lastSeasonDay`).

**Status:** `npm run build` ✅ clean · `npm run test:unit` ✅ 1316/1316 · new e2e ✅ (spoilage 3/3,
plentywelcome 4/4, single-worker; the parallel-boot flake is the catalogued cold Vite/Phaser one) ·
dev server renders HTTP 200.
