# Cycle 155 — Code Plan

**Order of work is fixed and non-negotiable this cycle: structure track first.** The lore
track imports `SESSION_MIN_MS` from `departure.ts` and hangs off the transition edge that
module defines. Building 119 first would mean inventing a second departure notion and then
deleting it.

---

## Prior art found (reuse, do not re-implement)

| need | already exists | where |
|---|---|---|
| "who likes the keeper most", with a tie-break | `topBy` (currently **private**) | `game/src/world/homecoming.ts:48` |
| one hour-mark object, rig-or-glyph | `makeHourMark(key, glyph)` | `WorldScene.ts:3644` |
| the mark precedence chain | `refreshSleepMarks → refreshRouseMarks → refreshVigilMarks → refreshMendMarks → refreshMissedMarks` | `WorldScene.ts:3700-3800` |
| in-view gating for a mark | `this.inView(d)` | used by all five |
| the marks dev hook | `__marks()` | `WorldScene.ts:1740` |
| the art-key register | `worldPlacedProps()` | `world/reachability.ts:150-166` |
| hearts from friendship points | `heartsFromPoints` | `social/friendship.ts` |
| the save write | `this.saveGame()` / `currentSaveData()` (`savedAt: Date.now()` at `WorldScene.ts:8300`) | `WorldScene.ts:8306` |

Nothing here needs a new utility. The two new files are both **domain** modules, not helpers.

---

## Design correction the Coder must apply — the glyph

The design and BACKLOG-119's own text both say the glance is 👀. **It cannot be.** 👀 is
`VIGIL_GLYPH` (`world/vigil.ts:52`) and 👁 is `ROUSE_GLYPH` (`world/chronotype.ts:91`), so two
of the five existing marks are already eyes and a third would make the family unreadable at
12px. The cycle-154 Artist made exactly this argument about the mallet — *if the silhouette
does not carry it, the mark axis is five variations on a circle* — and it applies here before
a pixel is drawn.

`GLANCE_GLYPH = '👋'`. The reasoning is not merely "a free glyph": the five existing marks are
facts about the dino's **interior** (asleep, awake-at-night, waiting, mending, thinking of
you). The sixth is the only one **addressed to the player**, and the one symbol this park
already uses to address the player is 112's welcome-back wave. Making the goodbye the same
gesture as the welcome is the bookend BACKLOG-119's own text asks for ("a living bookend to
112"), told from the other end.

**Consequence for the art queue:** BACKLOG-540's text describes an eye turned aside. It must be
amended at housekeeping to describe a raised hand, or the Artist will draw a rig that does not
match its host. Flagged here so it is a decision and not a drift.

---

## Structure track — BACKLOG-541

### New file: `game/src/world/departure.ts` (~70 lines, pure)

```
export type DepartureStage = 'here' | 'leaving' | 'gone';
export interface DepartureFacts { focused: boolean; hidden: boolean }
export function departureStage(f: DepartureFacts): DepartureStage
export function shouldStamp(prev: DepartureStage, next: DepartureStage): boolean
export const SESSION_MIN_MS = 20_000
```

- `departureStage` — `hidden` wins outright (a hidden tab is gone whether or not the OS still
  calls it focused); otherwise `focused ? 'here' : 'leaving'`.
- `shouldStamp(prev, next)` — `prev === 'here' && next !== 'here'`. One line, and it is the
  whole "once per departure, not once per event" rule: `leaving → gone` has `prev !== 'here'`
  so it does not re-stamp, and any `* → here` is a return, not a departure.
- `SESSION_MIN_MS = 20s` — long enough that the blur a player fires while alt-tabbing *into*
  the park at boot is not a goodbye, short enough to clear inside the ten-minute window the
  bar measures. Exported from here rather than from `parting.ts` because both tracks read it
  and a constant written down twice is the defect BACKLOG-483 exists over.

Imports: **nothing**. No Phaser, no `../ai/`, no clock — the stage is a function of two
booleans and the timestamps are the caller's.

### Changes to `WorldScene.setupGovernor` (~25 lines)

Fields: `private departure: DepartureStage = 'here'`, `private departureStamps = 0`,
`private sessionStartedAt = Date.now()`.

```
const applyDeparture = () => {
  const next = departureStage({ focused: document.hasFocus(), hidden: document.hidden });
  const prev = this.departure;
  this.departure = next;
  if (!shouldStamp(prev, next)) return;
  this.departureStamps++;
  this.onDeparture(next);          // lore track hooks in here — ONE call site
  void this.saveGame();            // BACKLOG-541: savedAt now means "when the keeper left"
};
window.addEventListener('blur', applyDeparture);
window.addEventListener('focus', applyDeparture);
window.addEventListener('pagehide', applyDeparture);
```

The existing `visibilitychange` listener keeps its two current lines (`this.tabHidden`,
`this.applyClockRate()`) and gains a call to `applyDeparture()`. **Do not add a second blur
listener anywhere** — the lore track uses `onDeparture`.

`document.hasFocus()` rather than tracking a boolean: it is the browser's own answer and it is
correct after a `pagehide`/restore, where a hand-tracked flag drifts.

Dev hook, beside the existing `__governor`:
`(window as any).__departure = () => ({ stage: this.departure, stamps: this.departureStamps })`.

### Phaser check the Coder must actually run, not assume

Phaser 3's `VisibilityHandler` emits `blur`/`focus` on the Game and Phaser does **not** pause
the RAF loop on window blur by default (only on the visibility change). Confirm it in the
running app before wiring the glance to `leaving`; if the loop does pause, say so in this file
under **Deviations** and do not paper over it — the glance's whole reachability claim is that
`leaving` still paints.

