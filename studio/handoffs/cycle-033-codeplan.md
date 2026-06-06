# Cycle 33 — Code Plan

## Item
**BACKLOG-130 [social] Comforting nuzzle** — when the homecoming jealous sulk fires, the sulker's
highest-bond peer (≥ floor) crosses over, throws a 🫂, the pair's bond grows, the sulker keeps a
"comforted" memory. Pure module + thin `WorldScene` glue, mirroring the cycle-32 repair seam.

## Files to create
- `game/src/world/comfort.ts` — the pure module (no Phaser, no web-llm). Exports:
  - `COMFORT_BOND_FLOOR = 8` — min pairwise bond for a friend to bother crossing (matches `HUDDLE_THRESHOLD`).
  - `COMFORT_BOND = 2` — bond added between comforter and sulker (consolation deepens the friendship).
  - `comforter(sulker: string, bonds: Bonds, names: string[]): string | null` — over `names`, skipping `sulker`, pick the peer with the highest `bondPoints(bonds, sulker, peer)`; require that max `≥ COMFORT_BOND_FLOOR`; ties → lexicographically-smallest name (match `homecoming.ts` `topBy`). Return the name, or `null` if none clears the floor.
  - `comfortLine(friend: string, sulker: string): string` → `` `${friend}: There there, ${sulker}. 🫂` `` (contains 🫂 + both names).
  - `comfortMemory(friend: string): string` → `` `${friend} came over to comfort me` ``.
- `tests/unit/comfort.test.ts` — vitest describe `comfort (BACKLOG-130)`.
- `tests/e2e/cycle-033-comfort.spec.ts` — playwright.

## Files to modify
- `game/src/scenes/WorldScene.ts`
  - Import `comforter, comfortLine, comfortMemory, COMFORT_BOND` from `../world/comfort`.
  - Add private field `private lastComfort: { comforter: string; sulker: string } | null = null;` near `pendingRepair` (line ~80).
  - In `playHomecoming()` (line ~915), inside the existing `if (hc.jealous)` block, **after** setting `pendingRepair`: compute `const who = comforter(hc.jealous.name, this.bonds, this.dinos.map(d => d.name));` If `who`:
    - `const friend = this.dinos.find(d => d.name === who);`
    - reposition `friend` beside the sulker so the 🫂 reads as consolation: `if (friend && rival) friend.setPosition(...)` one tile from `rival` clamped in-bounds (reuse `stepToward(this.tileOf(friend), this.tileOf(rival), COLS, ROWS)` once to nudge adjacent; place at the stepped tile center like the wander code at line ~857). Skip if no free need — a single `stepToward` step toward the sulker is enough and deterministic.
    - `if (friend) this.showBubble(friend, comfortLine(who, hc.jealous.name));`
    - `this.bonds = strengthen(this.bonds, who, hc.jealous.name, COMFORT_BOND);`
    - `this.memory = remember(this.memory, hc.jealous.name, comfortMemory(who));`
    - `this.lastComfort = { comforter: who, sulker: hc.jealous.name };`
    - else `this.lastComfort = null;`
  - Also set `this.lastComfort = null` at the top of `playHomecoming` (before the jealous block) so a fresh beat with no comfort reports null, and a non-jealous homecoming clears any stale value.
  - Add dev hook in the hooks block (~line 1310, beside `__pendingRepair`):
    `(window as any).__lastComfort = () => this.lastComfort;`

## Reuse list (CHARTER demands reuse — these are mandatory)
- `social/bonds.ts` — `strengthen`, `bondPoints`, type `Bonds`. The module reads bonds via `bondPoints`; the scene grows the bond via `strengthen`. **Do not** reinvent pair math.
- `social/meetings.ts` — `pairKey` (only if the test needs to index `__bonds`; the module itself uses `bondPoints`, never raw keys).
- `homecoming.ts` `jealous.name` — the sulker source. **Do not touch `homecoming.ts`.**
- `WorldScene` `showBubble`, `remember` (memory store), `strengthen`, `stepToward`/`tileOf`, `this.dinos`, `this.bonds`, `this.memory` — all already imported/in-scene.
- Mirror the **cycle-32 repair seam exactly**: a pure module of small pure fns + one transient scene field + one dev hook.

## New dependencies
`none` — greenfield logic on existing pure modules.

