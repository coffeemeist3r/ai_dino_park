# Cycle 122 — Code Plan

## Lore track — BACKLOG-347 (still full of the place it left)

### Prior art checked (reuse before adding)

| Need | Existing thing reused |
|---|---|
| "how long since it arrived" clock | `belonging.ts` `Tenure` / `tenureOf` (341) — already reset on every crossing, already bumped on the migration cadence. **No new counter.** |
| a per-dino small record | the `LeftDays` shape (362) — plain `Record<string,string>`, its own map, not a widened `SeenZones` |
| memory → next greeting | `remember` / `recall` → `recentMemory` → greet, unchanged |
| a floated bubble | `flashFeed(d, glyph)` (the tic/`performTic` path) |
| per-zone data as a row | the `ZONE_TERRAIN` / `ZONE_LINKS` table idiom |

### New file

`game/src/world/struck.ts` — pure, no Phaser, no `Math.random()`:

```
export type CameFrom = Record<string, string>
export const STRUCK_ROLLS = 2
export const KEEPSAKE: Record<string, string>        // bowl 🌾 · grove 🌿 · fernreach 🍂 · hollow 🌫
export function keepsakeGlyph(zoneId: string): string // default '🌿'
export function markCameFrom(map, name, zone): void
export function clearCameFrom(map, name): void
export function isStruck(rolls: number, from?: string): boolean
export const STRUCK_MARK = '🍃 still full of '
export function struckMemory(zoneName: string): string
export function struckLine(glyph: string): string
export function struckEvent(name, zoneName, glyph): string
export function struckBookLine(zoneName: string): string
```

**Deviation from the design, flagged:** the design listed a `struckFor(memories)` parse for the book line.
Dropped. The memory ring holds the struck memory long after the two-roll window, so a parse would leave
`just back from …` stuck on the dossier forever — the exact wart cycle 56 had to fix for spoken gratitude
(251). The book reads the live pair (`cameFrom[name]`, `tenureOf`) through `isStruck` instead, which is
both smaller and correct. Criterion 5 rewritten accordingly; criterion 11's "drops after" is now reachable.

### `WorldScene.ts` edits (7 sites)

1. Field: `private cameFrom: CameFrom = {}` beside `leftDays` (~line 497), with the same doc-comment style.
2. `crossDino` (~4888, beside the 362 `markLeft` pair): `markCameFrom(this.cameFrom, d.name, home)` and
   `this.memory = remember(this.memory, d.name, struckMemory(zoneById(home).name))`. No bubble here.
3. `relocate` (~5017, inside the existing `if (from !== destZoneId)`): the same `markCameFrom`.
4. `bumpTenures` (~4608): before the tenure bump, for each non-migrating dino, if
   `isStruck(tenureOf(this.tenure, d.name), this.cameFrom[d.name])` → `flashFeed(d, struckLine(glyph))`, and
   `logEvent(struckEvent(...))` **only on the first float** (guarded by a `struckTold: Set<string>`, cleared
   in `crossDino`/`relocate` — criterion 13 says one line, not one per float).
   Order matters: read tenure *before* `bumpTenure` so the first float happens on the roll after arrival.
5. `bookRows` (~2626, beside `yearn`): `struck: isStruck(...) ? struckBookLine(zoneById(from).name) : undefined`.
6. Dev hook (~4604): `__struck = (name) => { from, glyph } | null`.
7. Save (~5762) + load (~5853): `cameFrom: this.cameFrom` / `this.cameFrom = save.cameFrom ?? {}`.

### `saveGame.ts`

`cameFrom?: Record<string, string>` in the interface + a parse guard cloned from `pioneers` (string-valued
object, additive, absent → undefined). `SAVE_VERSION` unchanged.

### `ui/lenses.ts`

`BookRow.struck?: string` + one push line beside `r.yearn`.

### Tests

