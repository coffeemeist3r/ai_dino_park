# Cycle 148 — Code Plan

Build order is fixed by the shared module: **structure track's `chronotype.ts` additions → lore track's
`chronotype.ts` addition → both `WorldScene.ts` seams → the 515 rider → tests.**

## Prior art checked before planning anything new

| need | already exists | verdict |
|---|---|---|
| per-dino rest read | `atRest(hour, chronotype, season)` — `world/chronotype.ts` | reuse, do not re-derive |
| chronotype from traits | `chronotypeOf(p)`, and `WorldScene.chronoOf(d)` | reuse |
| the rest window itself | `restWindow(c, season)` | **the derivation source for `dayStanding`'s quarters** — no new hour constant |
| park-dark read | `dayPhase(hour)` — `world/dayNight.ts` | reuse for `nightlong` |
| temperament split | `PRICKLY_MAX` / `EFFUSIVE_MIN` — `ai/brain.ts` | reuse; `hourAside` copies `mealtimeAside`'s exact shape |
| aside composition | the nine `if (ctx.x)` blocks at the end of `cannedReply` | append a tenth, same idiom |
| ticker + memory + dedup beat | `checkLastOne` (464) + `world/lastone.ts` | **the pattern `watch.ts` copies verbatim** |
| zone membership | `occupiedZones` / `zonePopulations` — `world/zones.ts` | left alone; only the work read changes |
| one-frame wait in e2e | the `requestAnimationFrame` await inside `boot()` | **extract it** rather than write a new primitive |

No new module is needed for either track's logic beyond one small strings file, and that file exists only
because `lastone.ts` set the precedent that beat-strings live outside the scene.

---

## Structure track — BACKLOG-524

### `game/src/world/chronotype.ts` (edit)

```ts
export interface Resident { name: string; zone: string; traits: Personality }

export function wakingIn(rows, hour, season?): Record<string, number>
export function watchersIn(rows, hour, season?): string[]
```

- `wakingIn` — group by `row.zone`, count `!atRest(hour, chronotypeOf(row.traits), season)`. Every zone
  present in `rows` gets a key, **including zeros** (a ground with a sleeping cast must read 0, not absent
  — the caller distinguishes "asleep" from "nobody lives here").
- `watchersIn` — for each zone with **≥ 2 residents** and **exactly one** waking, that one's name. Sorted,
  so the cadence is order-stable. A solo resident is never a watcher: there is nobody to keep watch over.
- Both pure. Hour and season stay parameters; the module's header rule is untouched.

### `game/src/world/watch.ts` (new, ~12 lines)

Straight copy of `lastone.ts`'s three-function shape, so the two beats read identically:
`watchEvent(name, zoneName)` (ticker), `watchMemory(zoneName)` (recall trace, no leading article),
`watchLine()` (the bubble). Glyph `👁` reused as text here — **`ROUSE_GLYPH`/`isRoused` and BACKLOG-520's
baked rig are not touched**, per the design's "deliberately not a new glyph".

### `game/src/scenes/WorldScene.ts` (edit, 3 seams)

1. **`private residentRows(): Resident[]`** — one shared read: `this.dinos.map(d => ({ name: d.name, zone: zoneOf(this.dinoZones, d.name, BOWL_ID), traits: d.traits }))`. Both new reads go through it so they can never disagree.
2. **`maybeSpawnResource`** — the two-line seam. The regrowth line stays outside the gate:
   ```ts
   const waking = wakingIn(this.residentRows(), getWorldClock().now().hour, this.currentSeason());
   for (const zone of this.residentZones()) {
     this.yieldByZone[zone] = workRegrowth(...);   // unchanged — a sleeping ground still recovers
     if ((waking[zone] ?? 0) === 0) continue;      // BACKLOG-524: it stops producing, not recovering
     ...existing body unchanged...
   }
   ```
3. **`private checkWatch(): string[]`** — modelled line-for-line on `checkLastOne`: for each name from `watchersIn`, skip if `recall(this.memory, name)` already holds `watchMemory(zoneName)`, else remember + `showBubble` + `logEvent`. Called from `maybeMigrate` beside `checkLastOne` (line ~6386).

Dev hooks, mirroring the `__checkLastOne` / `__resting` pattern already in the file:
`__wakingIn()`, `__watchers()`, `__checkWatch()`.

### Tests

