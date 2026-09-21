# Cycle 164 — Code Plan

**Build order is fixed: Structure track first, then Lore track, then the BACKLOG-556 rider.**
See Risks for the reason and the collision map.

---

## Structure track — BACKLOG-555

**Item:** The watcher's record, not just its id. An additive `keeper` record in the save
(tenure, switch count, previous id, 156's persona slot) plus one plaque line that reads it.

### Files to create

- `game/src/keeper/record.ts` — the record's semantics. Pure, no Phaser.
  ```ts
  export interface KeeperPersona { text: string; source: string }   // shape-matches SaveData.personas
  export interface KeeperRecord {
    id: string;
    sinceDay: number;
    switches: number;
    previousId?: string;
    persona?: KeeperPersona;    // BACKLOG-156's slot — this cycle ships it empty
  }
  export function newRecord(id: string, day: number): KeeperRecord
  export function switchTo(rec: KeeperRecord, id: string, day: number): KeeperRecord
  export function recordFrom(saved: KeeperRecord | undefined, keeperId: string | undefined, day: number): KeeperRecord
  export function watchLine(rec: KeeperRecord, keeper: Keeper, day: number): string
  ```
  - `switchTo` returns `{ id, sinceDay: day, switches: rec.switches + 1, previousId: rec.id }` — note
    the **absence** of `persona`, which is the deliberate drop, commented as such.
  - `recordFrom`: `saved ?? newRecord(keeperId ?? DEFAULT_KEEPER_ID, day)`.
  - `watchLine(rec, keeper, day)`: `` `${keeper.name} · since day ${rec.sinceDay}` `` and, when
    `rec.switches > 0`, ` · ${ordinal(rec.switches + 1)} watcher`. `ordinal` is local and tiny
    (1st/2nd/3rd/nth); do not add a package for it.

- `game/src/keeper/record.test.ts` — unit tests (see Test plan).
- `tests/unit/cycle-164-keeper-record-save.test.ts` — save round-trip + old-save + malformed tests,
  co-located with the other save-shape tests.

### Files to modify

- `game/src/world/saveGame.ts`
  - `SaveData`: add `keeper?: { id: string; sinceDay: number; switches: number; previousId?: string; persona?: { text: string; source: string } }`. **Structural type inline**, not an import —
    the file's standing discipline is that keeper data is plain there (see the `metWatcher` comment).
  - the parser: a `keeper` block immediately after the `keeperId` block, in the `personas` idiom —
    `undefined` passes through; non-object or wrong field types `return null`; `previousId` and
    `persona` optional and each validated only when present.
  - the serializer/return: add `keeper` to the returned object beside `keeperId`.
- `game/src/ui/plaque.ts`
  - `PlaqueStats`: add `watch?: string`, documented absent-means-nothing, placed with the other
    keeper lines.
  - `plaqueLines`: `if (s.watch) lines.push(\`Watch · ${s.watch}\`);` — **above** `Sitting` and
    `Keeper`, since those two are about *this visit* and this one is about the whole tenure.
- `game/src/ui/plaque.test.ts` (or the existing plaque spec file) — the absent-is-identical test and
  the one-extra-line test.
- `game/src/scenes/WorldScene.ts`
  - new field `private keeperRecord: KeeperRecord = newRecord(DEFAULT_KEEPER_ID, FOUNDING_DAY);`
    beside `keeperId`.
  - `currentSaveData()` — add `keeper: this.keeperRecord,` beside `keeperId`.
  - the load path (~line 9179) — `this.keeperRecord = recordFrom(save.keeper, save.keeperId, getWorldClock().now().day);` on the line after `this.keeperId = …`.
  - `pickKeeperIndex` — inside the existing `if (changed)` branch, before `renderKeeperAvatar()`:
    `this.keeperRecord = switchTo(this.keeperRecord, keeper.id, getWorldClock().now().day);`
    The `changed` flag already exists and already distinguishes a real switch from a re-pick; **use
    it**, do not add a second comparison.
  - `plaqueStats()` — `watch: watchLine(this.keeperRecord, keeperById(this.keeperId), getWorldClock().now().day),`
  - dev-only Playwright hooks beside the existing `__keeperPickerOpen`:
    `__keeperRecord = () => this.keeperRecord` and `__plaqueLines = () => plaqueLines(this.plaqueStats())`
    (reuse `__plaqueLines` if one already exists — grep before adding).

### Reuse list (MUST reuse, do not reinvent)

- `keeperById` / `DEFAULT_KEEPER_ID` / `Keeper` — `game/src/keeper/keepers.ts`.
- `getWorldClock().now().day` — `game/src/world/clock.ts`. The day is the plaque's and the streak's
  existing unit; do not introduce a second time unit.
- `FOUNDING_DAY` — `game/src/world/clock.ts`, for the pre-load default.
- The `personas` parse block in `game/src/world/saveGame.ts` — copy its validation shape verbatim in
  structure (undefined-passes, malformed-rejects). Same for the `metWatcher` block's comment style.
- `plaqueLines`' existing optional-line idiom — `game/src/ui/plaque.ts`.
- The `changed` flag already computed in `pickKeeperIndex`.

### New dependencies

none.

### Test plan

**Unit — `game/src/keeper/record.test.ts`**
- `newRecord('aether', 1)` → `{ id: 'aether', sinceDay: 1, switches: 0 }`, `previousId` undefined.
- `switchTo(newRecord('aether', 1), 'vanta', 3)` → `switches: 1`, `previousId: 'aether'`,
  `sinceDay: 3`, `id: 'vanta'`.
- `switchTo` twice → `switches: 2`, `previousId` is the immediately-previous id, not the original.
- `switchTo` on a record **carrying a persona** → result has `persona === undefined`. (The 156 trap.)
- `switchTo` does not mutate its input (the returned object is new; the input is deep-equal to before).
- `recordFrom(undefined, 'lumen', 5)` → a fresh record for `lumen` at day 5, `switches: 0`.
- `recordFrom(undefined, undefined, 5)` → a fresh record for `DEFAULT_KEEPER_ID`.
- `recordFrom(rec, 'anything', 99)` → returns `rec` unchanged (a saved record wins).
- `watchLine` on a fresh record contains the keeper's name and `since day 1`, and does **not**
  contain `watcher`.
- `watchLine` after one switch contains `2nd watcher`; after two, `3rd watcher`; after three, `4th`.
- every keeper id in `KEEPERS` produces a non-empty `watchLine`.

**Unit — `tests/unit/cycle-164-keeper-record-save.test.ts`**
- a save containing a full `keeper` record round-trips deep-equal through the serializer + parser.
- a save object with **no** `keeper` key parses successfully and yields `keeper === undefined`
  (the caller seeds it) — the additive-save rule.
- a save whose `keeper` is `null`, a string, or an object with `switches: 'two'` / `id: 3` →
  parser returns `null`.
- a save whose `keeper.persona` is `{ text: 1 }` → parser returns `null`; `keeper.persona` absent →
  parses fine.

**Unit — plaque**
- `plaqueLines(stats)` with no `watch` is deep-equal to the same call before this change (assert
  against an explicit literal, not a snapshot).
- `plaqueLines({ ...stats, watch: 'X' })` has exactly one more line than the same stats without it,
  and that line is `Watch · X`.

**E2E — `tests/e2e/cycle-164-watch.spec.ts`**
- fresh boot → `__plaqueLines()` contains a line starting `Watch · ` that names AETHER-1 and says
  `since day 1`. No `emptyGrounds` here: this one **is** about the founding state.
- `__pickKeeper('vanta')` → `__keeperRecord().switches === 1`, `previousId === 'aether'`, and the
  plaque's `Watch · ` line now names VANTA-9.
- re-picking the observer already worn → `switches` unchanged.
- boot is clean (`console` error list empty) — the standing house check.

### Risks

- **The parser is a `return null` gate.** A too-strict check on `keeper` turns every *existing* save
  into a rejected save. Mitigation: `undefined` must pass through untouched, and the old-shaped
  fixture test above is the one that catches this. Write that test first.
- `plaqueLines` literals are asserted in many specs. The `watch` line is optional and the scene now
  always passes one, so **e2e** plaque assertions that match the whole block may move even though
  the unit contract did not. Grep `Sitting ·` and `Keeper ·` across `tests/` before running, and
  expect to touch a small number of e2e literals. Those are legitimate edits, not weakenings — the
  brass genuinely has one more line.
- `getWorldClock()` at the time `keeperRecord` is field-initialised may not be the loaded clock.
  That is why the field default uses `FOUNDING_DAY` and the real value is set on the load path.

### Estimated touch count

~8 files.

---

## Lore track — BACKLOG-157

**Item:** The second keeper ability — AETHER-1's **Read the Room** on `R`.

### Files to create

- `game/src/keeper/room.ts` — pure, no Phaser, no webllm.
  ```ts
  export const ROOM_RADIUS = 2;     // tiles, Chebyshev — "standing near"
  export const EASE_BOND = 20;      // at or above → 'at ease'; below → 'edgy'
  export interface RoomMember { name: string; tileX: number; tileY: number; zone?: string }
  export function canReadRoom(keeper: Keeper): boolean       // keeper.id === 'aether'
  export function roomLines(members: RoomMember[], bonds: Bonds, place?: string): string[]
  export function roomRefusal(keeper: Keeper): string         // '' for aether
  ```
- `game/src/keeper/room.test.ts`.
- `tests/e2e/cycle-164-room.spec.ts`.

### `roomLines` contract (write it to this, exactly)

```
— Read the Room —
<place>                                   // omitted when `place` is absent
Rex & Thornback — at ease
Bramble & Vex — edgy
alone: Sable
```
- Header always present.
- Pairs come from `stargazingPairs(members, ROOM_RADIUS)` (see Reuse), each rendered
  `` `${a} & ${b} — ${bondPoints(bonds,a,b) >= EASE_BOND ? 'at ease' : 'edgy'}` ``, sorted by
  `a` then `b` so output is deterministic.
- `alone:` lists, alphabetically and comma-joined, every member that appears in no pair.
  Omit the line when nobody is alone.
- Two uniform-room closers, mutually exclusive and only when they are true:
  `everyone here has somebody` when the alone set is empty and there is at least one pair;
  `nobody here is standing near anybody` when there are no pairs at all and ≥2 members.
- One member → the alone line and nothing else. Zero members → header (and place) only, no closer.
  **No line may assert something the input does not support** — this is the criterion
  "returns nothing that reads as a false claim".

### Files to modify

- `game/src/world/skyEvent.ts` — `stargazingPairs(gazers: Gazer[], radius = 1)`; replace the two
  hard-coded `<= 1` comparisons with `<= radius`. Default keeps every existing caller and every
  existing test byte-identical. Extend the doc comment with one line naming the new caller.
- `game/src/scenes/WorldScene.ts`
  - `import { canReadRoom, roomLines, roomRefusal } from '../keeper/room';` beside the scan import.
  - field `private roomPanel!: Phaser.GameObjects.Text; private roomOpen = false;`
  - `setupRoom()` — a panel built exactly like `scanPanel` but anchored at the **right** edge
    (`setOrigin(1, 0)` at `TILE * COLS - 6, 22`) so it never overlaps an open dossier; plus the
    dev hooks `__roomOpen`, `__canReadRoom`, `__roomLines`.
  - `toggleRoom()` — modelled on `toggleScan`: toggle-off first; then
    `if (!canReadRoom(keeper))` → `const near = this.nearestDino(); near ? this.showBubble(near, roomRefusal(keeper)) : this.logEvent(roomRefusal(keeper));` and **return** — it must not set
    `dialogOpen`; otherwise set the panel text from `roomLines(this.roomMembers(), this.bonds, zoneById(this.zoneId).name)` and show it.
  - `roomMembers()` — `this.dinos.map(d => ({ name: d.name, tileX: …, tileY: …, zone: this.zoneOf(d.name) }))`. **Grep first**: the scene already converts a dino to tile coordinates for
    the sky gather loop and already has a per-dino zone lookup; reuse both rather than recomputing.
  - key binding beside the `B` line: `KeyCodes.R → this.toggleRoom()`.
  - call `this.setupRoom()` in the `create()` setup list beside `this.setupScan()`.

### Reuse list (MUST reuse, do not reinvent)

- `stargazingPairs` — `game/src/world/skyEvent.ts`. It is already same-zone-aware and already
  carries the CHARTER v7 zone fix; a second pair-finder would be a second place for that bug to
  come back. **Parameterise it; do not copy it.**
- `bondPoints` — `game/src/social/bonds.ts`. Do not index the bond map by hand; `pairKey` ordering
  is the whole reason that function exists.
- `keeperById` — `game/src/keeper/keepers.ts`.
- `keeper/scan.ts` — the `canX`/`xLines`/`xRefusal` triple, the refusal-is-a-bubble-not-a-dialog
  rule, and the panel construction in `setupScan`. This track should read as its sibling.
- `showBubble`, `logEvent`, `nearestDino`, `zoneById` — all already on the scene.

### New dependencies

none.

### Test plan

**Unit — `game/src/keeper/room.test.ts`**
- `canReadRoom` true for `aether`; false for `vanta`, `lumen`, `kestrel` — iterate `KEEPERS` so a
  fifth seat added later fails loudly rather than silently gaining the power.
- `roomRefusal` is non-empty and **distinct** for all three non-Aki ids (assert set size 3), and
  `''` for `aether`.
- two members 2 tiles apart, same zone → one pair line.
- two members 3 tiles apart → no pair; both listed alone.
- two members at identical tiles on **different** zones → no pair; both alone. (The zone bug.)
- bond at exactly `EASE_BOND` → `at ease`; one point below → `edgy`.
- a three-member room where one is far away → one pair line and `alone: <that one>`.
- everyone paired → the `everyone here has somebody` closer and **no** `alone:` line.
- nobody within range → the `nobody here is standing near anybody` closer.
- one member → an `alone:` line and neither closer.
- zero members → header only (plus place); assert the output contains no `alone:` and no closer.
- determinism: shuffle the member array, assert identical output.
- `place` given → rendered; absent → not.

**E2E — `tests/e2e/cycle-164-room.spec.ts`**
- fresh boot, default observer is AETHER-1 → `__canReadRoom()` true; `KeyR` → `__roomOpen()` true
  and `__roomLines()` has more than one line. **No `emptyGrounds`** — this is the CHARTER v7
  reachability proof and the founding state is the point.
- `KeyR` again → `__roomOpen()` false. (`settle` between presses, per BACKLOG-515.)
- `__pickKeeper('vanta')`, `KeyE` to clear the confirmation, `__warpTo('Rex')`, `KeyR` →
  `__roomOpen()` false and `__bubbleTexts()` contains VANTA-9's refusal.
- with the panel open, `KeyE` beside a dino still opens the tone menu — the
  does-not-eat-the-next-E check, copied from the cycle-038 scan spec.
- boot is clean (console error list empty).

### Risks

- **The `dialogOpen` trap.** `toggleScan` documents it: a refusal rendered as a dialog eats the next
  `E`. The e2e above is the guard. Do not route the refusal through `this.dialog`.
- `R` is believed free — the used set is `B C E F G H K M O P T V Z`, brackets, comma, period, 1-4,
  WASD, arrows. **Re-grep `KeyCodes.` before binding**; if `R` has been taken since this plan was
  written, take `N`.
- `stargazingPairs` is O(n²) and now runs on an `R` press over the whole cast. The cast is single
  digits; this is fine and needs no comment. If the roster ever reaches the hundreds this is the
  line to revisit, not before.
- The panel is right-anchored specifically so a player holding both `B` and `R` open does not get
  two overlapping black boxes. If the canvas width constant is not `TILE * COLS` in this scene,
  use whatever `addControlsHint` uses.

### Estimated touch count

~6 files.

---

## Rider — BACKLOG-556's host (build last, after both tracks are green)

Four edits, no behavior change while no rig exists:

- `game/src/world/loner.ts` — `export const MOPE_ART_KEY = 'mope';` beside `MOPE_GLYPH`.
- `game/src/scenes/WorldScene.ts` — `mopeMarks` becomes
  `(Phaser.GameObjects.Text | Phaser.GameObjects.Image)[]`; its construction becomes
  `this.mopeMarks.push(this.makeHourMark(MOPE_ART_KEY, MOPE_GLYPH));`.
- `game/src/world/reachability.ts` — `out.add(MOPE_ART_KEY);` in `worldPlacedProps()`, with a
  comment in the style of the `DOZE_ART_KEY` / need-tell entries.

`refreshMopeMarks` calls only `setVisible`/`setPosition`, both of which exist on `Image` as well as
`Text`, so **no refresh change is needed** — verify that by reading the function rather than
assuming it. `makeHourMark` falls back to a `Text` glyph when `hasPropArt` is false, so the mark
renders exactly as it does today until the Artist lands the rig.

**Risk:** the `__marks()` debug map at `WorldScene.ts:1899` reads these arrays and may call
`.text` on the entries. Check how the sibling `Image`-capable arrays (`sleepMarks`, `needMarks`) are
handled there and follow that; do not special-case `mope`.

---

## Cross-track collision map

| File | Structure track | Lore track | Rider |
|---|---|---|---|
| `keeper/record.ts` | creates | — | — |
| `keeper/room.ts` | — | creates | — |
| `world/saveGame.ts` | edits | — | — |
| `ui/plaque.ts` | edits | — | — |
| `world/skyEvent.ts` | — | edits | — |
| `world/loner.ts` | — | — | edits |
| `world/reachability.ts` | — | — | edits |
| `scenes/WorldScene.ts` | **save/load, `pickKeeperIndex`, `plaqueStats`** | **key block, `setupRoom`/`toggleRoom`** | **mark construction** |

`WorldScene.ts` is the only three-way file and the three regions do not touch. Build in the stated
order — structure, lore, rider — and run the build between each so a failure has one candidate
cause instead of three.

**Total estimated touch count: ~13 files** — within the CHARTER v6 arc size of 15, no split needed.
