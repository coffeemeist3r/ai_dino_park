# Cycle 158 — Code Plan

**Build order (cross-track collision):** structure track first, then lore track. Both edit
`game/src/scenes/WorldScene.ts` and `game/src/ui/controlsHelp.ts`; only the lore track edits
`game/src/world/saveGame.ts`.

---

## Structure track — BACKLOG-545: Once per sitting

### Item

The session record as a gate: `firstThisSession(key)` plus a spent-key set, with the parting glance
(BACKLOG-119) converted to fire once a **visit** and to measure its floor against the visit.

### Files to create

- `tests/unit/cycle-158-session-gate.test.ts`
- `tests/e2e/cycle-158-once-per-visit.spec.ts`

### Files to modify

- `game/src/world/session.ts`
  - **add** `export type SpentKeys = readonly string[]` — a plain string list, not a `Set`; every
    other session-shaped record in this file is a plain value the caller owns.
  - **add** `firstThisSession(spent: SpentKeys, key: string): boolean` → `!spent.includes(key)`.
  - **add** `spendKey(spent: SpentKeys, key: string): string[]` → returns `[...spent]` unchanged when
    the key is already there (idempotent by value, the `closeSession` discipline in this same file),
    else `[...spent, key]`.
  - Header note: why the spent set is **the visit's**, not the sitting's, and why it is not persisted.