- `game/src/world/chronotype.test.ts` (extend): `wakingIn` zero/partial/full cases; **the roster assertion built from `ROSTER` + `seededPersonality` rather than a hardcoded table**, at 08:00 and at 13:00; `watchersIn` for the four cases (lone waker / two awake / none awake / solo resident awake).
- `tests/e2e/cycle-148-nightshift.spec.ts`: frame-one no-clock-touched read; the 13:00 advance via `__advanceMinutes(5*60)`; the Grove watch line + memory; and the regrowth-still-runs assertion via `__zoneYield` if exposed, else through the unit test only (do not add a hook just for it).

---

## Lore track — BACKLOG-110 (+ 279)

### `game/src/world/chronotype.ts` (edit, after the structure track's block)

```ts
export type DayStanding = 'roused' | 'fresh' | 'waning' | 'nightlong';
export function dayStanding(hour, c, season?): DayStanding | null
```

Derivation, with the arithmetic written out because it is the whole point of the item:

```
if (atRest(hour, c, season)) return 'roused';
const { start, end } = restWindow(c, season);        // awake span is [end, start)
const span    = ((start - end) % 24 + 24) % 24;      // 16h for every shipping window
const awakeFor = ((hour - end) % 24 + 24) % 24;
const quarter = span / 4;
if (dayPhase(hour) === 'night') return 'nightlong';  // most specific truth first
if (awakeFor < quarter)          return 'fresh';
if (awakeFor >= span - quarter)  return 'waning';
return null;
```

`span === 0` (a window that never opens) returns `null` after the `atRest` check — a guard, not a case the
shipping seasons reach.

**No literal hour appears in this function.** Spring day-dino: window 21→05, span 16, quarter 4, so `fresh`
is 05:00–09:00 and 08:00 lands in it *because the window says so*.

### `game/src/ai/brain.ts` (edit)

- `NPCContext.standing?: DayStanding`.
- `export function hourAside(standing: DayStanding, traits?: Personality): string` — `switch` over four
  registers × prickly/warm/plain, byte-for-byte the shape of `mealtimeAside`. Twelve lines, each leading
  with ` …` like every other aside.
- `cannedReply`: a tenth block, **last**, after `mealtime`:
  ```ts
  if (ctx.standing) reply = { ...reply, text: (reply.text + hourAside(ctx.standing, ctx.traits)).slice(0, 540) };
  ```
  The 460 cap above it is untouched, so every earlier register's output is unchanged; 540 is the only new
  cap and holds the longest of the twelve.

### `game/src/ai/webllmBrain.ts` (edit, 1 line)

Beside the existing `when`: `const standing = ctx.standing ? STANDING_PROMPT[ctx.standing] : '';` folded
into the same preamble string. The model is told the fact, never asked to author the frame.

### `game/src/scenes/WorldScene.ts` (edit, 3 literals)

`standing: dayStanding(now.hour, this.chronoOf(d), this.currentSeason())` alongside the existing
`timeOfDay:` at **5313** (`npc_meet` — omit; that path is out of scope, see below), **5627**
(`__greetPrompt`) and **6952** (`pickTone`, the real greet). Also the `greet()` path on `Dino` if it builds
its own context — check `entities/dino.ts` before editing and route through the same helper either way.

> **`npc_meet` at 5313 is deliberately not touched** — the design puts dino-to-dino lines out of scope. It
> keeps `timeOfDay` only, exactly as today.

A single `private standingOf(d: Dino)` so the three sites cannot drift, mirroring `chronoOf`.

### Tests

- `tests/unit/chronotype.test.ts` (same file as above): the five register cases; the 08:00 spring pair
  asserted **through `restWindow`**; the derivation test that shifts the window and shows `fresh` moves;
  `nightlong` beating `waning`.
- `tests/unit/brain.test.ts` (extend): twelve distinct `hourAside` lines; **the byte-identity assertion** —
  `cannedReply(ctx)` with no `standing` deep-equals today's output for a fixed ctx; composition onto
  generic / wistful / fond / gratitude; the 279 criterion (fond + `keeperName` + standing in one line);
  `buildMessages` carries the standing.
- `tests/e2e/cycle-148-hour-in-voice.spec.ts`: frame-one `fresh` on a waking Bowl dino and `roused` on Rex,
  lines differing; then `__advanceMinutes` to the small hours for `nightlong`. Greeting goes through
  `__greet(name)` (already used by `mobile-minds`) with `__lastDialog` / the dialog text hook for the line.

---

## Rider — BACKLOG-515

### `tests/e2e/helpers.ts` (edit)

