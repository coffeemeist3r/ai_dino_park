# Cycle 39 — Code Plan

**Item** — BACKLOG-161 [emergent] First-contact inspection — the bowl reacts to who you chose.

## Files to create

1. `game/src/keeper/firstContact.ts` — pure, no Phaser. Exports:
   - `INSPECT_TTL = 12` — world steps of curiosity before the inspector loses interest.
   - `inspector(keeper: Keeper, cast: Array<{ name: string; traits: Personality }>): string | null`
     — highest `keeperFit(keeper, traits)`, **strictly positive** required, alphabetical
     tie-break (copy the `comforter` loop shape in `world/comfort.ts:71-79`); empty cast → null.
   - `inspectLine(name: string): string` — `` `${name}: *comes close, looks the new watcher up and down* 👀` ``
   - `inspectMemory(keeperName: string): string` — `` `went to the glass for a long look at ${keeperName}` ``
2. `tests/unit/firstContact.test.ts`
3. `tests/e2e/cycle-039-inspect.spec.ts`

## Files to modify

1. `game/src/scenes/WorldScene.ts` — thin glue:
   - field: `private pendingInspect: { name: string; ttl: number } | null = null;`
     and `private lastInspection: { name: string; keeperId: string } | null = null;` (transient).
   - `pickKeeperIndex(i)` (WorldScene.ts:~1370): capture `const changed = keeper.id !== this.keeperId`
     **before** assignment; after the existing persist/confirm, if `changed` call a new
     `armInspection()` — which computes `inspector(keeperById(this.keeperId), this.dinos)` and sets
     `pendingInspect = { name, ttl: INSPECT_TTL }` (or null). Note `__pickKeeper` routes through
     `pickKeeperIndex`, so the hook arms it too — by design (the e2e uses it).
   - `forceStep()` per-dino loop (~1010): after the sky-event early-return and **before** the
     food/huddle/drift branches for that dino, if `pendingInspect?.name === d.name`:
     `next = stepToward(cur, playerTile, COLS, ROWS)`; after positioning, if within 1 tile of the
     player → `showBubble(d, inspectLine(d.name))`, `remember(memory, d.name, inspectMemory(keeperById(this.keeperId).name))`,
     set `lastInspection`, clear `pendingInspect`. Decrement ttl once per forceStep; 0 → clear
     silently. Player tile: `{ tileX: Math.floor(this.player.x / TILE), tileY: Math.floor(this.player.y / TILE) }`
     (check for an existing helper first; `tileOf` takes a Dino).
   - dev hooks (keeper hook block ~1647): `__inspection()`, `__lastInspection()`,
     `__keeperFit(name)` → `keeperFit(keeperById(this.keeperId), dino.traits)`.
   - import `keeperFit` (already exported from keepers.ts) + the three firstContact symbols.

## Reuse list (MUST use, not reinvent)

- `keeperFit` — `game/src/keeper/keepers.ts:76` (the fit math; do NOT re-derive).
- `stepToward` — `game/src/world/movement.ts` (already imported in WorldScene).
- `showBubble` / `remember` / `recall` — existing beat + memory grammar.
- `comforter`'s argmax-with-alpha-tie-break loop shape — `world/comfort.ts:71-79` (copy the
  convention, not the function — different inputs).
- Arming/one-shot transient pattern — `pendingRepair` (BACKLOG-125) is the model: transient field,
  consumed once, never persisted.
- e2e boot/poll helpers — `tests/e2e/helpers.ts` boot + `expect.poll`; `__stepWorld` hook
  (WorldScene.ts:929) to drive forceStep deterministically; `__warpTo` (cycle 38) if proximity
  setup is needed.

## New dependencies

none.

## Test plan

**Unit — `tests/unit/firstContact.test.ts`** (~6 tests, mirror keepers.test.ts archetypes):
1. `inspector` picks the strictly-best positive-fit dino (use the keepers.test.ts archetype
   personalities: vanta + a boldFiery cast member wins over timidPrickly).
2. Alphabetical tie-break: two identical-traits cast members → lexicographically smaller name.
3. All fits ≤ 0 → null (timidPrickly-only cast vs vanta).
4. Empty cast → null.
5. `inspectLine` contains the name + 👀; `inspectMemory` contains the keeper name.
6. Determinism: same inputs, same outputs (double-call deep-equal).

**E2E — `tests/e2e/cycle-039-inspect.spec.ts`** (~4 tests):
1. Fresh boot: `__inspection()` and `__lastInspection()` both null; console clean.
2. `__pickKeeper` to a different observer: `__inspection().name` equals the name with max
   positive `__keeperFit` (compute expected in-page over `__dinoNames`); then loop
   `__stepWorld()` (≤ INSPECT_TTL times) until `__lastInspection()` is `{name, keeperId}`;
   assert the 👀 line hit `__bubbleTexts()` and `__memory()[name]` includes the inspect memory.
3. Re-picking the same observer: `__inspection()` stays null.
4. TTL expiry isn't needed as e2e (unit-ish, hard to stage player flight) — instead: guard test
   that an armed inspection doesn't disturb the rest of the cast's huddle/food behavior
   (cheap version: sky-event override still wins — `__triggerSky` then `__stepWorld`, inspector
   joins the gather; acceptable to assert just that no error and gather proceeds).

**Suite:** `npm --prefix game run build`, `npx vitest run`,
`npx --yes kill-port 5173 && npx playwright test` (cold-boot flake protocol per quality bar).

## Risks

- **Pick-flow ordering:** `pickKeeperIndex` early-returns unless `keeperPickerOpen` — `changed`
  must be computed after the guard, before `this.keeperId = keeper.id`.
- **Arming on first-time pick:** fresh boot defaults `keeperId = 'aether'`; picking aether arms
  nothing (same id) — matches design. Picking vanta/lumen on a fresh game DOES arm — intended.
- **Save restore:** `keeperId` is assigned directly in the load path (WorldScene.ts:~1620), not
  via `pickKeeperIndex`, so restore can't arm. Verify, don't assume.
- **Step-order subtlety:** decrement ttl exactly once per forceStep (not per dino). Cleanest:
  handle the ttl/arrival check once after the movement loop, using the inspector's new position.
- **Player standing still in e2e:** player never moves during `__stepWorld` loops, so arrival is
  deterministic in ≤ (map diameter) steps; INSPECT_TTL=12 covers a 20×15 bowl from any corner?
  Worst-case Chebyshev distance ~19 — if `stepToward` moves 1 tile/step, 12 may expire first.
  **Set INSPECT_TTL = 24** (revising the design's 12; note it in Shipped) or e2e must warp close.
  Coder: prefer TTL 24 + `__warpTo` in the spec for speed; assert design AC with the poll bound
  at TTL.
- The sky-event early-return means an armed inspector pauses during a spectacle — acceptable
  (ttl only decrements in ordinary steps if the decrement sits after the early-return; keep it
  there so the spectacle doesn't eat the inspection).

## Estimated touch count

~4 files (1 new src, 1 modified src, 2 new tests). At budget.
