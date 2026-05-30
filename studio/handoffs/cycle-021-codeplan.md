# Cycle 021 — BACKLOG-021 (collection book) + BACKLOG-020 (role emergence) — code plan

**Goal:** make the emergent sim *visible* without scripting it. One key (**V**) cycles observer lenses, each a pure readout of existing state. Design rule: show a mirror, never author an outcome.

## New pure modules (no Phaser, Node-tested)
- `game/src/ai/roles.ts` — `deriveRole({meetings, rumorsHeard, topBond}) → 'gossip'|'homebody'|'socialite'|'wanderer'` (checked most-distinctive first), `ROLE_ICON`. Roles fall out of behavior tallies the sim already keeps.
- `game/src/ui/lenses.ts` — `Lens`/`LENS_ORDER`/`LENS_LABEL`, `nextLens`, `bondedPairs(bonds,minPts)` (parse `a|b` keys, strongest first), `tickerLines(events,n)`, `bookLines(rows)`.

## Save — additive
- `BornDino` gains `parents: [string,string]`; `hatch` populates it. Used for lineage in the book. No version bump (existing `born` validation doesn't require it; old saves load).

## Integration — `game/src/scenes/WorldScene.ts`
- Lens state + objects: `bookPanel` (center text), `bondGfx` (graphics, depth 6), per-dino `roleTags` (created in `spawnDino`, index-aligned like `sleepMarks`), `tickerPanel` (top-left), `lensLabel` (top-center). `eventLog: string[]` (capped 12) — note: NOT named `events` (collides with Phaser.Scene).
- **V** key → `cycleLens` → `refreshLens` (also on every clock tick for live updates).
- `refreshLens` shows only the active lens: book builds `bookLines(bookRows())`; bonds redraws lines between `bondedPairs(bonds, HUDDLE_THRESHOLD)`; roles sets each tag from `roleOf`; ticker shows `tickerLines(eventLog)`.
- `logEvent` called on egg lay (🥚), hatch (🐣), and gossip spread in `converse` (🗣️).
- Helpers: `meetingsOf`/`rumorsOf` (count `RUMOR_MARK` memories)/`roleOf`/`bookRows`/`dinoByName`.
- Dev hooks: `__lens`, `__cycleLens`, `__events`, `__roles`, `__bookRows`.

## Tests
- `tests/unit/roles.test.ts` (5), `tests/unit/lenses.test.ts` (5), breeding/saveGame updated for `parents`.
- `tests/e2e/cycle-021-lenses.spec.ts` (3): V cycles + wraps; a rumor-carrier emerges as `gossip`; ticker + book reflect a birth (lineage shown).

## Verdict
APPROVED. 109 unit / 44 e2e green (e2e ×2, no flake). web-llm boundary clean. All four lenses visually verified in a live preview.
