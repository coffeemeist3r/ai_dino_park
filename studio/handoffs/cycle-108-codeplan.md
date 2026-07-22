# Cycle 108 — Code Plan

Two tracks, one shared file (`WorldScene.ts`) in two disjoint regions. **Build order: structure first, then
lore** — the structure track's `world/zones.ts` rewrite is the larger, riskier diff and touches only
`drawFloor` + one import line in the scene; landing it first keeps the lore diff readable on top.

---

## Structure track — BACKLOG-449 (One terrain per zone, as data)

**Item:** BACKLOG-449 [infra] One terrain per zone, as data — per-zone terrain descriptor on the `ZONES`
table; `zoneTileAt` / `zoneWaterTile` / `zoneTint` read it generically.

### Files to create

- `tests/unit/cycle-108-terrain-table.test.ts` — the new table-driven invariant + fourth-zone test.

That's it. **No new module.** The descriptors live beside `ZONES` / `ZONE_LINKS` in `world/zones.ts`, per the
design constraint ("do not add a module for three rows").

### Files to modify

| File | What changes |
|---|---|
| `game/src/world/zones.ts` | Add `ZoneTerrain` interface + `ZONE_TERRAIN` table; rewrite `zoneTileAt`, `zoneWaterTile`, `zoneTint` as table lookups; keep all six per-zone functions exported unchanged. |
| `game/src/scenes/WorldScene.ts` | Nothing functional — only the `../world/zones` import line if a symbol name moves. `drawFloor` and `needTargetFor` already go through the dispatchers and must not be touched. |

### The shape (so the Coder makes no design decisions)

```ts
export interface ZoneTerrain {
  /** (x,y) → tile kind over a cols×rows grid. Pure. */
  tileAt: (x: number, y: number, cols: number, rows: number) => TileKind;
  /** Multiplicative floor tint (0xffffff = untinted). */
  tint: number;
  /** The tile a thirsty resident walks to, or undefined for a zone with no water.
   *  Pinned to `tileAt` by the table-driven invariant test — never by a comment. */
  water?: (cols: number, rows: number) => { tileX: number; tileY: number };
}

export const ZONE_TERRAIN: Record<string, ZoneTerrain> = {
  [BOWL_ID]:      { tileAt: bowlTileAt,      tint: 0xffffff,        water: () => bowlPondTile() },
  [GROVE_ID]:     { tileAt: groveTileAt,     tint: GROVE_TINT,      water: (cols) => grovePondTile(cols) },
  [FERNREACH_ID]: { tileAt: fernreachTileAt, tint: FERNREACH_TINT,  water: (_c, rows) => fernreachCreekTile(rows) },
};
```

The three dispatchers then read the table and keep their **exact current signatures and return types**:

- `zoneTileAt(zoneId, x, y, cols, rows)` → `ZONE_TERRAIN[zoneId]?.tileAt(...) ?? null`
- `zoneWaterTile(zoneId, cols, rows)` → `ZONE_TERRAIN[zoneId]?.water?.(cols, rows) ?? null`
- `zoneTint(zoneId)` → `ZONE_TERRAIN[zoneId]?.tint ?? 0xffffff`

The `water` arrow-wrapping is deliberate: the three landmark helpers take *different* argument subsets
(`grovePondTile(cols)`, `bowlPondTile()`, `fernreachCreekTile(rows)`), and normalizing them to one
`(cols, rows)` signature at the table is a smaller, safer change than editing three exported functions that
four test files import.

**Declaration-order gotcha:** `ZONE_TERRAIN` is a `const` referencing `bowlTileAt` etc. Function
declarations hoist, so a table declared above them still works — but put the table **after** the six
functions anyway. It reads in dependency order and sidesteps any TDZ question about `GROVE_TINT` /
`FERNREACH_TINT`, which are `const`s and do **not** hoist.

### Reuse list (MUST reuse, not reinvent)

- `game/src/world/zones.ts` — `ZONES`, `ZONE_LINKS` are the *precedent pattern* (cycle 383). Match their
  shape and their comment style; this is the same refactor applied to ground.
