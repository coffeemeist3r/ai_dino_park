# Cycle 188 — Code Plan

## Structure track — BACKLOG-604 (build first)

**Files to modify:**
- `game/src/world/molt.ts` — `WitnessRole`, `moltWitnesses({ name, parents, friend, rival, groundOf })`, `MOLT_VISIT_STEPS`, `SHELLCAP_ART_KEY`.
- `game/src/world/growth.ts` — `greeted?: boolean` on `GrowthRecord` (additive).
- `game/src/world/reachability.ts` — register `shellcap` as world-placed.
- `game/src/scenes/WorldScene.ts` — `hatchEgg` writes a record + half scale; `moltDino` queues `moltVisits`;
  world-step branch walks witnesses, resolves on arrival (lore hook), drops after the budget; `shellCaps` follow young
  dinos when art exists, destroyed at the molt; hook `__moltVisits`.

**Files to create:** `game/src/world/cycle-188-witness.test.ts`, `tests/e2e/cycle-188-seen-grown.spec.ts` (shared).

**Reuse:** `stepToward`, `chebyTiles`, `tileOf`, `zoneOf(this.dinoZones, …)`, `bestFriendOf`, `worstRival`, `born`
parents, `hasPropArt`/`bakePropArt`, `__layEgg`/`__forceHatch`/`__moltNow`/`__stepWorld`.

**New dependencies:** none.

**Test plan:** unit — witness order/filter/dedup. e2e — friend walk on a fresh save; hatchling young at half size;
parents queued at a hatchling's molt.

**Risks:** the founding molt now pulls Bramble off its wander for a few steps after 14:00 — specs asserting
Bramble's activity/position after day-1 14:00 may shift.

## Lore track — BACKLOG-605

**Files to modify:**
- `game/src/world/molt.ts` — `witnessLine(role, name)`, `witnessMemory(name)`, `stageOpener(stage, rec)`.
- `game/src/scenes/WorldScene.ts` — arrival speaks + remembers + ticker; `pickTone` inserts `stageOpener`, sets
  `greeted` on the first grown greet and saves.

**Reuse:** `showBubble`, `remember`, `logEvent`, `stageNow`, the `text` join in `pickTone`.

**Test plan:** unit (same file) registers + opener; e2e greet before/after molt, Rex unchanged, reload keeps `greeted`.

**Estimated touch count:** ~7 files.

## Shipped

**Files touched:** `game/src/world/molt.ts`, `game/src/world/growth.ts`, `game/src/world/reachability.ts`,
`game/src/scenes/WorldScene.ts`, `game/src/world/cycle-188-witness.test.ts` (new),
`tests/e2e/cycle-188-seen-grown.spec.ts` (new). 6 files.

**Deviations:**
- The witness walk is a branch in the world-step loop beside the console walk (no separate method); arrival calls
  `arriveAtMolt`, which carries the lore line, memory and ticker post (`Bramble → Pip: Look at you, Pip!`).
- The shell cap is placed per frame from `update()` and costs one `hasPropArt` check while the rig is undrawn.

**Build:** clean. **Unit:** 3376 green (327 files). **e2e (new + 187):** 6/6 (two cold-boot timeouts on the first
run, green on re-run). **Boundary:** web-llm only under `game/src/ai/`.
