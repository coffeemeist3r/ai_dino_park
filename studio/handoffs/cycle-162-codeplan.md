# Cycle 162 — Code Plan

Two tracks, no file shared between them except `WorldScene.ts`, and there in different rooms.

## Prior art checked before planning a line (CHARTER: Coder checks for prior art)

| need | reused, not written |
|---|---|
| lowest-of / tie-break | `topBy` (`homecoming.ts`) — its alpha last resort is copied, not re-invented |
| an ageing transient | `missedTrace` + `expireMissedTraces` (`WorldScene`), `sulkHasFaded` (`sulk.ts`) |
| a float over a dino | `showBubble` |
| a one-frame glyph | `flashFeed` |
| two rigs on one sprite | `refreshMissedMarks` (`missed` / `missed_aloof`) |
| a mark that degrades to text | `makeHourMark` |
| additive save block | the `palate` block (`saveGame.ts:948`) — shape check, unknown keys kept |
| memories as builders | `warmedMemory` / `refusedMemory` (BACKLOG-483's rule) |

---

## Lore track — BACKLOG-126

### New file — `game/src/world/envy.ts`

Pure, no Phaser. Constants `ENVY_POINTS_CEILING = 20`, `ENVY_WATCH_TILES = 5`,
`ENVY_FADES_AFTER_STEPS = 100`, `ENVY_GLYPH = '🥺'`. Exports `Watcher`, `enviousWitness`,
`envyHasFaded`, and five string builders (`envyMemory`, `envySawMemory`, `envyEventLine`,
`wistfulGreetLine`).

### `game/src/world/saveGame.ts`

- `SaveGame` gains `envy?: Record<string, { eater: string; at: number }>`.
- Parse block modelled on `palate`'s: reject a non-object, reject a non-string `eater` or a non-finite /
  negative `at`, keep unknown dino names (a save from a future roster is a save).
- Added to the returned object. **No `SAVE_VERSION` bump** — additive.

### `game/src/scenes/WorldScene.ts`

| site | change |
|---|---|
| field | `private envyPending: Record<string, { eater: string; at: number }> = {}` |
| `eatFood` tail | after the existing `logEvent`, before `saveGame`: `this.noteEnvy(d, r.favorite \|\| cameRound, kind!.label)` |
| new `noteEnvy` | builds `Watcher[]` from `this.dinos` in the eater's zone, excluding the eater; `tiles = Phaser.Math.Distance.Between(...) / TILE`; `points = this.friendship[n] ?? 0`. On a witness: two `remember` calls, `flashFeed`, `logEvent`, write `envyPending`. |
| new `takeEnvy(name): string \| null` | reads + deletes a live pending entry, returns the eater. One reader, two greet doors. |
| `recordGreet` / `recordTone` | last bubble checked, after repair/warm/lonely: `const envied = !repairing && !warming && !lonely ? this.takeEnvy(name) : null` then `showBubble(dino, wistfulGreetLine(name, envied))`. Points untouched. |
| new `expireEnvy()` | called beside `expireMissedTraces()` at line ~5572 |
| save / load | `envy` in and out, `this.envyPending = save.envy ?? {}` |
| dev hook | `__envy = () => ({ ...this.envyPending })` |

`cameRound` is already a local in `eatFood` (line 2925) and `r.favorite` a field of the reaction — the
whole "good dinner" test is `r.favorite || cameRound`, no new derivation.

### Tests — lore

- `game/src/world/envy.test.ts` — criteria 1–5, 13 (pure: selection, ceiling, `points < eaterPoints`,
  radius, empty, fade).
- `game/src/world/cycle-162-envy-save.test.ts` — criterion 14 (round-trip + an old save with no key +
  a corrupt `at`).
- `tests/e2e/cycle-162-envy.spec.ts` — criteria 6–12, 15. Drives `__dropFood(_, id)` + `__placeDino` +
  `__warpTo` + the real `E` greet key, reads `__events`, `__envy`, `__bookText`, `__hearts`.

### Harness traps to avoid (written down, per the cycle-161 precedent)

- The event log **rolls**; assert on `__envy` and the book, and read the ticker only right after the drop.
- `__setTrait` on `agreeableness` **moves the favorite** (cycle 161's trap). This spec never needs to
  move a favorite — it asks `__favoriteFood` what the favorite already is and drops that.
- The witness must be placed inside 5 tiles of the eater but not nearer the food than the eater, or it
  eats the meal instead. Place the eater on the food tile and the witness ~3 tiles away.

---

## Structure track — BACKLOG-551

### `game/src/world/needs.ts`

```ts
export const NEED_ART_KEY: Record<NeedKind, string> = { hunger: 'need_hunger', thirst: 'need_thirst' };
```

Declared beside `NEED_GLYPH` so key and glyph cannot drift.

### `game/src/scenes/WorldScene.ts`

- `needMarks: Array<Phaser.GameObjects.Text | Phaser.GameObjects.Image> = []`.
- Line 3717: `this.needMarks.push(this.makeHourMark(NEED_ART_KEY.hunger, NEED_GLYPH.hunger))`.
- Two cached textures beside `missedTex`: `needTex: Partial<Record<NeedKind, string | null>>`, baked in
  the same spawn tail with the same `??=` + `hasPropArt` guard.
- `refreshNeedMarks`: when a pressing need has a texture **and** the mark is an `Image`, `setTexture`;
  otherwise `setText(need ? NEED_GLYPH[need] : '')`. A `Text` never gets `setTexture` and an `Image`
  never gets `setText` — the `refreshMissedMarks` instanceof guard, same line.
- **Not touched:** the visibility gate, the `y - TILE * 1.7` offset, `pressingNeed`. Criterion 16 is a
  no-change claim and the diff has to make it obvious.

### `game/src/world/reachability.ts`

`worldPlacedProps()` adds `NEED_ART_KEY.hunger` / `NEED_ART_KEY.thirst`, imported rather than typed, with
the family comment ("hung over a dino rather than laid on the ground").

### Tests — structure

- `game/src/world/cycle-162-needmark.test.ts` — criterion 20 (both keys in the register, derived from
  `NEED_ART_KEY` so a rename cannot pass a stale literal).
- `tests/e2e/cycle-162-need-marks.spec.ts` — criteria 16, 17, 18, 19, 21 through `__marks` and a new
  `__markKind(name, family)` hook reporting `'text' | 'image'` plus the texture key. Criterion 22 is
  proven by the diff (`git diff --stat` shows no founding file).

### Order of work

Lore module + tests → structure (small, low risk) → build → vitest → kill-port + playwright.

## Blockers

None.
