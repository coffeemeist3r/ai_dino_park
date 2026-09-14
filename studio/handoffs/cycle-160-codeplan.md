# Cycle 160 — Code Plan

Two tracks, no shared file but `WorldScene.ts`, and no shared region inside it. Build the lore track
first (it is the larger diff and it touches the save), then the structure track.

---

## Lore track — BACKLOG-069 (menu in the book)

### Prior art to reuse (checked before planning anything new)

| Need | Already exists | Where |
|---|---|---|
| the favorite, season-aware | `favoriteFood(traits, season)` | `world/foods.ts:69` |
| the food roster + emoji + label | `FOODS` | `world/foods.ts:25` |
| an optional book field that renders one line | `BookRow.manner` / `bookLines` | `ui/lenses.ts:186,257` |
| an additive save key validated for shape only | `satchel` | `world/saveGame.ts:913` |
| the eat moment, with the food kind in hand | `eatFood` | `scenes/WorldScene.ts:2862` |
| the stores-feed moment | `feedFromStores` | `scenes/WorldScene.ts:4286` |
| the scan moment | `toggleScan` | `scenes/WorldScene.ts:8098` |

Nothing here needs a new concept. The only genuinely new thing is *the record*.

### New file — `game/src/world/menu.ts` (pure, Node-testable, no Phaser)

```ts
export type TastedRecord = Readonly<Record<string, readonly string[]>>;

/** Record that `name` has now eaten `foodId`. Idempotent; returns the same object when nothing changed. */
export function noteTaste(rec: TastedRecord, name: string, foodId: string): TastedRecord;

/** Has this dino eaten this food? */
export function hasTasted(rec: TastedRecord, name: string, foodId: string): boolean;

/** The book's menu line for one dino. `favorite` is the live favorite (season-aware), read by the caller. */
export function menuLine(tasted: readonly string[], favorite: Food): string;
```

`menuLine` builds `🍽 menu: ` + one cell per food in `FOODS` order (`f.emoji` if tasted, `MENU_BLANK`
`·` otherwise), then either `  loves <emoji> <label>` when `favorite.id` is in `tasted`, or
`  (favorite unknown)` when it is not. Exported constants `MENU_GLYPH = '🍽'` and `MENU_BLANK = '·'` so
the spec matches against the module rather than against a retyped string (the BACKLOG-483 rule, applied
at the moment the read is created).

`noteTaste` returns the *same object* when the pair is already recorded. That is not a micro-optimisation:
`feedFromStores` runs inside the needs tick and calls `saveGame()` on every feed, and a record that
reallocates on every no-op turns a cheap identity check into a save churn.

### `game/src/world/menu.test.ts`

- empty record → seven blanks + `(favorite unknown)`
- one non-favorite tasted → that emoji in its `FOODS` slot, the rest blank, still `(favorite unknown)`
- the favorite tasted → `loves 🌿 leafy greens` present
- `noteTaste` is idempotent and returns the identical object on a repeat
- `noteTaste` on a second dino leaves the first untouched
- the cell count equals `FOODS.length` (so a food added next cycle cannot silently shorten the line)

### `game/src/ui/lenses.ts`

- `BookRow.menu?: string` — optional, after `pecking`, with the same doc-comment discipline as its
  siblings.
- `bookLines`: `if (r.menu) out.push(\`  ${r.menu}\`);` placed **immediately after the heart-bar line**,
  before `quirk`. The design says under the hearts, and that is where a Pokedex puts the type line.

### `game/src/keeper/scan.ts`

No change. The scan's *output* stays byte-identical; the recording happens in the scene, at the moment
the panel is shown, because that is where the keeper identity and the record both live.

### `game/src/world/saveGame.ts`

- `SaveGame.tasted?: Record<string, string[]>` — doc-commented additive, absent restores an empty record.
- Validation beside `satchel` (same block, same discipline): object, not array, every value an array of
  strings; **unknown food ids kept**, unknown dino names kept. Shape only. Reject on wrong *shape*, never
  on unfamiliar *vocabulary*.
- Add `tasted` to the returned object literal.

### `game/src/scenes/WorldScene.ts`

1. Field: `private tasted: TastedRecord = {};`
2. `saveGame()` payload: `tasted: this.tasted,` beside `satchel`.
3. Load: `this.tasted = save.tasted ?? {};`
4. One private recorder, the single write path:
   ```ts
   /** BACKLOG-069: the one place a discovered food is written. Three callers; one record. */
   private noteMenu(name: string, foodId: string): void {
     const next = noteTaste(this.tasted, name, foodId);
     if (next === this.tasted) return;
     this.tasted = next;
     void this.saveGame();
   }
   ```
5. Call sites — exactly three:
   - `eatFood`: `this.noteMenu(d.name, kind!.id);` (the kind is already captured at the top; the
     existing code nulls `this.foodKind` immediately, so use the local).
   - `feedFromStores`: `this.noteMenu(d.name, id);` after the pile is spent.
   - `toggleScan`: after `scanLines` is set and the panel shown,
     `this.noteMenu(target.name, favoriteFood(target.traits, this.currentSeason()).id);`
6. `bookRows()`: `menu: menuLine(this.tasted[d.name] ?? [], favoriteFood(d.traits, this.currentSeason())),`
7. Dev hook beside `__bookRows`: `(window as any).__tasted = (name: string) => [...(this.tasted[name] ?? [])];`

**Deliberately not touched:** `refuseFood`. A refusal records nothing, which is the design's call, and
the way to honour it is to write no code there at all.

### `tests/e2e/cycle-160-menu.spec.ts`