- `groveTileAt` / `fernreachTileAt` / `bowlTileAt` — keep as-is, they become the table's `tileAt` values.
  Do **not** rewrite the layout rules; a rewritten rule is how byte-identical dies.
- `grovePondTile` / `bowlPondTile` / `fernreachCreekTile` — keep as-is, wrapped by the table.
- `GROVE_TINT` / `FERNREACH_TINT` — already exported constants; the table references them.
- `atWater`, `drawFloor`, `needTargetFor` — already generic through the dispatchers. **Do not touch.**
  They are the proof the refactor works.

### New dependencies

`none`.

### Test plan

**Unit — `tests/unit/cycle-108-terrain-table.test.ts`:**
- *Full-sweep regression:* for each of bowl / grove / Fernreach, sweep every `(x, y)` in `COLS × ROWS` and
  assert `zoneTileAt(zone, x, y)` equals the zone's own direct `*TileAt(x, y)` — pins the dispatcher to the
  rules for every tile, not a spot check.
- *Landmark invariant (table-driven):* `for (const [id, t] of Object.entries(ZONE_TERRAIN))` — if `t.water`
  is defined, assert `t.tileAt(...t.water(COLS, ROWS), COLS, ROWS) === 'water'`. **This is the test that
  replaces the "kept in sync with" comments.** It must iterate the table, not name three zones, so a fourth
  row is covered the day it is added.
- *Landmark values unchanged:* `zoneWaterTile` returns exactly `{3,2}` (bowl), `{COLS-3,3}` (grove),
  `{3,floor(ROWS/2)}` (Fernreach).
- *Tint values unchanged:* `zoneTint` returns `0xffffff` / `GROVE_TINT` / `FERNREACH_TINT`.
- *Unknown-zone escape hatch:* `zoneTileAt('nope', …) === null`, `zoneWaterTile('nope', …) === null`,
  `zoneTint('nope') === 0xffffff`.
