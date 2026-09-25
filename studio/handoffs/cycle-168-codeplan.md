# Cycle 168 — Code Plan

**Build order is fixed: Structure track first, then Lore track.** The structure track widens
`playChirp`'s signature; the lore track calls `playChirp` and would otherwise be written twice.

---

## Structure track — BACKLOG-559

**Item:** One bus for every voice — one master `GainNode`, and a pure module that decides the number.

### Files to create

- **`game/src/audio/mix.ts`** — pure. Exports:
  - `export type VoiceKind = 'chirp' | 'hail' | 'distress' | 'thunk';`
  - `export const VOICE_KINDS: readonly VoiceKind[]` — the union made iterable, so the totality test
    can walk it. (This is the cheap version of an exhaustiveness check and it is what the design's
    "total over `VoiceKind`" criterion needs.)
  - `const LEVEL: Record<VoiceKind, number>` — `chirp: 0.12`, `thunk: 0.168`, `hail: 0.08`,
    `distress: 0.20`.
  - `export function gainFor(kind: VoiceKind): number` — `LEVEL[kind]`, and nothing else. A one-line
    body is correct here; the *module* is the seam, not the arithmetic. Do **not** add a
    `distanceTiles` parameter (design: Out of scope; it is all of BACKLOG-206).
  - The file's doc comment states the identity claim explicitly: `chirp` and `thunk` are today's
    numbers unchanged, `hail` and `distress` are the two this cycle makes expressible.
- **`game/src/audio/cycle-168-mix.test.ts`** — colocated beside the module, matching the
  `game/src/art/cycle-NNN-*.test.ts` and `game/src/world/*.test.ts` precedent.

### Files to modify

- **`game/src/audio/voice.ts`**
  - Delete `const MASTER_GAIN = 0.12`; import `gainFor` + `VoiceKind` from `./mix`.
  - Add `let bus: GainNode | null = null;`.
  - `unlockAudio()` — after the context exists, create the bus once:
    `if (!bus) { bus = ctx.createGain(); bus.gain.value = 1; bus.connect(ctx.destination); }`.
    This is the **only** `ctx.destination` reference left in the file.
  - `playChirp(p: ChirpParams, kind: VoiceKind = 'chirp')` — the envelope peak becomes
    `gainFor(kind)`; `osc.connect(gain).connect(bus!)`.
  - `playThunk()` — peak becomes `gainFor('thunk')` (drop the inline `* 1.4`, the factor now lives in
    `LEVEL.thunk` with its reason beside it); connect to the bus.
  - Both play functions already early-return unless `ctx.state === 'running'`, which implies
    `unlockAudio()` ran, which implies the bus exists. Keep the `bus!` assertion honest by asserting
    `!bus` in the same guard rather than adding a second null check — one guard, not two.
- **`game/src/scenes/WorldScene.ts`**
  - `lastSound` field type (line ~1241): the `kind` union becomes `VoiceKind` — it is already
    `'chirp' | 'thunk' | 'hail'`, so this is `+ 'distress'` and an import. No call site changes shape.
  - `chirpFor` (~6986) — `playChirp(params)` unchanged (default kind).
  - `hailAndAnswer` (~7013) — `playChirp(KEEPER_HAIL, 'hail')`. The deferred answer at ~7021 stays
    default.
  - `cryDistress` (~7036) — `playChirp(params, 'distress')`, and `this.lastSound = { kind: 'distress',
    name: d.name, params }` so the observation seam actually carries the new kind (the design's
    criterion reads it).
  - `tapGlass` (~1668) — unchanged; `playThunk()` has no kind argument.

**Note on the one behaviour change to `lastSound`:** `cryDistress` currently records
`kind: 'chirp'` for a distress call. Changing it to `'distress'` is the point of the criterion, but
**grep the e2e suite for specs that assert `kind === 'chirp'` after a startle before you commit** —
`cycle-044-sound.spec.ts` and `cycle-097-hunger-voice.spec.ts` are the likely holders. Fix any such
assertion in the same commit; a spec that was asserting "the distress call is a chirp" was asserting
the wart.

### Reuse list

- `game/src/audio/chirp.ts` — `ChirpParams`, `THUNK`, `distressParams`. Untouched by this track.
- `game/src/audio/answer.ts` — `KEEPER_HAIL`. Untouched.
- `soundMuted()` in `voice.ts` — the mute gate does not move and is not reimplemented.
- The `lastSound` observation seam already exists (`__lastSound`); extend its union, do not add a
  fourth parallel field (BACKLOG-563 is the item for folding the three that exist).

