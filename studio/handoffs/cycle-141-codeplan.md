# Cycle 141 — Code Plan

Nine files, two of them new modules, one shared file (`WorldScene`) touched at opposite ends. No save
field, no `package.json` change, no import of `@mlc-ai/web-llm` outside `game/src/ai/`.

---

## Lore track — BACKLOG-300

**Reuse before writing:** `dinoActivity` / `Activity` / `ACTIVITY_GLYPH` (`world/activity.ts`, 295),
`hashSeed` (`ai/personality.ts`), the `[opener, aside, reply].filter(Boolean).join(' ')` composition and the
`activityById` map (both already in `WorldScene`), and the `ticAside` shape (`world/tic.ts`, 423). Nothing
new is invented that the park already has.

### `game/src/world/activity.ts` (edit)
- `ACTIVITY_ASIDES: Record<Activity, readonly string[]>` — two clauses per activity, `wandering: []`.
- `export function activityAside(activity: Activity, name: string): string | null`
  - `[]` → null (that is `wandering`, and any future activity deliberately left unvoiced).
  - else `variants[hashSeed(name) % variants.length]`.
- Import `hashSeed` from `../ai/personality`. (Pure module → pure module; `activity.ts` gains no Phaser and
  no brain import. `personality.ts` is not under the WebLLM boundary — it is trait maths.)

### `game/src/ai/brain.ts` (edit)
- `GreetContext.doing?: Activity` — imported as a type from `../world/activity`. Doc comment in the house
  style: set only when the dino was doing something nameable, absent → today's prompt exactly.

### `game/src/ai/webllmBrain.ts` (edit)
- One clause beside `interrupted`: `const doing = ctx.doing ? \`You were <clause> when the keeper walked up. \` : ''`
  spliced into the same template string. Absent → byte-identical prompt.

### `game/src/scenes/WorldScene.ts` (edit — greet path only, ~line 6485)
- `const doingNow = caught ? undefined : this.activityById[target.name];`
- Pass `doing: doingNow` in the `greet({...})` context literal, beside `interrupted`.
- `const aside = caught ? ticAside(this.ticFor(target).kind) : doingNow ? activityAside(doingNow, target.name) : null;`
  The composition line below is **unchanged** — it already filters null and single-spaces.
- `doingNow` is computed once and read three times, the same discipline 423 used for `ticFor`: the prompt,
  the aside and any future filing physically cannot name two different activities.

### `tests/unit/cycle-141-caught-in-the-act.test.ts` (new)
- L1: `activityAside('wandering', n)` null for a handful of names; every other `Activity` key returns a
  non-empty string (iterate the `ACTIVITY_GLYPH` keys so a future activity added without a clause fails
  here rather than shipping silent).
- L2: stable per name across repeated calls; at least one activity where two roster names differ.
- L5: the composition invariant, exercised as a pure join over every opener/aside/reply combination —
  single-spaced, no leading/trailing space.

### `tests/e2e/cycle-141-caught-in-the-act.spec.ts` (new)
- L3 + L6: `boot`, `__dropFood()`, poll `__activity(name)` across the roster until one reads `feeding`,
  `__pickTone(name, 'warm')`, assert that activity's clause is in the line and the other activities' clauses
  are not. Zero console errors.
- L4: `__inventTic(name)` then greet → the tic aside is present and **no** activity clause is (exactly one
  aside), which is the 423 spec's mirror.

---

## Structure track — BACKLOG-504

**Reuse before writing:** `pileTotal` (`world/resource.ts`), `zoneTileAt` / `zoneChain` (`world/zones.ts`),
`bakePropArt` / `hasPropArt` (`art/bake.ts`), the `drawGranary` sprite-or-glyph shape, and
`applyObjectVisibility` (the 308 render half). The bank is a fifth entry in a pattern the scene has four of.

