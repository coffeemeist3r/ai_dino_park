# Cycle 163 — Code Plan

**Build order is not optional this cycle: structure track first, then lore track.** Both edit
`game/src/keeper/keepers.ts`, and the lore track authors a line keyed to the roster id the structure track
creates. The Risks section at the bottom of each track says what breaks if the order is inverted.

---

## Structure track — BACKLOG-212

**Item:** BACKLOG-212 [core] Non-robot keeper archetype — the roster gains a watcher that is not a
time-traveling robot, and both input surfaces learn to select it.

### Files to create

- `tests/unit/cycle-163-kestrel.test.ts` — the fourth roster entry, its fit/bonus inversion, the address
  escalation, and the two free consequences (`inspector`, `canScan`).
- `tests/e2e/cycle-163-fourth-watcher.spec.ts` — the picker lists four, `4` selects Kes, the choice
  survives a reload, and the touch chip row carries a `[4]` for the picker but not for the tone menu.

### Files to modify

- `game/src/keeper/keepers.ts` — append the fourth `Keeper` at index 3 (`kestrel`). Update the
  `// Order is the picker order (1 / 2 / 3)` comment to `(1 / 2 / 3 / 4)`. **No function bodies change:**
  `keeperFit`, `keeperBonus`, `designationOf`, `nicknameOf`, `keeperAddress` all already handle it.
- `game/src/input/touch.ts` — `menuChips(width, height, numbered: boolean)` becomes
  `menuChips(width, height, options: number)`. `options <= 0` gives `['◀','✕']`; otherwise
  `['◀', ...'1'..String(options), '✕']`. Keep `w = 48`, `h = 36`, the `10px` gap and the existing centring
  maths untouched — the row grows by widening `total`, which the formula already derives from
  `labels.length`.
- `game/src/scenes/WorldScene.ts`
  - `create()` (~line 1209) — add `KeyCodes.FOUR -> this.onNumberKey(4)` beside ONE/TWO/THREE.
  - `onNumberKey(n)` — the final `pickTone` line must not index past the tone array. Guard explicitly:
    resolve the tone first and return when it is `undefined`, rather than passing `undefined` into
    `pickTone`.
  - `syncTouchUi()` (~7068) and `chipIdAt()` (~7085) — replace the `numbered` boolean with the option
    **count**: `this.keeperPickerOpen ? KEEPERS.length : this.toneMenuOpen ? TONES.length : this.mindsConfirm ? 2 : 0`.
    Extract that into one small private `numberedOptions(): number` so the two call sites cannot drift —
    they are already duplicated today and this is the cheapest moment to stop that.
  - The two `menuChips(...)` call sites (~6878, ~6938) — pass `this.numberedOptions()`.
  - `dismissDialog()` (~8206) — the comment says "1/2/3 choose"; make it "1–4".
- `tests/unit/touch*.test.ts` (whichever pin `menuChips`) — update to the new signature. This is a
  signature migration, not a behaviour change: `true` becomes `3`, `false` becomes `0`, and every existing
  assertion must still hold.

### Reuse list

- `keeperFit` / `keeperBonus` (`game/src/keeper/keepers.ts`) — **do not touch them.** The `sum of
  weight * (trait*2 - 1)` form already produces the intended inversion from negative weights. If you find
  yourself editing either, the appeal is wrong, not the function.
- `designationOf` / `nicknameOf` / `keeperAddress` (same file) — the name string is authored to parse
  through these unchanged. Verify, do not special-case.
- `inspector` (`game/src/keeper/firstContact.ts`) — already scores by `keeperFit`; the inverted
  first-contact pick is a consequence to assert, not code to write.
- `canScan` (`game/src/keeper/scan.ts`) — already an id equality check; Kes falls out false.
- `menuChips` / `inRect` / `RectButton` (`game/src/input/touch.ts`) — widen the existing function.
- `makeKeeperArt` / `hasKeeperArt` (`game/src/art/bake.ts`, `game/src/art/keeperArt.ts`) — the amber-square
  fallback for an undrawn id is existing behaviour; `renderKeeperAvatar` needs no change.
- `saveGame.ts` `keeperId` — already `string`; no schema work.

### New dependencies

none.