## Test plan
### Unit (`tests/unit/comfort.test.ts`)
- `comforter` picks the highest-bond peer above the floor; excludes the sulker itself.
- `comforter` returns `null` when every peer's bond is below `COMFORT_BOND_FLOOR`.
- Bond ties break to the lexicographically-smallest name (e.g. equal bonds to `Glade` and `Sunny` → `Glade`).
- `comfortLine('Twitch','Sunny')` contains `🫂`, `Twitch`, and `Sunny`.
- `comfortMemory('Twitch')` contains `Twitch` and is truthy.
- `COMFORT_BOND > 0` and `COMFORT_BOND_FLOOR > 0`.

### E2E (`tests/e2e/cycle-033-comfort.spec.ts`) — reuse `cycle-032-repair`'s `stageJealousy` shape
- **Comfort fires:** boot → `__greet('Sunny')`, `__greet('Glade')` (near-tie) → `__bondPair('Sunny','Twitch')`×2 and `__bondPair('Glade','Twitch')`×2 (Twitch ≥16 to both candidates, clears the 8 floor whoever sulks) → record Twitch↔sulker bond from `__bonds()` keyed by sorted pair → `__catchUp(2 days)`. Assert: `__lastComfort` = `{comforter:'Twitch', sulker:<runner-up>}`; a `__bubbleTexts` entry contains `🫂` + `Twitch`; the Twitch↔sulker bond in `__bonds()` rose by exactly `COMFORT_BOND`.
- **No friend → no comfort (regression):** boot → greet Sunny+Glade → **no** `__bondPair` → `__catchUp`. Assert: `__lastComfort` is `null`; `__bubbleTexts` has the `😒` sulk; `__pendingRepair` equals the sulker (BACKLOG-125 path byte-for-byte unchanged); no `🫂` bubble.

## Risks
- **Bond key indexing in e2e:** `__bondPair(a,b)` *mutates* (+8) and returns points; use it to *stage* the bond, but read before/after via `__bonds()` with `[a,b].sort().join('|')` so the +`COMFORT_BOND` assertion is exact (don't call `__bondPair` again to read — it would add 8).
- **Who sulks is dynamic** (warmth-scaled greet gains): the test must read the sulker from `__catchUp().homecoming.jealous.name`, never hard-code it. Staging Twitch's bond to *both* Sunny and Glade makes the comforter deterministic regardless.
- **Reposition must stay in-bounds:** use the existing `stepToward(...COLS,ROWS)` clamp; do not hand-roll tile math. A single step toward the sulker is enough — full adjacency walk is BACKLOG-133.
- **Don't consume `pendingRepair`:** comfort is parallel to keeper-repair; leave the repair seam alone so cycle-32 e2e stays green.

## Estimated touch count
~4 files (1 new module + 2 new tests + 1 scene edit). Well under the 6-file split line.

## Shipped
Implemented per plan, 4 files, no deviations, no scope creep.
- **Created** `game/src/world/comfort.ts` — `comforter(sulker,bonds,names)` (highest-bond peer ≥ `COMFORT_BOND_FLOOR=8`, alpha tie-break, excludes sulker, null below floor); `comfortLine` (`X: There there, Y. 🫂`), `comfortMemory`, `COMFORT_BOND=2`. Imports only `social/bonds` — no Phaser, no web-llm.
- **Modified** `game/src/scenes/WorldScene.ts` — import comfort; new transient `lastComfort` field; in `playHomecoming` jealous branch (after `pendingRepair`): pick comforter, nudge it one `stepToward` the sulker, float `comfortLine`, `strengthen` the pair by `COMFORT_BOND`, `remember` the sulker's `comfortMemory`, set `lastComfort`; `lastComfort` reset at the top of the beat; new `__lastComfort` dev hook.
- **Created** `tests/unit/comfort.test.ts` (7 tests) + `tests/e2e/cycle-033-comfort.spec.ts` (2 tests: comfort fires with bond bump; no-friend regression keeps 120 sulk + 125 pendingRepair).
- `homecoming.ts` untouched; keeper-repair seam untouched; additive save (bond bump rides the already-persisted `bonds` map).

**Build:** ✅ `npm --prefix game run build` clean. **Unit:** ✅ 212 passed (+7 comfort). **Dev smoke:** ✅ HTTP 200. E2E left for QA.