1. Fresh boot: `__bookText()` contains `🍽 menu:` once per dino and every one of those lines ends
   `(favorite unknown)` with seven `·`.
2. `__dropFood(col, 'greens')` then `__eat('Rex')`: `__tasted('Rex')` is `['greens']`; Rex's book line
   carries `🌿`; Mossback's still reads seven `·`.
3. Feed a dino its own favorite (read it off `__favoriteFood(name)`, which already exists at
   `WorldScene.ts:2008`): its line gains `loves `.
4. Reload and re-read the book: the same line comes back (the save round-trip).
5. A refusal leaves the record empty — stage it the way `cycle-159-refusal.spec.ts` already does and
   assert `__tasted(name)` is `[]`.

---

## Structure track — BACKLOG-547 (long-press the feed button)

### `game/src/input/touch.ts`

```ts
/** How long a press must be held before it reads as a hold rather than a tap (BACKLOG-547). */
export const LONG_PRESS_MS = 400;

/** Has a press held down at `downAt` become a hold by `now`? */
export function isLongPress(downAt: number, now: number, ms = LONG_PRESS_MS): boolean {
  return now - downAt >= ms;
}
```

Pure, no Phaser, and the predicate exists so the threshold is one fact rather than a scene comparison
and a test comparison that can drift.

### `game/src/input/touch.test.ts` (new, or appended to the existing touch unit test if one exists)

- below / exactly at / above the threshold
- a custom `ms` overrides
- `LONG_PRESS_MS` is shorter than any dialog-open path would need — assert it is in `(150, 800)`, the
  band where a hold is deliberate but not a wait.

### `game/src/scenes/WorldScene.ts` — the touch block only

1. Field: `private feedPress: { at: number; timer: Phaser.Time.TimerEvent } | null = null;`
2. `dispatchTouchTap`, the `if (button)` arm: the feed button no longer resolves here.
   ```ts
   if (button) {
     if (button.id === 'feed') this.beginFeedPress();
     else this.onTouchButton(button.id);
     return;
   }
   ```
3. Two small methods beside `onTouchButton`:
   ```ts
   /** BACKLOG-547: hold the feed button to step the loaded feed; a tap still drops. */
   private beginFeedPress(): void {
     this.cancelFeedPress();
     const timer = this.time.delayedCall(LONG_PRESS_MS, () => {
       this.feedPress = null;   // consumed: the release must not also drop
       this.cycleFeedBy(1);
     });
     this.feedPress = { at: this.time.now, timer };
   }

   /** The release. A press still pending is a tap; one already consumed by the hold is nothing. */
   private endFeedPress(): void {
     const press = this.feedPress;
     if (!press) return;        // consumed by the hold, or never started
     press.timer.remove();
     this.feedPress = null;
     this.dropFood();
   }

   private cancelFeedPress(): void {
     this.feedPress?.timer.remove();
     this.feedPress = null;
   }
   ```
   `endFeedPress` reading `null` as "already consumed" is the whole state machine, and it is why the
   hold's callback nulls the field *before* it cycles.
4. Wire the release into the **existing** scene-level `pointerup` / `pointerupoutside` listeners that
   `enableTouch` already registers for the stick's `release`. Do not add new global listeners and do not
   add per-object handlers — the single-dispatch rule. The stick's `release` and the feed release are
   independent (`release` returns early unless the pointer id matches the stick's), so calling
   `this.endFeedPress()` from the same handler is safe.
5. `disableTouch()`: `this.cancelFeedPress();` — the leak the design named.
6. Dev hooks beside `__touchLayout`:
   ```ts
   (window as any).__feedPressStart = () => this.beginFeedPress();
   (window as any).__feedPressEnd = () => this.endFeedPress();
   ```
   so the e2e times a hold with real page waits and no synthetic Phaser pointer events. The real
   pointer path is covered too (test 1 below) — the hooks exist for the timing cases where a mouse
   down/up pair across 400ms of wall clock would be flaky.

### `game/src/ui/controlsHelp.ts`

A touch line for the panel. `HELP_ROWS` is the keyboard table, so add a separate one-line constant
rather than a fake key row:

```ts
/** The one gesture the touch layer has that the keyboard does not spell (BACKLOG-547). */
export const TOUCH_HINT = 'hold 🍖  switch loaded feed';
```

and `helpLines` appends it. It renders on desktop too, which is correct — it is documentation of the
game, and the panel is already hidden while the touch layer is up (`enableTouch` hides the chip and the
panel), so the only reader who sees it is a desktop player reading the manual.

### `tests/e2e/cycle-160-hold-feed.spec.ts`

1. **Real pointers, the tap:** mouse down + up on the feed button (fast). `__food()` is non-null;
   `__loadedFeed()` unchanged.
2. **Real pointers, the hold:** mouse down on the feed button, wait past `LONG_PRESS_MS` via an
   `expect.poll` on `__loadedFeed()` changing (never a bare `waitForTimeout` — the cycle-159 lesson:
   wait for the *state*, not the duration), then mouse up. `__food()` is null; `__loadedFeed()` advanced
   one slot.
3. **Once, not thrice:** hold through ~3× the threshold and assert the feed advanced exactly one slot.
4. **The HUD says so:** the gift HUD text contains the new feed's label after the hold.
5. **Nothing else moved:** a tap on `talk` still opens the tone menu (guard on the existing specs'
   behaviour, in this file, so a regression names itself).

---

## Test plan summary

- `npm --prefix game run build`
- `npx vitest run` from the **repo root** (the root config covers `tests/unit` + `game/src`; running
  from `game/` finds a fraction of the suite)
- `npx --yes kill-port 5173 && npx playwright test`

## Blockers

None known at plan time.
