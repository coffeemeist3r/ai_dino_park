# Cycle 165 — Code Plan

## Lore track — BACKLOG-156

### Prior art checked before writing anything (CHARTER: reuse before adding)

| Need | Already exists | Decision |
|---|---|---|
| Deterministic seeded RNG | `ai/personality.ts` `hashSeed` + `mulberry32` | import |
| Length cap + word-boundary trim | `ai/persona.ts` `PERSONA_MAX`, `fromPersonaDraft` | import, do not restate |
| Generate-once guard | `ai/persona.ts` `upgradePersona` | import |
| Persona record shape | `keeper/record.ts` `KeeperPersona {text, source}` | import; it was written to match `Persona` |
| Park canon string | `ai/persona.ts` `PARK_LORE` | compose, do not re-author |
| Cache slot in the save | `KeeperRecord.persona` (555, shipped empty) | fill it; **no save migration needed** |
| Switch semantics | `record.ts` `switchTo` already drops the persona | rely on it; do not re-decide |
| Ambient-inference gate | `allowAmbient` (used by `ensurePersona`) | import |

Net new code is therefore: four authored tables, one composition function, one line-builder, one
prompt builder, one optional brain method, one scene method, one dialog string.

### Files

1. **`game/src/keeper/persona.ts`** — NEW (pure).
   - `KEEPER_LORE`: `` `${PARK_LORE} ` `` + the watcher's side (outside the glass, arrived from another
     time, cannot enter, only watch and feed).
   - `HABITS`, `STUDIES`, `NOTES` — three tables of 8 (the `ai/persona.ts` table size).
   - `proceduralKeeperPersona(keeper: Keeper): KeeperPersona` —
     `mulberry32(hashSeed(`${keeper.id}#keeperpersona`))`, picks one from each table, opens with
     `keeper.backstory` **verbatim**, closes on the note. `.slice(0, PERSONA_MAX)`,
     `source: 'procedural'`.
   - `keeperIntroLines(keeper: Keeper, persona: KeeperPersona): string[]` — the three dialog lines.
   - Re-export nothing; callers import `fromPersonaDraft` / `upgradePersona` from `ai/persona.ts`.

2. **`game/src/ai/brain.ts`** — add optional `authorKeeper?(ctx: KeeperAuthorContext)` and the
   `KeeperAuthorContext` interface (structural: `{ name, era, backstory, ability }`, no `keeper/`
   import — the dependency edge would point the wrong way through the boundary file).

3. **`game/src/ai/webllmBrain.ts`** — `buildKeeperPersonaMessages(ctx)` (pure, exported, sibling of
   `buildPersonaMessages`, uses `KEEPER_LORE`… **no**: `KEEPER_LORE` lives in `keeper/`, so the prompt
   builder takes the lore string as a parameter and the scene passes it. Keeps `ai/` free of a
   `keeper/` import in both files, one rule not two) and an `authorKeeper` on the brain object that
   runs it through the same chat path `author` uses.

4. **`game/src/scenes/WorldScene.ts`**
   - `ensureKeeperPersona(): KeeperPersona` — the `ensurePersona` shape, caching into
     `this.keeperRecord.persona`.
   - `pickKeeperIndex`: after the record is updated, `dialog.show(keeperIntroLines(...).join('\n'))`.
     **Ordering matters:** `switchTo` runs first (it clears the persona), *then* `ensureKeeperPersona`
     authors for the newly worn observer. Reversed, a switch would show you the outgoing self.
   - Dev hook: `__keeperPersona()` — reads the cached record slot (the `__personas` idiom).

5. **`tests/unit/cycle-165-keeper-persona.test.ts`** — L1–L7.
6. **`tests/e2e/cycle-165-keeper-persona.spec.ts`** — L8–L11, declaring `foundingState(page, 'as-shipped')`
   (the new spec obeys the rule the structure track ships in the same cycle — if it did not, that
   would be the whole item failing on its first night).
7. **`tests/unit/`** save round-trip L12 — extend the existing keeper-record save test rather than
   adding a file.

### Risk noted up front

`pickKeeperIndex` currently calls `void this.saveGame()` after showing the dialog. `ensureKeeperPersona`
writes `this.keeperRecord.persona` **synchronously** (the procedural floor is not async), so the save
that follows carries it. The async LLM upgrade lands whenever it lands and rides the next hourly save —
the same contract `ensurePersona` has had since 103. No new save timing.

---

## Structure track — BACKLOG-533

### Files

1. **`game/src/world/expiry.ts`** — add `SULK_GLYPH = '😒'` and `SULK_ART_KEY = 'sulk'`.
   `world/fidget.ts` currently owns a private `MOOD_GLYPH = { sulk: '😒', cold: '🥶' }`; change its
   `sulk` entry to reference the exported constant so the glyph has **one** definition. (Two literals
   of the same emoji in two modules is exactly how a rig and a fallback drift apart.)

2. **`game/src/scenes/WorldScene.ts`**
   - `private sulkMarks: Array<Text | Image> = []`.
   - `spawnDino`: `this.sulkMarks.push(this.makeHourMark(SULK_ART_KEY, SULK_GLYPH))`.
   - `refreshSulkMarks()` — called from the same place `refreshMopeMarks` is (the cold-mark tail):
     visible when `inFunk(this.funks, d.name) && !this.coldPending.has(d.name) && this.inView(d)`,
     positioned at `d.y - TILE * 1.4`.
   - `__marks` families array gains `['sulk', this.sulkMarks]`.
   - `__markKind`'s lookup gains `sulk` (and its union type widens to `'need' | 'mope' | 'sulk'`) —
     this is the hook that proves a host is *wired*, which is the entire point of the rider.

3. **`game/src/world/reachability.ts`** — `worldPlacedProps()` adds `SULK_ART_KEY`.

4. **`tests/unit/cycle-165-founding-declaration.test.ts`** — NEW. The ratchet.
   - `declaresFounding(source: string): boolean` — exported predicate, so S3/S4 test the rule on
     synthetic strings rather than by committing a deliberately bad spec.
   - `BASELINE: readonly string[]` — the undeclared files, alphabetical.
   - Three assertions: baseline length is the literal count; every non-baseline spec declares; every
     baseline spec still does not.

5. **`tests/e2e/cycle-165-sulk-mark.spec.ts`** — S9–S11, using the existing `__funk`/`__marks` hooks
   (check what 544 exposed; add a `__enterFunk` dev hook only if none exists).

### Order of work

Structure part B first (it touches `spawnDino` and the mark registries, which the lore track does not
touch at all), then the lint, then the lore track. Build + `vitest` after each part, so a red is
attributable to one part.