### `game/src/world/bank.ts` (new, pure)
```ts
export const BANK_TILE = { tileX: 16, tileY: 11 } as const;
export const PILE_STEPS = [1, 2, 4] as const;   // total at/above which the heap reaches step 1 / 2 / 3
export type PileStep = 0 | 1 | 2 | 3;
export function pileStep(total: number): PileStep
export function pileArtKey(step: PileStep): string | null   // `pile_${step}`, null at 0
```

### `game/src/scenes/WorldScene.ts` (edit — pile/render path)
1. **The seam.** `private setPile(zone: string, pile: Stockpile): void { this.stockpileByZone[zone] = pile; this.syncBank(zone); }`
   Replace **every** `this.stockpileByZone[X] = Y;` assignment with `this.setPile(X, Y);` — lines 1459,
   1513, 1546, 1824, 1891, 2352, 2461, 2473, 4704, 4705, 4708, 4709, 6235, 6236, 6977. The two
   non-per-zone writes stay as they are and are followed by a full resync: the save-restore bulk assign
   (7331) and the save serialization read (7232, a read).
2. **The sprites.** `private bankSprites: Record<string, Phaser.GameObjects.Text | Phaser.GameObjects.Image> = {};`
   - `private syncBank(zone: string): void` — compute `pileStep(pileTotal(this.pileFor(zone)))`; create the
     sprite on first need at `BANK_TILE` (image from `bakePropArt(this, pileArtKey(step))` when
     `hasPropArt` says the rig exists, else a `Text` of the stone glyph repeated `step` times, depth 2);
     on later calls update the texture / text; `setVisible(step > 0 && zone === this.zoneId)`.
   - `private syncBanks(): void` — every zone in `zoneChain()`. Called once after scene setup and once
     after a save restore.
   - `applyObjectVisibility()` gains the one line that AND-gates each bank on `zone === this.zoneId`,
     beside the resource and plot loops it already runs.
3. **The hook.** `__bank = (z?: string) => ({ tile: BANK_TILE, step, total, visible })` for the active or
   named zone.

### `tests/unit/cycle-141-bank.test.ts` (new)
- S1: the `pileStep` table, including 0, both step boundaries, and a value above `STOCKPILE_CAP`.
- S2: `zoneTileAt(z, BANK_TILE.tileX, BANK_TILE.tileY, 20, 15) === 'grass'` for every `zoneChain()` ground —
  the invariant, not a comment. Also asserts the bank tile is not the bowl huddle tile, the founding ruin,
  or any pinned water/landmark tile the park already fixes.
- S3: `pileArtKey` over all four steps.
- **The reachability pin** (the twin of cycle 136's): `pileStep(pileTotal(FOUNDING_PILES[GROVE_ID]))` is
  `>= 1` **and** `pileStep(total - REPAIR_COST)` is strictly less than it. If a later tuning pass makes the
  founding mend invisible, this test says so out loud.

### `tests/e2e/cycle-141-bank.spec.ts` (new)
- S4: fresh boot → `__bank('grove').step === 2`, `__bank('bowl').step === 0`.
- S5: `__setZonePile('bowl', {stone: 1})` → step 1 and visible while standing in the bowl; back to `{}` →
  step 0 and hidden. (Goes through `setPile`, which is the point — the hook is one of the fifteen sites.)
- S6: the founding-mend drop, driven exactly as `cycle-136-mending.spec.ts` drives it (`__setZone('grove')`,
  `__runUpkeep`, `__stepMend` loop) → the Grove's bank goes 2 → 1.
- S7: standing in the bowl, the grove's bank sprite is not visible.
- Zero console errors on every test.

---

## Order of work
1. `world/bank.ts` + its unit test (pure, no scene).
2. `world/activity.ts` + its unit test (pure, no scene).
3. `brain.ts` / `webllmBrain.ts` context.
4. `WorldScene` — the `setPile` seam first (mechanical, all 15 sites, `npm run build` between), then the
   sprites, then the greet path.
5. Both e2e specs.
6. Gates: `npm run build`, `npx vitest run`, `npx --yes kill-port 5173`, `npx playwright test`.

## Blockers
_(none — filled by the Coder if a gate fails.)_
