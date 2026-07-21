# Cycle 107 — Code Plan

Two tracks, one shared hook (`crossDino`). Build the structure track first (its `+1` sits inside the
existing 447 carry block), then the lore track's homecoming block below it.

---

## Structure track — BACKLOG-448 (The provider role)

**Item:** BACKLOG-448 — per-dino food-bank tally → durable `provider` role.

**Files to create:**
- `tests/unit/cycle-107-provider.test.ts`
- `tests/e2e/cycle-107-provider.spec.ts`

**Files to modify:**
- `game/src/ai/roles.ts` — `Role` gains `'provider'`; `ROLE_ICON.provider = '🧺'`; `BehaviorStats.foodBanked?: number` (**optional** so every existing call site + `roles.test.ts` compiles unchanged); `export const PROVIDER_BANKS = 3`; `deriveRole` checks `(s.foodBanked ?? 0) >= PROVIDER_BANKS` **first**, before gossip.
- `game/src/world/foodstore.ts` — `haulMemory(zoneName)` ("you put the harvest away in <zone>'s stores") and `haulLine(name, zoneName)` (the 🧺 ticker line). Nothing else; the pick itself is `pickNearest` (below).
- `game/src/world/movement.ts` — `pickNearest(entries: { name: string; dist: number }[]): string | null` — smallest `dist`, ties broken by name, `null` on empty. Shared by both tracks (hauler pick + welcoming resident pick); movement already owns tile/step math.
- `game/src/world/saveGame.ts` — add `foodBanked?: Record<string, number>` (validate exactly like `gathered`) **and fix the 446 gap**: `foodPileByZone` is declared on `SaveData` but never validated or returned by `deserialize`, so banked food silently resets on every reload. Add its validation block (zone→foodId→number, mirroring `stockpileByZone`) and both new keys to the returned object. See Risks.
- `game/src/scenes/WorldScene.ts` —
  - field `private foodBanked: Record<string, number> = {}` (persisted; absent → {}),
  - `private creditFoodBank(name: string)` — `+1`, used by both sources,
  - `crossDino`: inside the existing 447 `if (foodCarry)` block, credit the carrier (before the 451 pride lines),
  - `harvest(zone)`: after `bankFood`, if the pile actually grew (compare totals / `foodAtCap` before), pick the nearest resident of that zone via `pickNearest` over `dinos` filtered by `zoneOf(...) === zone`, credit it, `flashFeed(hauler, '🧺')`, `logEvent(haulLine(...))`, `remember(... haulMemory(zoneName))`,
  - `roleOf`: pass `foodBanked: this.foodBanked[name] ?? 0` into `deriveRole`,
  - save (`toSave`) + restore blocks: `foodBanked`,
  - dev hook `__foodBanked = () => ({ ...this.foodBanked })`.

**Reuse list (no new modules):**
- `ai/roles.ts` `deriveRole`/`settleRole`/`ROLE_ICON` — the role spine (020/032); durability comes free.
- `world/foodstore.ts` `bankFood` / `foodAtCap` / `FOOD_STOCKPILE_CAP` — the 446 pantry.
- `WorldScene.roleOf` — the single settle+cache point the lens, book, scan and `__roles` all read.
- `WorldScene.flashFeed` / `logEvent` / `remember` — the existing beat/ticker/memory channels.
- `world/zones.ts` `zoneOf`, `zoneById` — residency + display name.
- Save validation shape of `gathered` (numbers) and `stockpileByZone` (nested) — copy, don't invent.

**New dependencies:** none.

**Test plan:**
- Unit `tests/unit/cycle-107-provider.test.ts`: `deriveRole` returns `provider` at exactly 3 banks and not at 2; provider wins over stats that would otherwise read gossip/homebody/socialite; `foodBanked` absent → the four legacy roles are byte-identical; `settleRole('provider', 'wanderer') === 'provider'`; `ROLE_ICON.provider` present; `pickNearest` (closest, name tie-break, null on empty); `haulLine`/`haulMemory` name the zone.
- Unit `tests/unit/saveGame.test.ts` (extend): a save carrying `foodBanked` + `foodPileByZone` round-trips both; a save without either loads clean.
- E2E `tests/e2e/cycle-107-provider.spec.ts`: (1) plant+ripen+harvest the bowl plot → the nearest bowl resident is credited, a 🧺 line names it, `__foodBanked()` shows 1; (2) three credited banks → `__roles()` reads `provider` for that dino and `__bookText()` contains `[provider]`; (3) a crossing with no surplus credits nobody.