### Test plan

**Unit — `tests/unit/cycle-163-kestrel.test.ts`**

- `KEEPERS.length === 4`, `KEEPERS[3].id === 'kestrel'`, and `KEEPERS[0..2].id` unchanged.
- `designationOf(KEEPERS[3]) === 'Kestrel of the Ninth Quiet'`; `nicknameOf(KEEPERS[3]) === 'Kes'`.
- `keeperAddress(KEEPERS[3], NICKNAME_MIN)` is the nickname; at `NICKNAME_MIN - 1` it is the designation.
- With `quiet = { curiosity: .1, sociability: .1, energy: .5, agreeableness: .5, bravery: .5 }` and
  `bright = { curiosity: .9, sociability: .9, ... }`: `keeperFit(KEEPERS[3], quiet) > 0`,
  `keeperFit(KEEPERS[3], bright) < 0`.
- `keeperBonus(KEEPERS[3], quiet) === 2`; `keeperBonus(KEEPERS[3], bright) === 0` (never negative —
  pin the floor explicitly, it is the "a perk, not a punishment" rule).
- **The distinctness assertion:** for `quiet`, `keeperBonus(KEEPERS[3], quiet) === 2` while
  `keeperBonus(KEEPERS[i], quiet) === 0` for `i` in 0..2. This is the criterion that would fail if Kes
  were a re-skin.
- `inspector(KEEPERS[3], cast) !== inspector(KEEPERS[0], cast)` for a two-member cast holding one `quiet`
  and one `bright` dino.
- `canScan(KEEPERS[3]) === false`.
- `menuChips(800, 600, 4)` has 6 entries with ids `back, pick1..pick4, close`; `menuChips(800, 600, 3)`
  has 5 and no `pick4`; `menuChips(800, 600, 0)` has exactly `back, close`.
- **Geometry:** for `menuChips(375, 812, 4)`, every chip satisfies `x - w/2 >= 0` and `x + w/2 <= 375`.

**E2E — `tests/e2e/cycle-163-fourth-watcher.spec.ts`**

- Fresh save, press `K`: the dialog text contains `Kestrel of the Ninth Quiet` and `Quiet Company`.
- Press `4`: the confirm dialog names Kes and `a hundred million years downstream`; the scene's keeper id
  reads `kestrel`.
- Reload: the keeper id is still `kestrel`, and `__hasKeeperArt('kestrel')` is false (the amber-square
  fallback) while `__hasKeeperArt('vex-0')` is also false (the control, unchanged).
- Press `4` with no overlay open: nothing opens, nothing throws, the keeper id is unchanged.
- At a 375px viewport with touch enabled: with the picker open, a `[4]` chip is present and hit-resolves
  to `pick4`; with the **tone** menu open, no `pick4` chip is drawn.

### Risks

- **`menuChips`'s signature change is the only wide edit in this track.** It is called from two places in
  `WorldScene` and from its own unit tests. A `boolean` passed where a `number` is expected is truthy and
  would silently mean "1 option" — TypeScript catches it at the call sites, but the **test** files are the
  ones most likely to pass a stale `true`. Let `npm run build` be the arbiter; do not cast.
- **Do not widen the chip row unconditionally.** Four chips for the tone menu is a dead button and a
  criterion failure. The count must come from the open overlay.
- The 338px row at 375px leaves an 18px gutter. If the geometry assertion fails, **shrink the gap, not the
  chip** — 48x36 is the existing touch target and shrinking it is an accessibility regression.
- Existing keeper unit tests index `KEEPERS[0..2]`. If any of them needs an edit, stop: the append was not
  additive and something reordered the roster.

### Estimated touch count

~6 files (2 new, 4 modified, plus whichever touch unit test pins `menuChips`).

---

## Lore track — BACKLOG-160

**Item:** BACKLOG-160 [ai] Dinos address the observer — the shading half.

### Files to create

- `game/src/keeper/voice.ts` — the per-watcher first-impression register plus the two pure map helpers.
- `tests/unit/cycle-163-watcher-voice.test.ts` — the twelve lines, the unknown-id path, the no-traits
  path, the meeting map.
- `tests/unit/cycle-163-watcher-compose.test.ts` — `cannedReply` composition across all four registers and
  the back-compat byte-identity check.
