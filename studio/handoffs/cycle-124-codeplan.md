# Cycle 124 — Code Plan

Two tracks, no shared files. Build order does not matter; the structure track is the smaller diff, so build
it first and keep the lore track's WorldScene edits in one pass afterwards.

---

## Lore track — BACKLOG-360 (pond pilgrimage)

### Prior art to reuse (checked before adding anything)

| Need | Already exists | Where |
|---|---|---|
| the pond-swap record | `pondSwapMemory(other)` → `🌿 traded pond stories with <name>` | `world/groveword.ts` |
| reading a dino's ring | `recall(store, name)` | `ai/memory.ts` |
| filing a memory | `remember(store, name, line)` | `ai/memory.ts` |
| starting a crossing | `startMigration(d, dest)` (fixes dest + edge, marks migrating) | `WorldScene.ts` |
| the destination in flight | `this.migrationCross[name].dest` | `WorldScene.ts` |
| the bond bump | `strengthen(bonds, a, b, n)` | `social/bonds.ts` (as used by `pondSwapBeat`) |
| a floated line | `showBubble(d, line)` | `WorldScene.ts` |
| a ticker line | `logEvent(text)` | `WorldScene.ts` |
| who lives where | `zoneOf(this.dinoZones, name, BOWL_ID)` | `world/zones.ts` |

No new dependency, no new persisted field, no new save version.

### Files

**New — `game/src/world/together.ts`** (pure, no Phaser):

- `export const TOGETHER_BOND = 2;` — the road's bond, deliberately below `POND_BOND` (3): going somewhere
  together is a smaller beat than discovering you both know it.
- `export function togetherMemory(other: string, zoneName: string): string` →
  `` `🐾 went back to ${zoneName} with ${other}` `` — names both facts the arc cares about, and is distinct
  from every existing crossing memory (`struckMemory`, `homesickMemory`, `yearnMemory`, `courierMemory`).
- `export function togetherLine(): string` — the companion's bubble.
- `export function togetherEvent(a: string, b: string, zoneName: string): string` — the ticker line, naming
  both dinos and the ground.
- `export function pondCompanion(leaderMemories: readonly string[], candidates: readonly string[]): string | null`
  — the first candidate whose `pondSwapMemory(candidate)` the leader carries. First-in-order, no
  `Math.random` (BACKLOG-456 discipline: a random pick in a pickable set is the flake shape).
- `export function travelsTogether(dest: string, sharedZone: string, leaderMemories, candidates): string | null`
  — `dest === sharedZone ? pondCompanion(...) : null`. The shared ground is a **parameter**, not a constant,
  so a second shared-place bond is a caller change; the caller passes `GROVE_ID` because 346 records exactly
  one place.

**New — `game/src/world/together.test.ts`**: the pure half of every acceptance criterion — the pair read,
its determinism with two eligible companions, the non-matching destination, the no-memory leader, and that
the memory/event strings name both the other dino and the ground.

**Edit — `game/src/scenes/WorldScene.ts`** (one import line + one private method + two call sites + one hook):

1. import `travelsTogether, togetherMemory, togetherLine, togetherEvent, TOGETHER_BOND` from `../world/together`.
2. `private tryTogether(leader: Dino): string | null` — reads `this.migrationCross[leader.name]` for the
   destination (so it can only fire *after* a crossing has been started), builds the candidate list as
   *other dinos, not migrating, same home zone as the leader*, calls `travelsTogether(cross.dest, GROVE_ID,
   recall(this.memory, leader.name), candidates)`, and on a hit: `startMigration(companion, cross.dest)`,
   a `togetherMemory` on each of the two, `strengthen(this.bonds, leader, companion, TOGETHER_BOND)`,
   `showBubble` on the companion, `logEvent(togetherEvent(...))`. Returns the companion name or `null`.
3. Call it at the **tail of `scarcityMigrate`** (after its `startMigration`) and at the **tail of
   `tryHomesick`** (after its `startMigration`, before the `return true`). Not in `maybeMigrate`: the dev
   hooks `__maybeMigrate` / `__homesickMigrate` call these two directly, and production and test must walk
   the identical path.
4. dev hook `(window as any).__together = (name: string) => { const d = this.dinoByName(name); return d ? this.tryTogether(d) : null; };`
   so an e2e can drive the pull deterministically after `__startMigrationTo(name, 'grove')`.

