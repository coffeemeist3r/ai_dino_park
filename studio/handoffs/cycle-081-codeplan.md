# Cycle 81 — Code Plan

Two file-disjoint tracks. No cross-track file collision (lore = `loner.ts` + meet/bond glue; structure =
`resource.ts` + `crossDino`). No new dependencies either track.

## Lore track — BACKLOG-369 (The loner finds a friend)

**Item:** When a dino that had been a loner grows its first bond above `LONER_FLOOR`, file a one-shot
"not so alone now" memory + a 🌱 perk-up bubble. The 🥀 already lifts off the live graph.

**Files to create:** none.

**Files to modify:**
- `game/src/world/loner.ts`
  - Add `export const FOUND_FRIEND_GLYPH = '🌱';`
  - Add `export function liftsLoner(before: Bonds, after: Bonds, name: string, peers: readonly string[], floor = LONER_FLOOR): boolean` — `isLoner(before,…) && !isLoner(after,…)`. Pure transition read over the two bond snapshots.
  - Add `export function foundFriendMemory(): string` → `'found a friend — not so alone now'`.
  - Add `export function foundFriendLine(name: string): string` → `` `${name} 🌱` `` (perk-up bubble text; mirrors `perkUpLine`).
- `game/src/scenes/WorldScene.ts`
  - Import the four new symbols from `../world/loner`.
  - Add a transient field `private lonerFriended = new Set<string>();` (once-ever guard; not persisted — the memory is the durable record).
  - Add `private checkLonerLift(name: string, before: Bonds): void`: if `!this.lonerFriended.has(name)` and `liftsLoner(before, this.bonds, name, this.dinoNames())` → add to set, `this.memory = remember(this.memory, name, foundFriendMemory())`, and `const d = this.dinoByName(name); if (d) this.showBubble(d, foundFriendLine(name));`.
  - **Meet site (~line 2014-2015):** capture `const before = this.bonds;` *before* the `strengthen` call, then after it call `this.checkLonerLift(a.name, before); this.checkLonerLift(b.name, before);`.
  - **`__bondPair` hook (~line 1289):** same pattern — snapshot `before`, strengthen, then `checkLonerLift` for both names — so the e2e can drive the transition deterministically.

**Reuse list (MUST use, do not reinvent):**
- `isLoner`, `LONER_FLOOR` — `game/src/world/loner.ts` (the loner read; `liftsLoner` is a thin wrapper over it).
- `strengthen`, `bondPoints`, `type Bonds` — `game/src/social/bonds.ts`.
- `remember` — `game/src/social/memory` (the memory store; already imported in WorldScene, used at e.g. line 840).
- `showBubble`, `dinoByName`, `dinoNames` — existing `WorldScene` methods (loner 135 / pond 359 already use them).
- `perkUpLine` — the existing 💐 one-shot line is the shape to mirror.

**New dependencies:** none.

**Test plan:**
- Unit (`tests/unit/cycle-081-loner-friend.test.ts`):
  - `liftsLoner` true when before=all-below-floor, after=one bond ≥ floor for `name`; false when already non-loner before; false when still loner after.
  - `foundFriendMemory()` / `foundFriendLine(name)` return the expected strings (line includes the name + 🌱).
  - `loner.ts` purity is implicit (no Phaser/WebLLM import — assert by the existing import-only test pattern if present, else N/A).
- E2E (`tests/e2e/cycle-081-loner-friend.spec.ts`):
  - Boot; assert `__isLoner('Rex')` true on the fresh bowl.
  - `__bondPair('Rex','Mossback',10)`; assert `__isLoner('Rex')` false AND `__memory()['Rex']` has exactly one entry containing `'not so alone'`.
  - `__bondPair('Rex','Sunny',10)` again; assert the loner-friend memory count stays 1 (one-shot).
  - Zero console errors.

**Risks:**
- Multiple `strengthen` sites exist (huddle, egg, sympathy, pond, meet). Only the **meet site** + `__bondPair`
  need the hook: a loner crosses the floor for the *first* time overwhelmingly via meetings (huddle/egg/
  sympathy presuppose an existing bond). Wiring only those two keeps the change minimal and correct; if a
  future path needs it, `checkLonerLift` is reusable. (ponytail: two call-sites, not a global bond-change bus.)
- `before` must be the pre-strengthen reference (the store is treated immutably — `strengthen` returns a new
  map — so capturing the reference before reassigning `this.bonds` is sufficient; do not deep-clone).

**Estimated touch count:** ~4 files (loner.ts, WorldScene.ts, 1 unit, 1 e2e). Well under 6.

## Structure track — BACKLOG-356 (Directed carry)

**Item:** A crossing dino ferries the kind the destination zone is short of for its next craft, else falls
back to `pickCarry`.

**Files to create:** none.