- `game/src/world/struck.test.ts` (unit, co-located like `yearning`'s): criteria 1–5, plus the negative pins
  — no `PLENTY_TOKEN`, no grove-news phrase, unknown zone → default glyph.
- `tests/unit/cycle-122-struck.test.ts`: the save round-trip (12) and the book row shape (11).
- `tests/e2e/cycle-122-struck.spec.ts`: driven crossing → memory (6), `__migrate` → `cameFrom` (7), a
  `__settleTick` → `__struck` non-null + bubble (8), two more ticks → null (9), homecoming not struck (10).
  Uses `__pauseAmbient` for the driven crossing (BACKLOG-456 discipline).

---

## Structure track — BACKLOG-475 (distance on the chain)

### New file

`game/src/world/distance.ts` — pure, derived from `ZONE_LINKS` only (no second table):

```
export function hopDistances(from: string): Record<string, number>   // BFS, from → 0
export function hopsBetween(a: string, b: string): number | null
export function hopToward(from: string, to: string): string | null
export function nearestQualifying(from, candidates, ok): string | null
```

Named `hopToward` — `movement.stepToward` is already imported into `WorldScene` and a second `stepToward`
would shadow it. BFS walks `zoneNeighbors(z)` in `ZONE_LINKS` order, so every result is deterministic
without a sort and without `Math.random()` (the 456 rule).

`hopToward(from, to)`: `null` if `from === to` or `hopsBetween` is null; else the first neighbour `n` with
`hopsBetween(n, to) === hopsBetween(from, to) - 1`. For an adjacent `to` this is `to` itself — the identity
that keeps every pre-475 call site byte-identical (criterion 4).

### `WorldScene.ts` edits (2 sites)

1. `plentyDestOf` (~4742): replace
   `return zoneNeighbors(home).some((l) => l.to === target) ? target : null;`
   with `return hopToward(home, target);`.
2. `yearnDestOf` (~4754): pass `ZONES.map((z) => z.id)` as `reachable` instead of
   `zoneNeighbors(home).map((l) => l.to)`, then `return dest ? hopToward(home, dest) : null`.
   `yearnedZone` already skips `home` itself, so no self-target can leak in.

**Predicted finding (verify, don't assume):** `yearnedZone` picks the ground left *longest* ago among the
candidates it is given. Widening the candidate set can therefore change which ground an *adjacent*-target
dino yearns for — if it left a far ground even earlier, the far one now wins and the dino steps toward it.
That is the item's intent, not a regression, but it means criterion 9 must be read precisely: the pin is
that a dino whose **only** stale ground is adjacent behaves identically. The cycle-121 specs seed exactly
one stale ground, so they should stay green — the Coder must confirm rather than assume, and if a 121 spec
does move, that is a REWORK-worthy signal, not a spec to edit.

### `ui/lenses.ts`

`zoneWant` widens from `zoneNeighbors(zone)` to every `ZONES` entry with a different crop, ranked
**nearest first**, then greater harvest, then chain order; `bestOut > 0` floor unchanged (criterion 12).
`ZoneWant` gains `hops?: number` for 477 to read later. `zoneMapModel` needs no change.

Ferry: `pickFoodCarry` is **untouched**. Its `wantId` may now name a far grower's crop, and the strict
`dest < src` rule still governs — criterion 13 covers it.

### Tests

- `game/src/world/distance.test.ts`: criteria 1–6.
- `tests/unit/cycle-122-distance.test.ts`: the `zoneWant` nearest-first rules (10–12) and the
  `pickFoodCarry` invariance (13).
- `tests/e2e/cycle-122-distance.spec.ts`: `__plentyDest` / `__yearnDest` two-hop stepping (7, 8) plus the
  adjacent-target pin (9) and the "destination is always a neighbour" assert (13/criterion 13-structure).

### Risk / blockers

- Both tracks touch `WorldScene.ts` but no shared method. `lenses.ts` is touched by both (a `BookRow` field
  vs. `zoneWant`) — different exports, no conflict.
- `zoneWant` is read on the lens *and* inside `crossDino`'s ferry. Widening it changes what a crossing dino
  may carry; that is the item ("food doesn't teleport" is served by the carry still being one hop).
- If widening `zoneWant` moves a pinned cycle-101/108 assertion, prefer narrowing the change (nearest-first
  only among *qualifying* growers) over editing a shipped spec.
