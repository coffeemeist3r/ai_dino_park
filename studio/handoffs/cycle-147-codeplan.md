# Cycle 147 — Code Plan

Two tracks, sequenced **lore first** (per the design's constraint — 521 may touch `tic.ts` constants and
307 reads `signatureAxis` out of that file).

---

## Lore track — BACKLOG-307

### Prior art reused (checked before planning any new module)

| Need | Already exists | Where |
|---|---|---|
| Signature-axis pick (furthest from 0.5) | `signatureAxis(p): keyof Personality` | `game/src/world/tic.ts:50` |
| Same rule, glyph+label per pole | `fidget()` / `IDLE_QUIRKS` | `game/src/world/fidget.ts` |
| Trait axes + poles | `AXES`, `Personality` | `game/src/ai/personality.ts` |
| The murmur itself | `pickMurmurMemory`, `murmurLine` | `game/src/world/murmur.ts` |
| The sleep read | `isResting` (109), `isHuddling` | `WorldScene.ts:3324` / `:3349` |
| Book row + render | `BookRow`, `bookLines` | `game/src/ui/lenses.ts:185` / `:246` |
| Live row assembly | `bookRows()` | `WorldScene.ts:3758` |

**No new module.** `dreamWord` goes into the existing `murmur.ts` beside `murmurLine`; the axis pick is
imported from `tic.ts`'s `signatureAxis` rather than re-derived (the design's second criterion). `fidget.ts`
is *not* reused for the word because its map is glyph+label for an *awake* idle read; a dream is a different
register and sharing `IDLE_QUIRKS` would couple two unrelated readouts to one table. The **rule** is shared;
the **table** is not — that is the same split `tic.ts` already made when it took `signatureAxis` and kept
`TIC_BY_AXIS` of its own.

### Files

1. **`game/src/world/murmur.ts`** (edit)
   - `export const DREAM_BY_AXIS: Record<keyof Personality, { low: string; high: string }>` — ten distinct
     lowercase words, one per pole. Sketch (the Coder may re-word; distinctness and one-word-ness are the
     criteria): curiosity `high: 'elsewhere' / low: 'home'`, sociability `high: 'company' / low: 'quiet'`,
     energy `high: 'running' / low: 'warmth'`, agreeableness `high: 'sharing' / low: 'nobody'`, bravery
     `high: 'the-dark'` → must be one word, so `high: 'thunder' / low: 'hiding'`.
   - `export function dreamWord(p: Personality): string` — `signatureAxis(p)`, then the high pole at/above
     0.5, else low. One line of logic.
   - `murmurLine(memory: string | null, traits?: Personality): string` — memory branch unchanged; null
     memory + traits → `💭 …${dreamWord(traits)}…`; null memory + no traits → the existing `💭 …zzz…`.
   - `export function dreamBookLine(p: Personality): string` → `💭 dreams of ${dreamWord(p)}` so the wording
     lives beside the word (the `ticBookLine` pattern) and the scene does not build a string.

2. **`game/src/ui/lenses.ts`** (edit)
   - `BookRow.dream?: string` documented like `quirk`/`hours`.
   - `bookLines`: `if (r.dream) out.push('  ' + r.dream);` immediately after the `hours` push.

3. **`game/src/scenes/WorldScene.ts`** (edit — four touch points, all small)
   - import `dreamWord`/`dreamBookLine` from `../world/murmur`.
   - `pickMurmurer`: filter becomes `(this.isResting(d) || this.isHuddling(d)) && this.inView(d)`.
   - `maybeMurmur` + the two dev hooks (`__murmur`, `__forceMurmur`): pass `d.traits` as `murmurLine`'s
     second argument. `__forceMurmur`'s own `!this.isHuddling(d)` early-return becomes the same
     resting-or-huddling test — it is a second copy of the gate and must move with it.
   - `bookRows()`: `dream: dreamBookLine(d.traits)`.
   - Update the `MURMUR_CHANCE` comment and the `maybeMurmur` doc comment: they both say "huddling".

4. **`tests/unit/cycle-147-dream.test.ts`** (new) — `dreamWord` determinism from a seeded personality; both
   poles at 0.49/0.51 on one axis; all ten words distinct; `murmurLine` three branches (memory, null+traits,
   null+no-traits); `dreamBookLine` wording.

5. **`tests/unit/cycle-073-murmur.test.ts`** (edit, additive only) — one case asserting the memory branch is
   unchanged when traits are passed, so the byte-identical claim is pinned rather than assumed.