**New — `tests/e2e/cycle-124-together.spec.ts`**: seed the pair (`__migrate` both to the grove and back to
the bowl so both are grove-visited, then `__pondSwap(a, b)`), start `a` toward the grove with
`__startMigrationTo`, call `__together('a')`, then assert: the returned companion is `b`, `__migrating()`
contains both, `__memory` of each contains the together line, the bond rose, and the ticker carries the
event. Plus the inert control: on a freshly booted park, `__startMigrationTo` + `__together` for every dino
returns `null` for all of them.

### Risk, and how it is contained

The one real risk is a pinned migration spec moving because a second dino now crosses on a roll where one
used to. Every gate is strict and conjunctive — a pond-swap memory (which needs both dinos grove-visited
*and* met back home), the same origin zone, the companion not already migrating, and `dest === grove`. On a
fresh save no dino has ever crossed, so the beat cannot fire. **If any pinned migration spec moves, the
gate is wrong and the spec must not be amended** — same rule 476 shipped under last cycle, and it held.

---

## Structure track — BACKLOG-477 (both of the ground's calls, on the lens)

### Files

**Edit — `game/src/world/governance.ts`** (append; nothing existing is changed):

```ts
export interface GovernanceOption { value: string; glyph: string; meaning: string }
export interface GovernanceCall { name: string; options: readonly GovernanceOption[] }
export const UNSET_GLYPH = '·';
export const SPEND_CALL: GovernanceCall = { name: 'pantry', options: [...] };  // 🍽️ / 🏦
export const WORK_CALL:  GovernanceCall = { name: 'labour', options: [...] };  // 🧺 / 🧱
export const GOVERNANCE_CALLS: readonly GovernanceCall[] = [SPEND_CALL, WORK_CALL];
export function governanceLine(values: ReadonlyArray<string | null | undefined>): string
export function governanceLegend(): string[]
```

`governanceLine` returns `''` when every value is null/absent, and otherwise the per-call glyph or
`UNSET_GLYPH`, joined — so a partly-decided ground keeps both positions. Both functions iterate
`GOVERNANCE_CALLS`; a third call is a new entry and no function body changes.

`spendGlyph`/`workGlyph` keep their bodies (their unit tests must pass unamended). The descriptors carry the
same glyph literals; a unit test pins the two against each other so they cannot drift.

**Edit — `game/src/world/governance.test.ts`**: append a `describe` for the table, the folded line (both
set / one set / none set / table order), and the legend covering all four glyphs plus the placeholder.

**Edit — `game/src/ui/controlsHelp.ts`**: `helpLines()` appends `['', ...governanceLegend()]` after the
controls rows. Imports from `world/governance` (both pure). The controls rows themselves are untouched.

**Edit — `tests/unit/…` (controls help)**: if a help-lines test exists it gains a case that the panel text
contains the legend; otherwise the coverage lands in `governance.test.ts` and the e2e.

**Edit — `game/src/scenes/WorldScene.ts`** (`drawZoneMap` + two dev hooks):

1. Drop `${e.spend ? …}${e.work ? …}` from the prosperity line.
2. After the prosperity line, `const gov = governanceLine([e.spend, e.work]); if (gov) txt += '\n' + gov;`
   — placed before the `want` line so governance sits with the tier it shapes.
3. `boxH` 92 → 104 (one line at the panel's line height). Four boxes at 118 wide are unchanged
   horizontally, so nothing overflows.
4. dev hooks: `__zoneMapText = () => this.mapLabels.map((t) => t.text)` (proves the **rendered** line, not
   the model) and `__helpText = () => this.helpPanel.text`.

**New — `tests/e2e/cycle-124-governance-lens.spec.ts`**: a fresh park's box texts contain no governance row;
after driving a provider onto the bowl (the cycle-117 spec's `harvestBowl` × 3 recipe) the bowl's box text
contains the folded row and its prosperity line no longer ends with the governance glyphs; and the `[?]`
panel text contains both the controls rows and every legend glyph.

### Reuse note

Nothing new is invented here — the glyphs, the enums, the `null` seam and the panel renderer all exist. The
diff is a table plus two derivations off it, which is the whole point of the item.

---

## Test plan

- `npm run build` (in `game/`) — type-check clean.
- `npx vitest run` **from the repo root** — the root config includes `tests/unit/**` *and* `game/src/**`;
  running from `game/` finds only a fraction of the suite.
- `npx --yes kill-port 5173` then `npx playwright test` — full e2e.
- Watch specifically: `cycle-076-news-pull`, `cycle-077-carry`, `cycle-078-*`, `cycle-097-carry-pressure`,
  `cycle-123-capacity` (the pinned migration set), and `cycle-117-spend-lens` / `cycle-121-work-priority`
  (the pinned lens set). None may be amended.