**Risks:**
- **Deliberate scope creep (pre-approved here):** the `foodPileByZone` persistence fix. It's one validation block in the file this track already edits, it's the milestone's own spine (a pantry that empties on reload makes 446/447/448 meaningless across sessions), and leaving it while adding a *new* field to the same list would be knowingly shipping the same bug twice. Flagged to the Validator.
- Adding a `Role` union member: `ROLE_ICON` is `Record<Role, string>` so the compiler forces the icon; `lenses.ts`/`scan.ts` take `Role` structurally and need no change. Verify with `npm run build`.
- `harvest()` currently banks unconditionally; credit **only** when a unit truly banked (at-cap harvests bank nothing).
- Cross-track: `crossDino` — this track's line goes inside the 447 block, the lore track's homecoming block goes after it.

**Estimated touch count:** ~8 files.

---

## Lore track — BACKLOG-452 (Homecoming from the road)

**Item:** BACKLOG-452 — a migrant that crosses back into the zone it settled in comes home.

**Files to create:**
- `tests/unit/cycle-107-homecoming.test.ts`
- `tests/e2e/cycle-107-homecoming.spec.ts`

**Files to modify:**
- `game/src/world/belonging.ts` (the 341 module — it already owns tenure/settled/home semantics, so no new module) —
  - `export type Roots = Record<string, string>` (name → zone id it last settled in),
  - `rootOf(roots, name): string | undefined`,
  - `rememberRoot(roots, name, zone): Roots` (pure, returns a new map),
  - `isHomecoming(roots, name, from, to): boolean` — `to === rootOf(...) && from !== to`,
  - `homecomingLine()` → `'🏡'` (the bubble), `homecomingEvent(name, zoneName)` → the ticker line,
  - `homecomingMemory(zoneName)` → `you came back to <zone> — back where you belong`,
  - `welcomeMemory(returner, zoneName)` → `you welcomed <name> back to <zone>`, `welcomeEvent(resident, returner)` → the 👋 ticker line,
  - `export const WELCOME_BOND = 2` (gentler than `SHARED_MEAL_BOND` 3 — a nod, not a meal).
- `game/src/world/saveGame.ts` — `roots?: Record<string, string>`, validated exactly like `dinoZones`, added to the returned object.
- `game/src/scenes/WorldScene.ts` —
  - field `private roots: Roots = {}` (persisted; absent → {}),
  - `bumpTenures()`: after the bump, any dino now `isSettled` records `rememberRoot(this.roots, name, itsZone)` (idempotent — re-recording the same zone is a no-op write),
  - `crossDino`: after the structure track's carry block, `if (isHomecoming(this.roots, d.name, home, dest))` → `this.tenure = { ...this.tenure, [d.name]: SETTLE_ROLLS }` (**resettle**, overriding the reset above), 🏡 bubble via `showBubble`, `remember(homecomingMemory)`, `logEvent(homecomingEvent)`, then the welcome: `pickNearest` over other dinos homed in `dest` → `flashFeed(resident, '👋')`, `remember(resident, welcomeMemory(...))`, `logEvent(welcomeEvent(...))`, `strengthen(this.bonds, resident, d.name, WELCOME_BOND)`,
  - save + restore blocks: `roots`,
  - dev hooks `__roots = () => ({ ...this.roots })`.

**Reuse list (no new modules):**
- `world/belonging.ts` — `SETTLE_ROLLS` / `isSettled` / `tenureOf`; the root *is* the settle threshold, not a new notion of home.
- `WorldScene.showBubble` / `flashFeed` / `logEvent` / `remember` / `strengthen` — every channel this beat needs already exists (the 339 grove-arrival block right below is the exact shape to copy).
- `world/movement.ts` `pickNearest` (added by the structure track) — the welcoming resident is the same "closest, ties by name" pick as the hauler.
- `world/zones.ts` `zoneOf` / `zoneById`.