- `tests/e2e/cycle-163-first-impression.spec.ts` — the reachable flow: first hello, second hello, switch
  observer, hello again.

### Files to modify

- `game/src/ai/brain.ts`
  - `NPCContext` — add `watcher?: string` with a doc comment naming BACKLOG-160 and stating that it is the
    keeper **id** and is set only on a dino's first hello under that observer.
  - `cannedReply` — after the base register `if/else` chain and **before** the `ctx.hungry` step, append
    `watcherAside(ctx.watcher, ctx.traits)`. Import from `../keeper/voice`.
  - The length-cap chain: today `hungry` slices at 240, `rattled` at 280, `provider` at 320. Introduce a
    single `WATCHER_ASIDE_MAX` in `voice.ts` (the longest authored line's length, asserted by a unit test
    so it cannot rot), slice the watcher step at `200 + WATCHER_ASIDE_MAX`, and **add
    `WATCHER_ASIDE_MAX` to each of 240 / 280 / 320**. Without this an existing long line starts truncating
    and no current test notices.
- `game/src/ai/webllmBrain.ts` — in `buildMessages`, beside the existing `ctx.keeperName` clause, add the
  watcher note so the model colours the same fact the canned path states. Pass the **line**, not the id.
- `game/src/scenes/WorldScene.ts`
  - New field `private metWatcher: Record<string, string> = {}`.
  - In the live greet inside `pickTone` (~8087, the call site that already carries `hungry` / `rattled` /
    `provider`): compute `const firstLook = firstMeeting(this.metWatcher, target.name, this.keeperId)`,
    pass `watcher: firstLook ? this.keeperId : undefined`, and on `firstLook` call
    `this.metWatcher = recordMeeting(this.metWatcher, target.name, this.keeperId)`.
  - **Do not** add `watcher` to `greetContextFor` (~6628). Its own doc comment says it is deliberately the
    reduced set shared by the prompt hook and the canned-line hook; the situational fields live at the
    live greet. Adding it there would also fire the aside in dino-to-dino ambient chatter, where a line
    addressed to the keeper makes no sense.
  - Save/restore: write `metWatcher` in the save payload and restore it on load (default `{}`).
  - Dev hook: `(window as any).__metWatcher = () => ({ ...this.metWatcher });`
- `game/src/world/saveGame.ts`
  - `SaveGame` — add `metWatcher: Record<string, string>` beside `lastTone` (line ~76).
  - The parse path — copy the `lastTone` block verbatim (lines ~294-304): absent is `{}`, non-object is a
    `return null`, string values only.
  - The build path (~line 999) — add `metWatcher` to the returned object and to the function's parameters
    alongside `lastTone`.

### Reuse list

- **`hungryAside` / `rattledAside` / `providerAside` / `tasteAside` (`game/src/ai/brain.ts`)** — the aside
  idiom. Copy the shape exactly: `PRICKLY_MAX` / `EFFUSIVE_MIN` three-way shading, a **leading space**, no
  traits gives the plain line. `watcherAside` must be recognisable as a sibling of these four.
- `PRICKLY_MAX` (0.4) and `EFFUSIVE_MIN` (0.6), exported from `brain.ts` — import them, do not re-declare
  the thresholds in `voice.ts`.
- `Personality` (`game/src/ai/personality.ts`) — the traits type.
- `KEEPERS` (`game/src/keeper/keepers.ts`) — **a unit test must assert that `voice.ts` has a note for every
  id in `KEEPERS`.** That is what stops the next roster entry shipping mute, which is exactly the failure
  this cycle is fixing for the *lines*.
- The `lastTone` save block (`game/src/world/saveGame.ts:294-304`) — the additive `Record<string,string>`
  template, validation included.
- `__bubbleTexts` (`WorldScene.ts:9289`) — the e2e's reader.

### New dependencies

none.

### Test plan

**Unit — `cycle-163-watcher-voice.test.ts`**

- For every id in `KEEPERS` and each of three temperaments (prickly `agreeableness: .2`, even `.5`, warm
  `.8`): the aside is non-empty and starts with `' '`. **Iterate `KEEPERS`, do not hard-code four ids** —
  the test is the guard against a fifth watcher shipping mute.