### New dependencies

`none`.

### Test plan

**Unit — `game/src/audio/cycle-168-mix.test.ts`:**
1. `gainFor('chirp')` is exactly `0.12` — the identity case, so no voice anyone knows moves.
2. `gainFor('thunk')` is within `1e-9` of `0.12 * 1.4` — the second identity case, written as the
   product so the test states where the number came from.
3. `gainFor('hail') < gainFor('chirp') < gainFor('distress')` — the ordering *is* the feature: the
   keeper sits back, a cry carries.
4. Totality: `for (const k of VOICE_KINDS)` — `gainFor(k)` is a finite number in `(0, 1]`.
5. `VOICE_KINDS` has no duplicates and its length matches `Object.keys(LEVEL).length`, so adding a
   kind to the type without adding it to the list fails here rather than silently at a call site.

**E2E — `tests/e2e/cycle-168-voice-bus.spec.ts`:**
1. *The hail sits back and the answer comes forward.* `boot` → `foundingState('as-shipped')` →
   `settle` → greet Rex → `__lastSound()` is `{ kind: 'hail' }` → poll until `kind` is `'chirp'` and
   `name` is `'Rex'`. (Same shape as `cycle-167-call-and-answer.spec.ts`; the new assertion is that
   the two beats now carry different kinds through one bus.)
2. *A cry is a cry.* Trigger a startle (reuse whatever `cycle-044-sound.spec.ts` uses — `__tapGlass`)
   and assert `__lastSound()?.kind === 'distress'`.
3. *No console error on a device with no WebGPU / no audio.* Reuse the existing zero-console-error
   helper if the suite has one; the bus is created inside `unlockAudio` and must not throw in
   headless.

### Risks

- **The `bus!` non-null assertion.** If any future caller plays before `unlockAudio`, this throws
  where the old code silently used `ctx.destination`. The existing `ctx.state !== 'running'` guard
  makes that unreachable today; keep both play functions' guards identical and do not add a new
  entry point.
- **Headless CI has no real AudioContext.** Nothing here changes that — the specs read the scene's
  recorded `lastSound`, never the audio graph. Do not write a test that inspects `GainNode`.
- **The `'distress'` kind change to `lastSound`** is the one place an existing spec can legitimately
  go red. See the note above; it is a correction, not a regression.

### Estimated touch count

`~5 files` (2 new, 3 modified, plus whatever existing spec the `'distress'` kind correction touches).

---

## Lore track — BACKLOG-195

**Item:** Cry in the book — a cursor, a voice you can ask for, and the blend made legible.

### Files to create

- **`game/src/audio/cycle-168-voiceline.test.ts`** — unit tests for `voiceLine`.
- **`tests/e2e/cycle-168-cry-in-the-book.spec.ts`** — the cursor + cry walk.

No new source module. `voiceLine` goes in `chirp.ts` (design constraint: do not create a module for
one function).

### Files to modify

- **`game/src/audio/chirp.ts`** — add, below `chirpParams`:
  ```ts
  export interface VoiceParent { name: string; params: ChirpParams; }
  export function voiceLine(p: ChirpParams, parents?: [VoiceParent, VoiceParent]): string
  ```
  Body: `🔊 voice · ${p.pitchHz} Hz · ${p.notes} pip${p.notes === 1 ? '' : 's'}`, then when `parents`
  is supplied append the relation. Relation derived, not assumed:
  `lo = min(a,b)`, `hi = max(a,b)`; `p.pitchHz > hi → 'above both'`, `< lo → 'below both'`, else
  `'between'`. Rendered as `` — between ${a.name} ${a.params.pitchHz} and ${b.name} ${b.params.pitchHz} ``
  with the parents in their given order (lineage order, not sorted — `parents` in `BookRow` is
  `[parentA, parentB]` and the book already prints them that way). Pure, no imports beyond what the
  file has.
