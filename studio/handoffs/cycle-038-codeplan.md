# Cycle 38 — Code Plan

**Item** — BACKLOG-157 [emergent] More keeper abilities — first ability: LUMEN-3's **Field Scan**.

## Files to create

1. `game/src/keeper/scan.ts` — pure, no Phaser. Exports:
   - `canScan(keeper: Keeper): boolean` — `keeper.id === 'lumen'`.
   - `ScanSubject` interface — `{ name: string; species: string; traits: Personality; role: Role }`.
   - `scanLines(subject: ScanSubject): string[]` — deterministic dossier:
     - header `— Field Scan: <name> —` + `<species> · [<role>]`
     - one line per axis from `AXES` (import from `ai/personality.ts`): `low ▮▮▮…▯ high` meter,
       10 cells, `Math.round(v * 10)` filled — pure string math
     - mood line via `moodFromTraits(traits)` (import from `ai/brain.ts` — pure fn, no llm)
     - favorite line via `favoriteFood(traits)` (from `world/foods.ts`): `loves <emoji> <label>`
   - `scanRefusal(keeper: Keeper): string` — record keyed on id; distinct in-character lines for
     `aether` / `vanta` (and a generic for safety). Non-empty, different from each other.
2. `tests/unit/scan.test.ts` — see test plan.
3. `tests/e2e/cycle-038-scan.spec.ts` — see test plan.

## Files to modify

1. `game/src/scenes/WorldScene.ts` — thin glue only:
   - field `private scanPanel!: Phaser.GameObjects.Text` (clone the `heartsPanel` pattern,
     WorldScene.ts:1678) + `private scanOpen = false`.
   - in `create()` key block: `addKey(KeyCodes.B).on('down', () => this.toggleScan())`.
   - `private toggleScan()`: if `scanOpen` → close. Else `nearestDino()` (1418); none → return.
     Not `canScan(keeperById(this.keeperId))` → `this.showBubble`-style floating refusal
     (reuse the existing float/bubble helper used for repair/comfort lines) and return.
     Else build `ScanSubject` (`d.name`, `d.species`, `d.traits`, role via the existing
     `deriveRole` wrapper at WorldScene.ts:792), set panel text to `scanLines(...)`, show.
   - dev hooks next to the keeper hooks (~1647): `__scanOpen()`, `__canScan()`,
     `__scanLines(name?)` (returns `scanLines` for the named dino or nearest, without opening UI).
   - hint line (~1150): append ` · B scan`.
   - add panel to `hudElements` so idle-fade keeps treating HUD uniformly (match heartsPanel).
2. `BACKLOG.md` — on ship, annotate 157 progress (validator owns close/keep-open call).

## Reuse list (MUST use, not reinvent)

- `AXES` + `Personality` — `game/src/ai/personality.ts:18` (pole labels for the meters).
- `moodFromTraits` — `game/src/ai/brain.ts:58` (pure; importing it does NOT touch web-llm —
  webllm code lives in `webllmBrain.ts`/worker, boundary safe).
- `favoriteFood` — `game/src/world/foods.ts:31`.
- `keeperById`, `Keeper` — `game/src/keeper/keepers.ts` (do NOT edit its data).
- `nearestDino()` — WorldScene.ts:1418 (same talk range as E).
- `deriveRole` wrapper — WorldScene.ts:792 (`roleOf`-style call with meetings/rumors/topBond).
- Hearts-panel show/hide pattern — WorldScene.ts:1678–1719 (panel text + visibility + dev hook).
- Floating-bubble helper (`showBubble`) — used at WorldScene.ts:1392 for repair lines; reuse for
  the refusal float (anchor on the player or the target dino — coder's call, note in commit).

## New dependencies

none.

## Test plan

**Unit — `tests/unit/scan.test.ts`** (~7 tests, mirror `keepers.test.ts` style):
1. `canScan` true for `keeperById('lumen')`, false for `aether` + `vanta`.
2. `scanLines` for a seeded subject (traits via `seededPersonality('Rex')`, species
   'triceratops', role 'wanderer') includes name + species + role.
3. All 5 axes appear: both pole labels of every `AXES` entry present in the output.
4. Favorite-food line matches `favoriteFood(traits)` emoji + label.
5. Mood line matches `moodFromTraits(traits)`.
6. Determinism: two calls → deep-equal arrays.
7. `scanRefusal('aether')` ≠ `scanRefusal('vanta')`, both non-empty; lumen never needs one
   (define behavior: returns '' or generic — assert it's not shown for lumen at e2e level).

**E2E — `tests/e2e/cycle-038-scan.spec.ts`** (~4 tests, copy cycle-037-keeper.spec.ts boot
helpers — fresh-save init, `expect.poll` hardening, single-worker-friendly):
1. As Lux (`__pickKeeper('lumen')`), walk adjacent to Rex (reuse the teleport/walk helper pattern
   from cycle-037), press B → `expect.poll(__scanOpen)` true; `__scanLines()` contains 'Rex'.
2. B again → `__scanOpen()` false.
3. Default keeper (AETHER-1): B adjacent to a dino → `__scanOpen()` stays false (poll briefly);
   refusal text visible (assert via the page text or a `__lastRefusal` hook if simpler — if a hook
   is added, name it `__scanRefusalShown()`).
4. Additivity guard: with scan panel open, E still opens the tone menu (dialog shows
   `Greet`), i.e. scan never blocks the talk path.

**Suite:** `npm run build`, `npx vitest run`, `npx --yes kill-port 5173 && npx playwright test`.

## Risks

- **B-key adjacency to V/N:** B is verified unbound today (grep of addKey/keydown). Safe.
- **`moodFromTraits` import chain:** `brain.ts` is the pure interface file — confirm it doesn't
  import webllm (it doesn't; `webllmBrain.ts` does). Grep `from '@mlc-ai/web-llm'` after coding:
  must only hit `ai/` (and only the webllm files).
- **Refusal float vs dialog state:** the refusal must NOT set `dialogOpen` (it's a fading bubble,
  not a dialog) or it would eat the next E press. Follow `showKeeperInvite`'s non-modal pattern.
- **`deriveRole` needs tallies:** the WorldScene wrapper (792) already wires meetings/rumors/bonds;
  pass through it, don't re-derive in the pure module (pure module takes the finished `Role`).
- **Idle-fade HUD list:** if the panel joins `hudElements`, ambient mode will fade it — that's the
  hearts-panel behavior, consistent; don't special-case.
- Cold parallel-boot e2e flake is known (optimizeDeps warmed, 30s ceiling) — if one spec trips on
  the first full run, re-run isolated per the quality bar.

## Estimated touch count

~5 files (1 new src, 1 modified src, 2 new tests, BACKLOG annotation). At budget.