- Collect all `KEEPERS.length * 3` lines into a `Set` and assert the set size equals the line count — every
  line distinct.
- `watcherAside('vex-0', traits) === ''`.
- `watcherAside('aether', undefined) === watcherAside('aether', evenTraits)`.
- `WATCHER_ASIDE_MAX` equals the true maximum authored line length (compute it in the test from the same
  table; it must not be a hand-typed number that drifts).
- `firstMeeting({}, 'Rex', 'aether')` true; after `recordMeeting`, false for `'aether'` and true for
  `'kestrel'`; `recordMeeting` returns a **new** object and does not mutate its input.

**Unit — `cycle-163-watcher-compose.test.ts`**

- With `watcher: 'aether'`, `cannedReply` output ends with the aside for: affection 5 (generic), affection
  9 (fond), affection 0 (wistful), and a context with `gratitude` set.
- With `watcher` unset, the output for each of those four contexts is byte-identical to the same call
  before this change — pin the exact strings so a later edit to the register cannot pass silently.
- With `watcher` **and** `hungry`: both asides present, `indexOf(watcherAside) < indexOf(hungryAside)`.
- With `watcher`, `hungry`, `rattled` and `provider` all set: no substring is cut — assert each of the four
  asides appears in full.

**E2E — `cycle-163-first-impression.spec.ts`** (fresh save, no model — the deterministic floor)

- Greet a dino: the bubble contains that observer's aside.
- Greet the **same** dino again: count the occurrences of the aside across `__bubbleTexts` and assert it is
  exactly **1**. (Per the cycle-162 note: `__bubbleTexts` is the live list and an absence check passes for
  the wrong reason while the first bubble is still up.)
- Press `K`, pick a different observer, greet the same dino a third time: the **new** observer's aside is
  present and the old one's count is still 1.
- Two runs of a fresh save, one under observer 1 and one under observer 4, produce different first-hello
  asides — with zero friendship earned.
- `__metWatcher()` round-trips: after a greet and a reload it still names the observer met.

### Risks

- **The build order.** `voice.ts`'s table is keyed by roster id and the unit test iterates `KEEPERS`.
  Written before the structure track, the test passes with three entries and then reddens the moment Kes
  lands — which is the test doing its job, but it is a self-inflicted red. Build 212 first.
- **The length-cap chain is the silent hazard in this track.** Inserting an aside step without moving the
  240/280/320 caps truncates existing long replies, and no test in the repo today would fail. The
  four-asides-at-once unit test above is the guard; write it before the brain edit, not after.
- **Do not put the aside inside `fondGreeting`.** That is the eight-heart gate the design exists to escape
  and it would make the whole feature unreachable on a fresh save — the exact defect the cycle-162 verdict
  caught in the envy precedence table.
- `greetContextFor` is the reduced context on purpose. Adding `watcher` there leaks a keeper-addressed line
  into ambient dino-to-dino chatter.
- The e2e reaches the greet through the **tone menu** (`E` on a dino opens it), not directly. Drive the
  real door; do not assume the dev hook and the live path agree.
- `@mlc-ai/web-llm` must stay imported only under `game/src/ai/`. `keeper/voice.ts` imports two numeric
  constants from `ai/brain.ts` — that direction is fine (keeper depends on ai, as `scan.ts` already does
  via `moodFromTraits`), and `brain.ts` importing `keeper/voice` is likewise fine because neither pulls
  WebLLM. Grep after the build to confirm.

### Estimated touch count

~8 files (4 new, 4 modified).

---

## Cross-track collision check

| File | Structure track | Lore track | Order |
|---|---|---|---|
| `game/src/keeper/keepers.ts` | appends `KEEPERS[3]` | reads `KEEPERS` in a test; authors a note per id | **structure first** |
| `game/src/scenes/WorldScene.ts` | key binding, `numberedOptions()`, chip call sites | `metWatcher` field, live-greet context, save/restore, dev hook | disjoint regions; either order, but keep the two commits separate |
| `game/src/world/saveGame.ts` | untouched | `metWatcher` field | — |

**Combined estimate: ~14 files**, within the CHARTER v6 arc size. No split.