**New dependencies:** none.

**Test plan:**
- Unit `tests/unit/cycle-107-homecoming.test.ts`: `rememberRoot`/`rootOf` purity; `isHomecoming` true only for `to === root && from !== to`; false with no root, false when the destination isn't the root, false on a same-zone no-op; the memory/ticker lines name the zone and the dino.
- Unit `tests/unit/saveGame.test.ts` (extend): `roots` round-trips; absent → `{}`.
- E2E `tests/e2e/cycle-107-homecoming.spec.ts`: settle Rex in the bowl (`__settleTick` × `SETTLE_ROLLS`), `__startMigrationTo('Rex','grove')` + step to arrival, then `__startMigrationTo('Rex','bowl')` + step → 🏡 ticker + memory, `__settled('Rex') === true` immediately, a bowl resident's 👋 welcome line + memory + a bond above its pre-crossing value. Second spec: a dino that never settled crosses twice and fires no 🏡.

**Risks:**
- `crossDino` resets tenure for every crossing (341/334 specs pin that). The resettle must *follow* that reset and apply only on a homecoming — write it as an override, don't move the existing line.
- `bumpTenures` runs on the migration cadence for every non-migrating dino; recording a root there is O(dinos) per roll, negligible, but keep it allocation-light (only write when the root actually changes).
- The welcome fires between two dinos in a zone the keeper may not be viewing; use the same non-visual-dependent path the 447 carry uses (memory + ticker always, `flashFeed` is safe off-zone).
- Cross-track: shared `crossDino` (ordering above) and shared `saveGame.ts` returned-object list (both tracks add a key — one edit, two keys).

**Estimated touch count:** ~7 files (4 shared with the structure track).

---

## Shipped

**Files touched (12):**
- `game/src/ai/roles.ts` — `provider` role, 🧺 icon, optional `foodBanked` stat, `PROVIDER_BANKS = 3`, checked first in `deriveRole`.
- `game/src/world/movement.ts` — `pickNearest` (closest, ties by name, null on empty).
- `game/src/world/foodstore.ts` — `haulLine` / `haulMemory`.
- `game/src/world/belonging.ts` — `Roots`, `rootOf`, `rememberRoot`, `isHomecoming`, `homecomingLine/Event/Memory`, `welcomeMemory/Event`, `WELCOME_BOND = 2`.
- `game/src/world/saveGame.ts` — `roots` + `foodBanked` validated & returned; **`foodPileByZone` gap fixed** (declared but never validated/returned since 446 → banked food reset every reload).
- `game/src/scenes/WorldScene.ts` — `foodBanked` + `roots` fields, `creditFoodBank`, `creditHauler`, harvest credit (guarded on a real bank), courier credit inside the 447 block, the homecoming block in `crossDino`, root recording in `bumpTenures`, `roleOf` reads the tally, save + restore, hooks `__foodBanked` / `__roots` / `__setRoot`.
- Tests: `tests/unit/cycle-107-provider.test.ts`, `tests/unit/cycle-107-homecoming.test.ts` (new), `tests/e2e/cycle-107-provider.spec.ts`, `tests/e2e/cycle-107-homecoming.spec.ts` (new), `tests/unit/saveGame.test.ts` + `tests/unit/cycle-061-save-version.test.ts` (extended — the two sample payloads gain `roots`/`foodBanked`).

**Deviations from the plan:** one, as pre-approved: the `foodPileByZone` persistence fix (planned scope creep,
flagged to the Validator). Also added a `__setRoot` dev hook alongside `__roots` — seeding a root directly keeps
future specs off a four-tick settle preamble. No other deviation; no new dependencies.

**Build + unit status:** `npm --prefix game run build` clean (`tsc -b` + vite). `npx vitest run` **1238/1238**
green (136 files, +21 tests over cycle 106's 1217). The two new e2e specs pass (5/5) — the full suite runs at QA.
The page renders: every e2e boot drives the real dev server through `create()` to `__ready`.