Extract and export the frame wait `boot()` already performs:

```ts
export async function settle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((r) =>
    requestAnimationFrame(() => requestAnimationFrame(() => r()))));
}
```

Two frames, not one: Phaser's `KeyboardPlugin` queues the DOM event and the scene's update step emits
`Key.on('down')`, so one frame guarantees the queue is drained and the second guarantees the handler's
effect is on screen. `boot()` keeps its **own single-frame** await exactly as written — the extraction adds
a helper, it does not change `boot`. Header comment states the failure mode so the next spec author reaches
for it.

### Call sites (input → immediate read)

`tests/e2e/mobile-minds.spec.ts` (the `KeyK` / `KeyE` / `ArrowLeft` / body-tap sequence, ~lines 82–113),
`cycle-044-sound.spec.ts` (`__lastSound()` after a tone pick), `cycle-047-warmth.spec.ts`,
`cycle-038-scan.spec.ts`. **Only the seams that read straight after an input** — this is not a licence to
sprinkle `settle` through passing specs.

---

## Reuse ledger (CHARTER: "Coder checks for prior art before adding new modules")

Reused: `atRest`, `restWindow`, `chronotypeOf`, `dayPhase`, `occupiedZones`, `workRegrowth`, `recall`,
`remember`, `showBubble`, `logEvent`, `PRICKLY_MAX`, `EFFUSIVE_MIN`, `moodFromTraits`, `checkLastOne`'s
dedup shape, `boot`'s rAF await.
New files: **one** — `game/src/world/watch.ts` (three string functions, `lastone.ts`'s shape).

## Blockers

None known at plan time.

## Shipped

14 files. Build clean, **2371 unit green** across 228 files, **649/649 e2e green — the whole suite, with no
standing red for the first time since cycle 92.**

**Structure track (BACKLOG-524).** `chronotype.ts` gained `Resident`, `wakingIn` and `watchersIn`; `watch.ts`
is the one new module (three strings, `lastone.ts`'s shape). `WorldScene` gained `residentRows()` /
`wakingHeads()` as the one shared read, the two-line seam in `maybeSpawnResource` with the regrowth line
deliberately left outside the gate, and `checkWatch()` on the migration cadence beside `checkLastOne`.
Hooks: `__wakingHeads`, `__watchers`, `__checkWatch`, `__zoneResources`, `__spawnRoll`.

**Lore track (BACKLOG-110/-279).** `chronotype.ts` gained `DayStanding` + `dayStanding`, whose whole body
contains no hour literal. `brain.ts` gained `hourAside` (twelve lines) and composes it tenth and last.
`webllmBrain.ts` gained `STANDING_PROMPT` in the preamble. `WorldScene` gained `standingOf(d)` and passes
it on the greet paths.

**One thing the plan did not anticipate, and it is an improvement.** `__greetPrompt` built its own reduced
greet context inline; adding a second hook beside it would have made two literals that could drift about
the same dino. Both now route through **`greetContextFor(name)`**, and the new `__greetLine` returns the
*deterministic* line — which is the thing this item is actually about and which no hook had ever exposed.

**Rider (BACKLOG-515).** `settle(page)` exported from `helpers.ts`; `boot()` untouched. Applied at nine
read-after-input seams across the four catalogued specs.

**Two findings from the build rather than the plan.**

1. **The item's own class was wider than "read-after-input".** Three of the nine seams are
   **input-after-input**: `KeyE` opening the tone menu and `Digit1` picking from it in the same frame, so
   the pick landed against a menu that was not open and the tone was never chosen at all. The poll that
   followed then timed out on a beat that had never been requested — which is why `cycle-044-sound` and
   `cycle-047-warmth` failed *despite* already using `expect.poll`. Polling cannot recover an input that
   was dropped.
2. **Each serial run surfaced a new victim until the file was done.** Fixing `mobile-minds` turned up
   `cycle-044`'s tone seam; fixing that turned up `cycle-047`'s; fixing that turned up `cycle-044`'s
   *M-mute* seam. Four runs, four different specs, one mechanism — the "different victim every run"
   signature this item has carried since cycle 130, reproduced on demand and then exhausted.

**A test that was wrong and the code that was right.** The byte-identity pin first compared the *generic*
canned greeting to itself, which picks one of four on `rand()` and can never equal itself twice. It was
repaired by asserting over the three deterministic registers (wistful / fond / grateful) rather than by
loosening the claim — those are the branches that can actually carry it.