### Tests

`game/src/world/departure.test.ts` — the four `departureStage` combinations, the five
`shouldStamp` transitions, and one assertion that the module's import list is empty of Phaser
(existing suites do this by construction; here just keep it dependency-free).

`tests/e2e/cycle-155-departure.spec.ts` — blur moves the stage and stamps once; a following
visibility-hidden does not re-stamp; focus then blur stamps twice; the save's `savedAt`
advances across a blur (read before and after via `__saveNow`/the store). Declare the founding
state via `foundingState(page, ...)` per BACKLOG-495's seam.

---

## Lore track — BACKLOG-119

### `game/src/world/homecoming.ts` — one-word change

`function topBy` → `export function topBy`. Add one line to its doc comment naming
`parting.ts` as the second consumer, so the next reader knows why it is exported.

### New file: `game/src/world/parting.ts` (~55 lines, pure)

```
export const GLANCE_ART_KEY = 'glance';
export const GLANCE_GLYPH = '👋';
export const GLANCE_MS = 2500;
export interface Parting { name: string; hearts: number; line: string }
export function partingGlance(
  friendship: Friendship,
  present: string[],
  sessionMs: number,
): Parting | null
```

- Guard: `sessionMs < SESSION_MIN_MS` → null. `present.length === 0` → null.
- Filter `friendship` down to `present` (a plain object pick), hand it to `topBy`, null if
  `topBy` returns null (nobody has any points yet — a park you have not spoken to does not
  wave you off, and that is right).
- `partingLine(name, hearts)` — three tiers matching `spokenLine`'s shape and thresholds
  (`>=7`, `>=4`, else) so the goodbye and the welcome are graded on the same scale:
  - `${name}: Don't be long. 👋`
  - `${name}: See you soon! 👋`
  - `${name}: Oh. Going, then. 👋`
  All three are well under 60 chars with any roster name.

### `WorldScene` (~35 lines)

- `glanceMarks: Array<Text|Image>` beside the five, pushed in `spawnDino` via
  `makeHourMark(GLANCE_ART_KEY, GLANCE_GLYPH)`.
- `private glancer: string | null = null`.
- `refreshGlanceMarks()` inserted at the **top** of the chain: `refreshSleepMarks` calls it
  first, and every mark below it gains `&& this.glancer !== d.name`... **no** — cheaper and
  truer: the glance is the only mark with a deadline, so give it the top of the precedence
  order the way the vigil takes the rouse's slot. Concretely: `refreshGlanceMarks` shows
  `this.glancer === d.name && this.inView(d)`, and `refreshSleepMarks`/`refreshRouseMarks`/
  `refreshVigilMarks`/`refreshMendMarks`/`refreshMissedMarks` each add `this.glancer !== d.name`
  to their `shown` predicate. Five one-clause edits, no restructure — the file already does
  this exact thing four times.
- `private onDeparture(stage: DepartureStage): void` — returns immediately unless
  `stage === 'leaving'` (nothing is drawn to a hidden tab, and that is the item's whole
  correction). Calls `partingGlance(this.friendship, visibleAwakeNames(), Date.now() - this.sessionStartedAt)`,
  where the candidate list is `this.dinos.filter(d => this.inView(d) && !this.isResting(d)).map(d => d.name)`
  — the sleeping-dino exclusion is here, in the candidate list, not in `parting.ts`, because
  who is asleep is the scene's fact.
- On a result: `this.glancer = p.name`, `this.floatLine(p.line)` (use whatever the existing
  homecoming line uses — **read it, do not invent a floater**), `this.refreshSleepMarks()`,
  and `this.time.delayedCall(GLANCE_MS, () => { this.glancer = null; this.refreshSleepMarks(); })`.
- `__marks()`: add `['glance', this.glanceMarks]` as the **first** entry of `families`.

### `game/src/world/reachability.ts`

`out.add(GLANCE_ART_KEY)` with a two-line comment in the house style naming
`refreshGlanceMarks` as the placer and BACKLOG-540 as the rig that will fill it.

### Tests

`game/src/world/parting.test.ts` — the three null guards; picks the highest in `present` and
ignores a higher one outside it; the tie-break resolves lexicographically **and** the spec
asserts it against `topBy` imported from `homecoming.ts` (so a second implementation would
fail the spec, not just be redundant); the line contains the name and the glyph and is `< 60`.

`tests/e2e/cycle-155-glance.spec.ts` — after `SESSION_MIN_MS`, one `blur` puts exactly one
name in `__marks().glance`; it clears after `GLANCE_MS`; a `blur` before `SESSION_MIN_MS`
leaves it empty (**assert the silence**); a visibility-hidden with no prior blur throws
nothing and shows nothing. Use `__advanceSession`-style control only if one already exists —
otherwise set `sessionStartedAt` back through a dev hook rather than sleeping 20 real seconds
in a spec.

---

## Files touched (11)

```
game/src/world/departure.ts                 new
game/src/world/departure.test.ts            new
game/src/world/parting.ts                   new
game/src/world/parting.test.ts              new
game/src/world/homecoming.ts                export topBy + one comment line
game/src/world/reachability.ts              + GLANCE_ART_KEY
game/src/scenes/WorldScene.ts               listeners, onDeparture, glance marks, __marks, __departure
tests/e2e/cycle-155-departure.spec.ts       new
tests/e2e/cycle-155-glance.spec.ts          new
BACKLOG.md                                  540 text amended (glyph), items marked
studio/…                                    handoffs + state + chronicle
```

Under the ~15-file arc cap with room.

## Blockers

None known at plan time.

## Deviations (Coder fills this in)

_(to be completed by the Coder before QA)_