6. **`tests/unit/cycle-147-dream-book.test.ts`** or fold into the lenses spec (Coder's call) — `bookLines`
   renders the dream line after `hours` and omits it when absent.

7. **`tests/e2e/cycle-147-dream.spec.ts`** (new) — boot a fresh save, do **not** set the hour:
   `__forceMurmur('Rex')` is non-null and does not contain `zzz`; `__murmur` across the five founders has
   ≥3 distinct words; the book text contains `dreams of`.

### Test plan

`npx vitest run` for 4–6; the e2e in 7 is the reachability criterion and must run against the default
opening hour. Existing `cycle-073-murmur` specs must pass untouched — if one goes red the change is wrong.

### Risk

Widening the gate makes the murmur fire in daylight, where several e2e specs assert on bubbles/`__lastSound`
or count visible marks. Expect a handful of reds that are *assumption made explicit* rather than regressions
(the cycle-146 pattern). Repair by naming the hour or the dino in the spec, never by narrowing the gate back.

---

## Structure track — BACKLOG-521

### Files

1. **`game/src/world/relations.ts`** (new) — `RelationEntry { id; claim; holds() }`, `RELATION_REGISTER`,
   `brokenRelations()`. Module note carries 501's two rules restated for relations. Imports only the owning
   modules: `governance` (`WORK_BUILD_FLOOR`, `structureRecipe`), `bank` (`PILE_STEPS`), `resource`
   (`STOCKPILE_SOFT_CAP`, `STOCKPILE_CAP`), `fetch` (`FETCH_BOND_FLOOR`), `loner` (`LONER_FLOOR`), `traces`
   (`TRACE_FRESH_STEPS`), `tic` (the three `TIC_AFTER_STEPS*`), `spoilage` (`SPOIL_MARGIN`, `spoilsAtCap`),
   `foodstore` (`FOOD_STOCKPILE_CAP`), `granary` (`GRANARY_AFTER_STRUCTURES`, `GRANARY_FOOD_BONUS`),
   `huddle` (`HUDDLE_THRESHOLD`), `needs` (`NEED_THRESHOLD`, `STARVING`).
   - Entries planned (≥8; the six the design names, plus):
     - `STARVING` strictly above `NEED_THRESHOLD` — the 0.6–0.9 band `needs.ts` calls "where the whole of
       Milestone 5 lives"; if it closes, the pantry bails a dino out before it ever wears the 🍖.
     - `FETCH_BOND_FLOOR` at/below half `HUDDLE_THRESHOLD` — `fetch.ts` says "half a huddle" in words.
     - `GRANARY_FOOD_BONUS` positive against `FOOD_STOCKPILE_CAP` — a granary that lifts nothing is a
       structure with no effect, which is the dormancy shape this item exists for.
   - `SPOIL_MARGIN`'s entry asserts the *behaviour* the comment claims rather than the arithmetic: run
     `spoilsAtCap` down from `FOOD_STOCKPILE_CAP` and assert it settles at `cap - SPOIL_MARGIN - 1` and
     stops. Going through the production function is 501's rule 1.

2. **`game/src/world/relations.test.ts`** (new, colocated per `world/`'s convention) — walks
   `RELATION_REGISTER`, asserts `brokenRelations()` is empty, failing with `id` + `claim`; plus a guard that
   the register has at least the eight entries (so a future edit cannot shrink it to green).

3. **Comment edits, values untouched** — `bank.ts` (drop the restated `(6)`), `fetch.ts` (drop `(8)`),
   `traces.ts` (name the relation, drop the hardcoded product from the prose), `governance.ts` (point at the
   register), `foodstore.ts` (resolve the "mirrors `STOCKPILE_CAP`" claim — **it is false as written**: the
   food cap is 6 and the resource cap is 8, so the honest reading is that it mirrors the *pattern*, not the
   value; correct the wording and register the pattern claim only if it can be stated without a number).

### Blocker protocol (the design's hard rail)

If any planned `holds()` returns false on the current tree, **stop and write it here** before repairing, so
the finding is on the record separately from the fix. Same if deriving a constant yields a different number
than its literal.

### Test plan

`npx vitest run` (the walk plus the existing world suites — a broken relation should surface as *this*
test, not as somebody else's assertion). No e2e: the register is pure. The e2e cost of this track is only
whatever a repair changes, and a repair that changes e2e behaviour is the reachability answer.

### Sequencing

Land 307 (files 1–7) and get green, then 521. Only `world/tic.ts` is touched by both — 307 imports from it,
521 edits its constants' comments — so a 307-first order means no rebase of a feature onto renamed symbols.

---

## Shipped

_(the Coder fills this in)_