**Files to modify:**
- `game/src/world/resource.ts`
  - Add after `pickCarry`:
    ```ts
    export function directedCarry(src: Stockpile, dest: Stockpile, recipe: Partial<Record<ResourceKind, number>> = CRAFT_RECIPE): ResourceKind | null {
      const needed = (Object.keys(RESOURCE_GLYPH) as ResourceKind[]) // RESOURCE_GLYPH order = deterministic tie-break
        .map((k) => ({ k, deficit: (recipe[k] ?? 0) - (dest[k] ?? 0) }))
        .filter((x) => x.deficit > 0 && (src[x.k] ?? 0) > 0 && !atCap(dest, x.k))
        .sort((a, b) => b.deficit - a.deficit);
      return needed[0]?.k ?? pickCarry(src, dest);
    }
    ```
  - `Array.prototype.sort` is stable in modern engines, so iterating `RESOURCE_GLYPH` order then sorting by deficit desc keeps branch-before-stone on a deficit tie. (Mirror the `pickCarry` comment.)
- `game/src/scenes/WorldScene.ts`
  - Import `directedCarry` alongside `pickCarry` (line ~91).
  - In `crossDino` (~line 3033): swap `const carry = pickCarry(this.pileFor(home), this.pileFor(dest));` → `const carry = directedCarry(this.pileFor(home), this.pileFor(dest));`. Everything downstream (`takeResource`/`bankResource`/log) is unchanged.

**Reuse list (MUST use, do not reinvent):**
- `pickCarry` (the spare-ferry fallback), `atCap`, `CRAFT_RECIPE`, `RESOURCE_GLYPH`, `takeResource`,
  `bankResource`, `type Stockpile`, `type ResourceKind` — all already in `game/src/world/resource.ts`.

**New dependencies:** none.

**Test plan:**
- Unit (`tests/unit/cycle-081-directed-carry.test.ts`):
  - `{stone:2,branch:1}` → `{}` returns `'branch'` (deficit 3 beats stone's 2).
  - dest fully stocked for the recipe → returns `pickCarry(src,dest)` (spare fallback); assert equality with a `pickCarry` call.
  - dest at cap for the needed kind → that kind skipped (returns the other needed kind or the fallback).
  - empty src → `null`.
  - deficit tie → branch before stone.
- E2E (`tests/e2e/cycle-081-directed-carry.spec.ts`) — reuse the cycle-077-carry helpers (`__zoneStockpile`,
  `__spawnResource`, `__startMigration`, `__stepWorld`, `__migrating`, `__dinoPositions`):
  - Bank stone×2 + branch×1 onto a bowl dino → bowl pile `{stone:2, branch:1}`, grove empty.
  - Cross that dino bowl→grove; assert grove pile gains `branch` (the directed kind), grove `stone` absent/0,
    bowl `branch` → 0 (conserved). This is the behavior the old `pickCarry` would *not* produce (it would move stone).
  - Zero console errors.

**Risks:**
- The cairn recipe `{branch:3, stone:2}` is the canonical "next craft" — correct because the cairn auto-crafts
  on every gather (315's gate), so it's always the live target. Shelter-recipe awareness is explicitly out of
  scope (deferred).
- Banking via `__spawnResource`+step must not trip an auto-craft: `{stone:2,branch:1}` fails `canCraft`
  (needs branch ≥ 3), so the pile holds. Keep the banked counts below the recipe in the e2e.

**Estimated touch count:** ~4 files (resource.ts, WorldScene.ts, 1 unit, 1 e2e). Under 6.

---

## Shipped (Coder)

**Files touched:**
- `game/src/world/loner.ts` — +`FOUND_FRIEND_GLYPH`, +`liftsLoner` (pure two-snapshot transition read), +`foundFriendMemory`, +`foundFriendLine`. Stays pure (no Phaser/WebLLM).
- `game/src/world/resource.ts` — +`directedCarry` (largest craft-deficit kind src can supply & dest can accept; falls back to `pickCarry`). Reuses `atCap`/`CRAFT_RECIPE`/`RESOURCE_GLYPH`/`pickCarry`.
- `game/src/scenes/WorldScene.ts` — imports updated (added the 3 loner symbols + `directedCarry`; **dropped** the now-unused `pickCarry` import since `crossDino` was its only caller); +`lonerFriended` transient Set; +`checkLonerLift(name, before)`; wired at the meet-site bond bump + the `__bondPair` hook (snapshot `before`, strengthen, check both names); `crossDino` carry swapped `pickCarry` → `directedCarry`.
- `tests/unit/cycle-081-loner-friend.test.ts` (5), `tests/unit/cycle-081-directed-carry.test.ts` (6), `tests/e2e/cycle-081-loner-friend.spec.ts` (2), `tests/e2e/cycle-081-directed-carry.spec.ts` (1).

**Deviations from plan:** one minor, flagged in plan as a risk — removed WorldScene's `pickCarry` import (unused after the `crossDino` swap; `directedCarry` calls `pickCarry` internally from resource.ts). No scope creep.

**Build + tests:** `npm run build` clean (tsc + vite). **838 unit green** (+11: 5 loner-friend, 6 directed-carry). Dev server HTTP 200. Full e2e **255/256** — the lone failure is `cycle-069-zone-objects` (resource gatherable-in-own-zone), the catalogued rotating parallel-load flake: **green isolated 3/3** (`--workers=1`), in the zone-gate path untouched by this diff (the change lives in `crossDino` carry + the loner meet-site). web-llm boundary unaffected; `loner.ts`/`resource.ts` stay pure; no save-format change (the `lonerFriended` guard is transient). phase → qa-pending.