- `game/src/scenes/WorldScene.ts`
  - **import** `firstThisSession, spendKey` from `../world/session` (extend the existing 542 import
    at line 54 — do not add a second import line from the same module).
  - **add field** `private visitStartedAt = Date.now();` beside `sessionStartedAt` (~line 719), with
    the doc comment naming the distinction: the sitting is a focus period and is re-stamped; the
    visit is this page load and is not.
  - **add field** `private spentThisVisit: string[] = [];` — transient, never in `currentSaveData`.
  - **add constant** near the other scene-local keys: `const GLANCE_KEY = 'glance';` (module scope,
    beside `GLANCE_MS`'s import site) so the string is written once.
  - **`onDeparture` (~line 3868)** — two changes, both one line:
    - `partingGlance(this.friendship, present, Date.now() - this.sessionStartedAt)` becomes
      `... Date.now() - this.visitStartedAt`.
    - guard at the top of the function, after the `stage !== 'leaving'` return:
      `if (!firstThisSession(this.spentThisVisit, GLANCE_KEY)) return;`
      and, immediately after the `if (!p) return;` line (so a null glance does **not** burn the key —
      a park with no friendship yet must still get its goodbye once it earns one):
      `this.spentThisVisit = spendKey(this.spentThisVisit, GLANCE_KEY);`
  - **`setupGovernor` (~line 6359)** — `__ageSession` winds both clocks:
    `(window as any).__ageSession = (ms: number) => { this.visitStartedAt = Date.now() - ms; return (this.sessionStartedAt = Date.now() - ms); };`
    (return value preserved — the 541 hook's shape is already read by specs.)
  - **add dev hook** beside `__sessions`: `(window as any).__spentThisVisit = () => [...this.spentThisVisit];`
  - **do not touch** `closeSitting`, `shouldStamp`, `applyDeparture`'s re-stamp of `sessionStartedAt`,
    or `currentSaveData`.

### Reuse list

- `game/src/world/session.ts` — the predicates go **in** it, not in a new module. It already owns the
  sitting and already carries `closeSession`'s idempotent-by-identity discipline; a second
  session-shaped module would be the BACKLOG-483 defect.
- `game/src/world/departure.ts` `SESSION_MIN_MS` — imported by `parting.ts` already; nothing restates it.
- `game/src/world/parting.ts` `partingGlance` — unchanged. The whole conversion is what the scene
  passes it and whether it calls it.
- `tests/e2e/helpers.ts` `boot` / `foundingState`, and the `__marks`/`glancers` reading pattern in
  `cycle-155-glance.spec.ts` — copy that spec's helpers rather than inventing a second reader.

### New dependencies

none.

### Test plan

**Unit — `tests/unit/cycle-158-session-gate.test.ts`**
- `firstThisSession([], 'glance')` is true; `firstThisSession(['glance'], 'glance')` is false.
- `spendKey([], 'glance')` is `['glance']`.
- `spendKey(['glance'], 'glance')` is `['glance']` — spending twice adds nothing.
- `spendKey` does not mutate its input (the caller's array is untouched).
- Two different keys coexist: `spendKey(spendKey([], 'a'), 'b')` is `['a','b']` and both read spent.

**E2E — `tests/e2e/cycle-158-once-per-visit.spec.ts`**
- *the goodbye happens once a visit* — befriend, `__ageSession(60_000)`, blur → glance; wait out
  `GLANCE_MS`; focus; `__ageSession(60_000)` again; blur → **no** glance.
- *the fidgety keeper gets a goodbye* — the additive case. Befriend, `__ageSession(60_000)` to age the
  visit, then wind **only the sitting** forward to a few seconds old
  (`page.evaluate(() => (window as any).__ageSession)` cannot do this, so the spec sets
  `__ageSession(60_000)` and then fires `focus` to re-stamp the sitting — a real return, which is
  exactly the player action being modelled — and blurs immediately). Under the old rule the
  seconds-old sitting earned nothing; now the sixty-second visit earns the goodbye.
- *a blur before the visit floor is still silence* — no `__ageSession`, blur, no glance.
- *the spent set reads empty at boot and holds `glance` after the goodbye*.
- *a reload is a new visit* — `page.reload()`, re-boot, spent set empty, and the goodbye is available
  again.

**Regression, run unmodified:** `tests/e2e/cycle-155-glance.spec.ts` (all seven, especially *the
second sitting has to earn its own goodbye*, which the new gate must satisfy by a different route)
and `tests/e2e/cycle-156-sitting.spec.ts` (all five).

### Risks

- **The order of the guard and the spend is the whole item.** Spending the key before
  `partingGlance` returns would mean a park with no friendship burns its one goodbye on a blur that
  showed nothing, and would redden `a park you have never spoken to does not wave you off` on the
  *second* blur of a befriended park. Spend only after `p` is non-null.
- `__ageSession` now winds two fields. The cycle-155 spec *the second sitting has to earn its own
  goodbye* calls it once, before the first blur; after the change it still passes, but for the new
  reason (key spent) rather than the old one (sitting too young). That is intentional and is called
  out here so QA does not read it as an accident.
- `visitStartedAt` is a field initialiser, so it stamps at scene construction, not at `create()`.
  That is the same place `sessionStartedAt` stamps today; nothing new.

### Estimated touch count

`~4 files`.

---

## Lore track — BACKLOG-067: Keeper-loaded hatch

### Item

A loaded feed the keeper cycles with `,` / `.`, shown in the HUD, dropped by `H`; a `random handful`
slot at the front keeps the as-shipped behavior as the default.

### Files to create

- `tests/unit/cycle-158-loaded-feed.test.ts`
- `tests/e2e/cycle-158-loaded-feed.spec.ts`

### Files to modify

- `game/src/world/foods.ts`
  - **add** `export const FEED_AUTO = 'auto';` and
    `export const FEED_AUTO_LABEL = 'random handful';`
  - **add** `export function feedChoices(): ReadonlyArray<{ id: string; label: string }>` →
    `[{ id: FEED_AUTO, label: FEED_AUTO_LABEL }, ...FOODS.map(f => ({ id: f.id, label: `${f.emoji} ${f.label}` }))]`.
    Derived from `FOODS`, never a second list — a hand-copied roster is the 483 defect and this one
    would silently drop the next crop food.
  - **add** `export function cycleFeed(index: number, dir: number, len = feedChoices().length): number`
    → `(index + dir + len) % len`. Same arithmetic `cycleItem` does inline; extracted here because
    this one needs a unit test and the gift one already has an e2e.
  - **add** `export function feedChoiceIndex(id: string | undefined): number` → the index of `id` in
    `feedChoices()`, or `0` (auto) when absent or unknown. This is the save-restore read, and the
    "unknown" branch is what makes a save written against a future food list load clean.
  - `FOODS` itself is **not** touched.
- `game/src/ui/controlsHelp.ts`
  - **add** `export function feedLine(label: string): string` → `` `Feed: ${label}` ``. Beside
    `holdingLine`, same shape, keys omitted for the same reason.
  - **add** to `HELP_ROWS`, directly after the `[ ]` row: `{ keys: ', .', action: 'switch loaded feed' }`.
- `game/src/scenes/WorldScene.ts`
  - **import** `FEED_AUTO, feedChoices, cycleFeed, feedChoiceIndex` from `../world/foods` (extend the
    existing `FOODS` import); **import** `feedLine` from `../ui/controlsHelp` (extend line 332).
  - **add field** `private loadedFeedIndex = 0;` beside `heldItemIndex` (~line 556).
  - **`dropFood` (~line 2395)** — one expression changes. The `kind` resolution becomes: explicit
    `foodId` wins (unchanged); otherwise the loaded feed if it is not `FEED_AUTO`; otherwise the
    existing random roll. Write it as a small private `feedKind(foodId?: string): Food` so the
    branch is readable and the random path is visibly still live.
  - **`setupGifts` (~line 8962)** — bind `KeyCodes.PERIOD` → `cycleFeedBy(1)` and `KeyCodes.COMMA` →
    `cycleFeedBy(-1)`, in the same `kb` block as `[`/`]`. Add dev hooks `__loadedFeed()` (returns the
    id) and `__cycleFeed(dir)` (cycles and returns the id) — the `__heldItem`/`__cycleItem` pair,
    mirrored.
  - **add** `private cycleFeedBy(dir: number): void` → `this.loadedFeedIndex = cycleFeed(this.loadedFeedIndex, dir); this.refreshGiftHud(); void this.saveGame();`
  - **`refreshGiftHud` (~line 8988)** — `setText([holdingLine(...), feedLine(feedChoices()[this.loadedFeedIndex].label)].join('\n'))`.
    `holdingLine` itself stays byte-identical; one text object, two lines, so `layoutGiftHud` needs
    no change (origin `(0,1)` grows upward on desktop, `(0,0)` downward on touch).
  - **`currentSaveData` (~line 8545)** — add `loadedFood: feedChoices()[this.loadedFeedIndex].id,`
    beside `sessions`, with an `// additive` note.
  - **restore (~line 8614)** — `this.loadedFeedIndex = feedChoiceIndex(save.loadedFood);` beside the
    `this.sessions = save.sessions ?? []` line, then `this.refreshGiftHud()` at the existing HUD
    refresh point (the restore already repaints the HUD — verify; if it does not, call it once here).
- `game/src/world/saveGame.ts`
  - **add** `loadedFood?: string;` to the save interface beside `sessions?` (~line 132).
  - **add** the parse guard beside the `visitHours` one (~line 904):
    `if (o.loadedFood !== undefined && typeof o.loadedFood !== 'string') return null;` and thread
    `loadedFood` into the returned object (~line 945). Absent → `undefined` → `feedChoiceIndex`
    answers `0`. An *unknown* string is accepted by the parser and normalised to auto by
    `feedChoiceIndex` — the parser's job is shape, not vocabulary.

### Reuse list

- `game/src/world/foods.ts` `FOODS` — the single roster; `feedChoices` derives from it.
- `game/src/ui/controlsHelp.ts` `holdingLine` / `HELP_ROWS` / `helpLines` — the HUD line shape and
  the help panel already exist and already pad themselves.
- `WorldScene.cycleItem` / `refreshGiftHud` / `layoutGiftHud` / `giftHud` — the selector pattern in
  full. **Do not add a second HUD text object**; grow the one that is there.
- `dropFood`'s existing `foodId` parameter — the override path is already built and already used by
  the plot harvest and `__dropFood`. Nothing about it changes.
- `__heldItem` / `__cycleItem` — the dev-hook shape to mirror.

### New dependencies

none.

### Test plan

**Unit — `tests/unit/cycle-158-loaded-feed.test.ts`**
- `feedChoices()[0].id` is `FEED_AUTO` and its label is `random handful`.
- `feedChoices()` has `FOODS.length + 1` entries and its tail ids equal `FOODS.map(f => f.id)` in
  order — pins the derivation, so a new crop food joins the selector for free.
- Every non-auto label contains that food's emoji.
- `cycleFeed` wraps both ways: from `0` with `-1` to the last index; from the last with `+1` to `0`.
- `feedChoiceIndex('meat')` finds meat; `feedChoiceIndex(undefined)` and `feedChoiceIndex('kelp')`
  are both `0`.
- `feedLine('🍖 hunk of meat')` is `Feed: 🍖 hunk of meat` and mentions no keys.
- `helpLines()` contains a row for `, .` and every line stays under 40 characters (extend the
  existing `controlsHelp.test.ts` assertion rather than duplicating it — the row count assertions
  there are derived from `HELP_ROWS`, so they absorb the new row without edits; confirm, don't assume).

**E2E — `tests/e2e/cycle-158-loaded-feed.spec.ts`**
- *the hatch says what it is loaded with* — boot, founding state, `__loadedFeed()` is `auto`.
- *the keeper loads a food and that food comes out* — `__cycleFeed` until `meat`, press `H`
  (real key, so the binding is exercised), then `__food().foodId` is `meat`.
- *`,` steps back and wraps* — from `auto`, `__cycleFeed(-1)` lands on the last food in `FOODS`.
- *random handful still rolls* — with `auto` loaded, drop and assert the food in play is one of
  `FOODS` (the as-shipped path is alive, not bypassed).
- *the harvest still drops its own crop* — call `__dropFood(col, 'roots')` with `meat` loaded and
  assert `roots` lands: the explicit argument outranks the selector.
- *the loaded feed reaches the save and comes back* — set `fish`, `__saveNow()`, assert
  `loadedFood === 'fish'`, `page.reload()`, re-boot, `__loadedFeed()` is `fish`.
- *the held gift is untouched* — `__heldItem()` before and after a feed cycle is unchanged.
- *aiming a meal* — set a dino's favorite food as the loaded feed via `__favoriteFood`-style read if
  one exists (grep first; if none, read the favorite through the existing scan/`__dinoScan` hook),
  drop it, and assert that dino reaches the food first. **If no existing hook exposes a dino's
  favorite, do not invent one** — assert the criterion at unit level against `reactionToFood` and
  disclose the gap in the codeplan's Shipped section rather than manufacturing evidence (the
  cycle-157 discipline).

### Risks

- **The `[?]` panel's 40-character budget.** `, .` padded against `WASD / arrows` (13 chars) plus
  `switch loaded feed` (18) is 33 — fits, but `helpLines` pads to the widest key string, so check
  the assertion rather than the arithmetic.
- **`refreshGiftHud` is called before `loadedFeedIndex` exists?** No — field initialisers run before
  `create()`. But `setupGifts` calls `refreshGiftHud()` during setup and the save restore happens on
  a different path; make sure the restore repaints, or the HUD shows `random handful` over a save
  loaded with `fish` until the next keypress. This is the one ordering bug this track can ship.
- **`void this.saveGame()` on every feed cycle** mirrors nothing — `cycleItem` does *not* save, and
  the held item is not persisted today. Saving on the feed cycle is deliberate (the criterion asks
  for persistence) but it means a keypress writes to IndexedDB; that is the same cost as a departure
  stamp and is fine at this frequency. Noted so it is a decision and not a leak.
- `,` and `.` are unbound today — grep `KeyCodes.COMMA` and `KeyCodes.PERIOD` across the scene before
  binding, and check `touch.ts` does not map them.

### Estimated touch count

`~6 files`. Combined cycle: **~10 files**, inside the CHARTER v6 arc budget.