- **`game/src/ui/lenses.ts`**
  - `BookRow` gains `voice?: string` — optional, absent-means-nothing, exactly the
    `bookLines(rows, away = [])` precedent, so the ~dozens of existing `BookRow` literals across the
    suite stay valid.
  - `BookRow` gains `selected?: boolean`.
  - `bookLines` — the name line becomes ``${r.selected ? '▸' : ''}${r.name}  (${r.species})  [${r.role}]``.
    An unselected row is **byte-identical** to today (empty prefix, no extra space). Insert
    `if (r.voice) out.push(\`  ${r.voice}\`);` directly **under** the hearts/menu block and above the
    quirk — the voice is what the dino *is*, so it belongs with the fingerprints, at their head.
- **`game/src/scenes/WorldScene.ts`**
  - New field `private bookCursor = 0;`.
  - `bookRows()` — after the existing map, set `selected` and `voice` for the cursor row only:
    - clamp the cursor first: `const i = this.dinos.length ? Math.min(this.bookCursor, this.dinos.length - 1) : 0;`
      and write the clamped value back to `this.bookCursor` (this is the "removing the selected dino
      leaves the cursor valid" criterion, handled in one place rather than on every roster mutation).
    - `voice` for that row: `voiceLine(chirpParams(d.traits), this.voiceParentsOf(d))`.
  - New private `voiceParentsOf(d: Dino): [VoiceParent, VoiceParent] | undefined` — reads
    `parentsOf.get(d.name)` (already built at the top of `bookRows`), looks both names up via the
    existing `dinoByName`, and returns `undefined` unless **both** resolve. This is the "live read,
    never stored" rule.
  - New key handler beside the `V` registration (~5096):
    `addKey(KeyCodes.N).on('down', () => this.stepBookCursor())`.
  - New private `stepBookCursor()`:
    ```
    if (this.lens !== 'book' || !this.dinos.length) return;
    this.bookCursor = (this.bookCursor + 1) % this.dinos.length;
    this.refreshLens();                 // re-renders the panel with the new ▸ and voice line
    this.chirpFor(this.dinos[this.bookCursor]);   // reuse — mute gate and lastSound live in there
    ```
    `chirpFor` already early-returns on mute and already writes `lastSound`, which is exactly the
    design's mute criterion (cursor moves, line renders, no sound recorded). **Do not** duplicate the
    mute check here.
  - `[?]` help panel (`ui/controlsHelp.ts`) — add the `N` line.
- **`game/src/ui/controlsHelp.ts`** — one row: `N — next entry (book lens)`. Check whether that file
  has a fixed-height panel before adding; if it is a list, this is one entry.

### Reuse list

- `chirpParams` (`audio/chirp.ts`) — the voice. **Not** re-derived.
- `blendTraits` / `hatch` (`social/breeding.ts`) — **not touched at all.** The blend already happens
  there; this cycle reads its result. Any new blend arithmetic is the bug.
- `this.chirpFor(d)` (`WorldScene.ts:6986`) — the whole play-a-dino's-voice path, mute gate and
  `lastSound` write included.
- `this.dinoByName` — parent lookup.
- `this.refreshLens()` — the panel re-render. Do not call `bookPanel.setText` directly.
- `bookLines` / `BookRow` (`ui/lenses.ts`) — the optional-field precedent is already established by
  `menu`, `quirk`, `hours`, `dream`, `tic`, `home`, `wander`, `manner`, `pecking`.

### New dependencies

`none`.

### Test plan

**Unit — `game/src/audio/cycle-168-voiceline.test.ts`:**
1. Plain form: `voiceLine({pitchHz: 412, lengthMs: 200, wobble: .3, notes: 2})` ends `· 2 pips`.
2. Singular: `notes: 1` renders `· 1 pip`.
3. `between`: child pitch strictly inside the parents' pair → `— between Rex 301 and Sunny 523`,
   with the parents in the order given.
4. `above both` / `below both`: child pitch outside the pair, both directions.
5. Boundary: child pitch exactly equal to a parent's → `between` (the pair is inclusive; a child that
   landed on a parent's pitch did not escape it).
6. Order independence: passing the parents swapped changes only the two names/numbers in the
   sentence, never the relation word.
7. Round-trip against the real founders: `voiceLine(chirpParams(t))` for a personality vector is a
   non-empty string starting `🔊 voice · `.

**Unit — extend the existing `lenses` spec (`game/src/ui/lenses.test.ts`):**
8. A `BookRow` with no `voice` and no `selected` produces **byte-identical** output to the same row
   before this cycle — the compatibility case, written as an explicit literal.
9. `selected: true` puts exactly one `▸` at the head of that row's name line.
10. `voice` renders as one indented line under the hearts/menu block.

**E2E — `tests/e2e/cycle-168-cry-in-the-book.spec.ts`:**
1. *The cursor exists and wraps.* boot → founding state → settle → press `v` until the book lens is
   up → press `n` → `__bookText()` has exactly one `▸`; press `n` five more times → the `▸` is back
   on the first dino. (Count with a regex over `__bookText()`; the helper already exists at
   `WorldScene.ts:5149`.)
2. *The cry is the selected dino's own.* After a step, `__lastSound()` is `{kind:'chirp', name:<the
   name carrying the ▸>}`. Assert the name is read **out of the book text**, not hardcoded, so the
   spec cannot pass on a cursor that moved somewhere else.
3. *Two dinos, two voices.* Step twice and assert the two recorded `params.pitchHz` differ — the
   milestone's whole claim, and the first spec in the park that hears two voices side by side.
4. *Out of the lens, nothing happens.* Press `v` to leave the book → `n` → `__lastSound()` unchanged.
5. *Muted, the cursor still moves.* `m` → `n` → the `▸` advanced in `__bookText()` and `__lastSound()`
   is unchanged. Press `m` again to leave the device as found (the cycle-167 spec's courtesy).
6. *The voice line is on the selected block only.* `__bookText()` contains exactly one occurrence of
   `🔊 voice · `.

### Risks

- **`bookRows()` is called on every `refreshLens`, and `stepBookCursor` calls `refreshLens`.** No
  recursion (the cursor is set before the render), but do not put the cursor advance inside
  `bookRows` — that would make a read mutate.
- **Existing `BookRow` literals.** Both new fields are optional and both render nothing when absent;
  the byte-identical unit test above is what proves it. If any existing lenses spec goes red, the
  name-line change is the suspect — check for a stray space before `${r.name}`.
- **Key collision on `N`.** Grepped: `N` is not bound (`addKey` sites at 1335–9955 cover W/A/S/D, E,
  Z, 1–4, K, B, R, M, H, P, V, `/`, T, O, C, `[`, `]`, `.`, `,`, F, G). Confirm once more before
  committing — a collision would be silent.
- **The touch surface gets nothing.** Deliberate (design: Out of scope, BACKLOG-552 owns the sheet's
  capacity). The Validator should see this stated rather than discover it.
- **Ordering with the structure track:** `chirpFor` is modified by neither track's diff in a
  conflicting way — structure changes `hailAndAnswer`/`cryDistress`, lore calls `chirpFor` unchanged.

### Estimated touch count

`~7 files` (2 new, 5 modified). Combined cycle: **~12 files** — inside the CHARTER v6 arc size.


---

## Shipped

Both tracks landed, in the planned order.

**Structure (559):** `audio/mix.ts` new and pure; the bus created in `unlockAudio`, `MASTER_GAIN`
gone, one `ctx.destination` left in the repo. `hailAndAnswer` plays `'hail'`, `cryDistress` plays and
**records** `'distress'` (it had recorded `'chirp'` — the wart the plan flagged). No existing spec was
asserting that wart, so nothing had to be corrected.

**Lore (195):** `voiceLine` beside `chirpParams`; `BookRow.voice` + `BookRow.selected`; `bookCursor`
clamped inside `bookRows`; `stepBookCursor` on `N`, reusing `chirpFor` for the mute gate.

**Two deviations from the plan, both forced by a red test and both fixed at the root:**

1. **The help row was one character too wide.** `helpLines` pads to the widest key (13) and the panel
   asserts every line under 40 chars, so `next book entry + its cry` (25) landed at exactly 40.
   Shortened to `next book entry + cry`. Two unit specs caught it, which is the check working.

2. **The `▸` cursor broke every book-block parser in the e2e suite** — 13 specs across four files, all
   of which located a dino's block with `line.startsWith(\`${name}  (\`)`. The selected entry's header
   no longer starts with its name, so the parser found every block except the one the player is
   looking at. The four copies were **replaced by one exported `isBookHeader` in `tests/e2e/helpers.ts`**
   rather than patched four times: a check written out by hand in four places is why one render change
   could redden thirteen specs at once. Each spec's own block-slicing logic is untouched.

**Board at hand-off:** `npm run build` clean · **3043 unit** across 285 files · **828 e2e**, full
suite green in one run.