- *The fourth zone (the acceptance test):* register a test-only descriptor into `ZONE_TERRAIN` inside the
  test (restore in `afterEach` so it can't leak into sibling tests) and assert it gets terrain, tint, a
  landmark, and a working `atWater` — with **zero** production edits. Use a rule trivially distinct from the
  three real ones (e.g. water where `x < 2`) so a stale-lookup bug can't accidentally pass.

**Unit — unchanged, must stay green *unmodified*:** `cycle-067-grove-terrain`, `cycle-086-fernreach-terrain`,
`cycle-079-pondsight`, `cycle-079-grove-plot`. If the Coder finds itself editing any of these, the refactor
has broken source compatibility and the approach is wrong — stop and fix the production side.

**E2E — no new spec.** This ships zero player-visible change by design; the proof is that
`cycle-067-path-water-art` and `cycle-086-fernreach-terrain` stay green unmodified. Adding an e2e for a
no-op refactor is test theater.

### Risks

- **Silent behavior drift is the whole risk.** The full-sweep regression is the mitigation — write it
  *first*, run it against the pre-refactor code (it should pass), then refactor and re-run.
- `world/arrival.ts` imports `groveTileAt` directly and is *deliberately* grove-pinned (its comment explains
  why widening it would retro-fire a once-ever beat, 359/346). **Do not route it through the table.**
- `plot.ts` mentions `fernreachTileAt` in a comment only — no code change needed there.
- The `water?` field is optional so a future waterless zone is expressible; the three real zones all have
  one, so no current caller sees the `undefined` branch except the unknown-id path.

### Estimated touch count

`~3 files` (1 rewritten module, 1 new test, ~1 import line).

---

## Lore track — BACKLOG-453 (Word of the provider)

**Item:** BACKLOG-453 [social] Word of the provider — a dino names the pantry-keeper in gossip/greeting.

### Files to create

- `game/src/world/providerword.ts` — the gossip rung. Modeled **directly** on `world/groveword.ts`.
- `tests/unit/cycle-108-provider-word.test.ts` — the pure logic.
- `tests/e2e/cycle-108-provider-word.spec.ts` — the greeting + the meet beat in the running game.

### Files to modify

| File | What changes |
|---|---|
| `game/src/ai/roles.ts` | Add `zoneProvider(residents, zoneId)` — pure, beside `deriveRole`. |
| `game/src/ai/brain.ts` | `NPCContext.provider?: { name: string; zoneName: string }`; add `providerAside(name, zoneName, traits)`; compose it in `cannedReply` **after** the rattled aside. |
| `game/src/ai/webllmBrain.ts` | One prompt clause in `buildMessages`, mirroring the 368/440 clauses. |
| `game/src/scenes/WorldScene.ts` | Private `providerFor(zoneId)` helper; pass `provider` into the `pickTone` greet context; add the `spreadProviderWord` rung + 🧺 ticker line in `converse`; two dev hooks. |

### The shape

**`ai/roles.ts`:**
```ts
export interface ProviderCandidate { name: string; zoneId: string; role: Role; foodBanked: number }

/** Of the dinos living in `zoneId`, the one keeping its pantry full: the highest-tally settled `provider`.
 *  Ties resolve alphabetically so the read is deterministic. null when the zone has no provider. */
export function zoneProvider(residents: readonly ProviderCandidate[], zoneId: string): string | null
```
Sort: `foodBanked` descending, then `name` ascending. Take `[0]?.name ?? null`. Filter on
`r.zoneId === zoneId && r.role === 'provider'`.

**`ai/brain.ts` — `providerAside(providerName, zoneName, traits)`**, three branches on the *existing*
`PRICKLY_MAX` / `EFFUSIVE_MIN` cutoffs, each leading with a space so it appends cleanly (copy the
`hungryAside` / `rattledAside` contract exactly). **No leading article before `zoneName`** — `The Grove`
already carries its own; `storesFedLine` documents this trap. Compose in `cannedReply`:
```ts
if (ctx.provider) reply = { ...reply, text: (reply.text + providerAside(ctx.provider.name, ctx.provider.zoneName, ctx.traits)).slice(0, 320) };
```
placed after the `ctx.rattled` block. Note the cap climbs 280 → 320 to make room for the third composable
aside; keep the existing caps on the earlier lines untouched.

**`world/providerword.ts`** — same five-part shape as `groveword.ts`:
```ts
export function providerWordLine(speaker: string, provider: string, zoneName: string): string;   // carries RUMOR_MARK
export function spreadProviderWord(
  store: MemoryStore, speaker: string, listener: string,
  provider: string | null, zoneName: string,
): { store: MemoryStore; rumor: string | null };
```
Returns `{ rumor: null }` unchanged when `speaker === listener`, `!provider`, or `speaker === provider`
(**the no-self-praise rule — enforce it here, in the pure layer, not in the scene**). Otherwise
`remember(store, listener, rumor)`.

Unlike the other rungs this one keys off **live state** (the role table) rather than a memory token, so the
provider is passed in as an argument — that keeps the module pure and Node-testable with no import of the
scene or the roles store.

**`WorldScene.ts`:**
- `private providerFor(zoneId: string): string | null` — build `ProviderCandidate[]` from `this.dinos` using
  the *existing* `zoneOf(this.dinoZones, d.name, BOWL_ID)`, `this.roleOf(d.name)`, and
  `this.foodBanked[d.name] ?? 0`, then call `zoneProvider`. Note `roleOf` settles+persists as a side effect,
  which is already true of every other call site — do not add a second derivation path.
- In `pickTone`, add to the greet context:
  ```ts
  provider: (() => { const z = zoneOf(this.dinoZones, target.name, BOWL_ID); const p = this.providerFor(z);
                     return p && p !== target.name ? { name: p, zoneName: zoneById(z).name } : undefined; })(),
  ```
  The `p !== target.name` guard is the greeting half of the no-self-praise rule.
- In `converse`, add the rung **between** `grove` and `gossip`:
  ```ts
  const zone = zoneOf(this.dinoZones, a.name, BOWL_ID);
  const prov = grove.rumor ? null : this.providerFor(zone);
  const pword = grove.rumor ? grove : spreadProviderWord(this.memory, a.name, b.name, prov, zoneById(zone).name);
  const gossip = pword.rumor ? pword : spreadGossip(this.memory, a.name, b.name);
  ```
  and the matching `else if (pword.rumor) this.logEvent(...)` line with a 🧺, inserted in the same cascade
  order as the assignment chain (the existing comment block explicitly says the log order tracks the
  cascade order — keep that true). Guarding `providerFor` behind `grove.rumor` avoids a wasted role
  derivation on every meet where an earlier rung already won.
- Dev hooks beside the existing ones: `__spreadProviderWord(a, b)` (mirror `__spreadGroveWord` at ~2488) and
  `__zoneProvider(zone)`.

**`ai/webllmBrain.ts`:** one clause next to `rattled`, ending with the standard "the canned fallback carries
the deterministic aside, so behavior never depends on the model reaching this" comment.

### Reuse list (MUST reuse, not reinvent)

- `game/src/world/groveword.ts` — **the template.** Copy its structure, its purity, its comment discipline.
- `game/src/social/gossip.ts` — `RUMOR_MARK`, `isShareable`. The planted line must carry `RUMOR_MARK` so it
  cannot re-spread; do not invent a second marker.
- `game/src/ai/memory.ts` — `remember` / `recall` / `MemoryStore`. No new store.
- `game/src/ai/brain.ts` — `PRICKLY_MAX`, `EFFUSIVE_MIN`, and the `hungryAside`/`rattledAside` composition
  contract. Do not introduce new temperament cutoffs.
- `game/src/ai/roles.ts` — `Role`, `deriveRole`, `settleRole`. `zoneProvider` reads the settled role; it
  does **not** re-derive one.
- `WorldScene` — `zoneOf`, `zoneById`, `roleOf`, `this.foodBanked`, `logEvent`. All already exist.
- `tests/e2e/helpers.ts` `boot`, and the `__pickTone(name, id)` hook (returns the shown line — see
  `cycle-055-thanks-voice.spec.ts`), `__migrate`, `__plantPlot`, `__harvestPlot`, `__setClock`,
  `__stepWorld`, `__forceConverse`, `__events`. The cycle-107 provider spec's `harvestBowl` /
  `onlyResident` helpers are the exact fixture for establishing a provider — copy them.

### New dependencies

`none`.

### Test plan

**Unit — `tests/unit/cycle-108-provider-word.test.ts`:**
- `zoneProvider`: picks the highest tally; ties go alphabetical; ignores non-`provider` roles; ignores
  providers in other zones; returns null for an empty/providerless zone.
- `providerAside`: three distinct strings across prickly / even / warm; each contains the provider name and
  the zone name; each starts with a space; **none contains `"the The"`** (the article trap, pinned).
- `cannedReply`: with `provider` set the text contains the name and zone; **without** it, the produced text
  is byte-identical to the no-provider path (assert against a fixed non-random register — use the `fond` or
  `gratitude` branch, *not* the random `cannedGreetings` branch).
- `cannedReply` composition: hungry + rattled + provider all present, in that order.
- `spreadProviderWord`: plants a rumor on the listener; the planted line satisfies `!isShareable(...)`;
  returns null-rumor with an unchanged store for each of the three refusal cases, **including
  `speaker === provider`** (the no-self-praise pin).

**E2E — `tests/e2e/cycle-108-provider-word.spec.ts`:**
1. *The keeper hears it.* Establish a bowl provider via the cycle-107 fixture (`onlyResident` + repeated
   `harvestBowl` to `PROVIDER_BANKS`), migrate a second dino back into the bowl, `__pickTone(other, 'warm')`
   and assert the returned line names the provider and `Pocket Cretaceous`.
2. *No self-praise.* `__pickTone(provider, 'warm')` — the line must **not** contain "eats because of".
3. *The word travels.* `__forceConverse` between two bowl residents (neither the provider) and assert a 🧺
   ticker line in `__events`, plus the listener's `__memory` carrying the rumor.
4. Zero console errors (standing house rule — note the known headless no-WebGPU warning must stay a warn).

### Risks

- **`roleOf` mutates.** It settles and caches into `this.roles`. `providerFor` iterating every dino calls it
  for each — that is the same thing `__roles()` already does, so it is established behavior, but the Coder
  must not "optimize" it into a second derivation path that could disagree with the lens.
- **Cascade order is load-bearing.** The existing comment in `converse` states the log else-if order tracks
  the assignment order. Insert into *both* chains at the same position or the ticker will lie.
- **The random canned branch.** `cannedReply`'s generic path picks a random greeting, so a byte-identical
  assertion must pin a deterministic register (gratitude/fond/wistful) rather than the random one.
- **The 320 cap.** Three composable asides plus a fond opener can run long; the widened cap must not
  truncate the provider clause in the composition test — assert the full aside survives.
- **`ai/roles.ts` stays pure** — no `@mlc-ai/web-llm` import reaches it (CHARTER boundary; grep before
  commit).

### Estimated touch count

`~7 files` (3 created, 4 modified).

---

## Cross-track collision check

Both tracks modify **`game/src/scenes/WorldScene.ts`** and nothing else in common.

- Structure track: `drawFloor` (~5270) and the `../world/zones` import line. Likely a **zero-line** change
  if no symbol is renamed — the dispatchers keep their signatures.
- Lore track: `converse` (~3205), `pickTone` (~4335), dev hooks (~2488, ~2298), imports.

Disjoint regions, no shared function. **Order: structure, then lore.** Run `npm run build` and
`npx vitest run` after the structure track lands and before starting the lore track — that way a terrain
regression is caught against a clean lore diff instead of a mixed one.

**Combined estimate: ~10 files.** Within the CHARTER v6 arc size (~15); no split needed.

---

## Shipped

Built in the planned order — structure first with a build + vitest gate before the lore track started.

### Files touched

**Structure (449):**
- `game/src/world/zones.ts` — added `NO_TINT`, `ZoneTerrain`, `ZONE_TERRAIN`; rewrote `zoneTileAt`,
  `zoneWaterTile`, `zoneTint` as table lookups; moved `zoneTint` down beside its siblings. All six per-zone
  functions exported unchanged.
- `tests/unit/cycle-108-terrain-table.test.ts` — new (11 tests).
- `game/src/scenes/WorldScene.ts` — **no structure-track change needed.** The dispatchers kept their
  signatures, so `drawFloor` / `needTargetFor` / the import line were untouched. The plan predicted "likely
  a zero-line change"; it was zero.

**Lore (453):**
- `game/src/ai/roles.ts` — `ProviderCandidate`, `zoneProvider`.
- `game/src/ai/brain.ts` — `NPCContext.provider`, `providerAside`, composition in `cannedReply` (cap 320).
- `game/src/ai/webllmBrain.ts` — one prompt clause in `buildMessages`.
- `game/src/world/providerword.ts` — new; `providerWordLine`, `spreadProviderWord`.
- `game/src/scenes/WorldScene.ts` — `providerFor`, `providerAsideFor`, greet context in `pickTone`, the
  cascade rung + 🧺 ticker in `converse`, `__zoneProvider` / `__spreadProviderWord` hooks.
- `tests/unit/cycle-108-provider-word.test.ts` — new (19 tests).
- `tests/e2e/cycle-108-provider-word.spec.ts` — new (4 specs).

**9 files** (5 created, 4 modified) — under the ~10 estimate.

### Deviations from the plan

1. **The pre-refactor sweep run was skipped.** The plan said to run the full-sweep regression against the
   old code first; that test imports `ZONE_TERRAIN`, which did not exist yet, so it could not compile
   pre-refactor. The intent is preserved a different way: the sweep asserts the dispatcher against each
   zone's own `*TileAt` rule (unchanged by the refactor), and a second test pins the three landmark tiles to
   literal pre-refactor coordinates read out of the old source. Both would fail on drift.
2. **Extracted a second scene helper.** The plan inlined the greet-context provider lookup as an IIFE in
   `pickTone`; it became `providerAsideFor(name)` beside `providerFor`, since the "never itself" guard is a
   rule worth naming rather than a closure buried in an argument list. Same behavior.
3. **`NO_TINT` added.** The bare `0xffffff` appeared three times once the table existed; naming it was
   cheaper than repeating it. Not in the plan, trivially in scope.

No scope creep beyond those three. No new dependencies.

### Status

- `npm run build` — clean (`✓ built in 8.74s`).
- `npx vitest run` — **1268/1268 green, 138 files** (was 1238/137; +30 new tests).
- `npx playwright test cycle-108-provider-word` — 4/4 green.
- Dev server renders: `curl localhost:5173` → `200`.
- CHARTER boundary verified: `grep -rn "@mlc-ai/web-llm" game/src` outside `game/src/ai/` returns nothing;
  only `ai/webllm.worker.ts` and `ai/webllmBrain.ts` import it. `ai/roles.ts` and `world/providerword.ts`
  are pure.
- Save shape unchanged this cycle (both tracks ride existing persisted state).

---

# Rework loop 1 — lore track only

**Structure track (449): APPROVED — no re-plan, no re-touch.**

## Lore track — BACKLOG-453, rework plan

**Files to modify:** two.

| File | What changes |
|---|---|
| `game/src/scenes/WorldScene.ts` | One line — the `pword.rumor` `logEvent` template at `:3257` gains the speaker. |
| `tests/e2e/cycle-108-provider-word.spec.ts` | The "word travels" spec asserts the ticker names speaker, listener, and zone — not just the 🧺 and a fragment. |

**The change:**
```ts
// before
else if (pword.rumor) this.logEvent(`🧺 ${b.name} heard who keeps ${zoneById(zone).name} fed`);
// after
else if (pword.rumor) this.logEvent(`🧺 ${b.name} heard from ${a.name} who keeps ${zoneById(zone).name} fed`);
```
Matches the `from ${a.name}` construction the grove rung beside it already uses, so the cascade reads
consistently top to bottom.

**Reuse:** none new — this is a template string in an existing `else if` chain.

**Test plan:** tighten the existing e2e assertion rather than add a spec. The current check
(`e.includes('🧺') && e.includes('heard who keeps')`) is exactly the weak assertion that let the miss
through — it never looked for a speaker. Replace it with one that names all three parties, so the criterion
is pinned by a test that would have caught the original defect:
```ts
expect(ticker).toContain('Mossback heard from Rex who keeps Pocket Cretaceous fed');
```

**Risks:** none of consequence. `providerWordLine` (the rumor written to memory) is a different string in a
different module and must stay untouched — the memory assertion in the same spec guards that. No unit test
covers `logEvent` templates (none does, for any rung), so the e2e is the right level.

**Estimated touch count:** `~2 files`.

### Shipped (rework 1)

- `game/src/scenes/WorldScene.ts:3257` — ticker now reads
  `🧺 ${b.name} heard from ${a.name} who keeps ${zoneById(zone).name} fed`.
- `tests/e2e/cycle-108-provider-word.spec.ts` — the "word travels" assertion is now an exact phrase match
  naming all three parties.

**One extra fix, found by the new assertion.** The tightened test failed on first run — but not on the
production change. `🧺` is shared with 448's haul line (`🧺 Sunny put the harvest away in Pocket
Cretaceous's stores`), and the spec's `.find(e => e.includes('🧺'))` selected *that* event instead of the
gossip one. The old weak assertion had masked the collision by also matching a phrase fragment. Fixed by
selecting on `'🧺' && 'heard'`, with a comment naming the shared glyph so the next spec author doesn't
repeat it. Production behavior was correct; the test was reading the wrong line. Worth recording: the
sharper assertion earned its keep twice over in the same run.

**Status:** build clean · vitest 1268/1268 · `cycle-108-provider-word` 4/4 · full e2e re-run below (QA).
Structure track untouched, as fenced.
