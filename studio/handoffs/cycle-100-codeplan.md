# Cycle 100 — Code plan

## Structure track — BACKLOG-437

**Files**
- `game/src/world/foodweb.ts` — add `HUNT_SUCCESS_CHANCE = 0.3` + `huntSucceeds(roll, chance?)`.
- `game/src/scenes/WorldScene.ts` — fork the `huntCaught` body (~L2514) into catch/empty.

**Reuse (no new plumbing):** `satisfy`, `pressingNeed`, `Needs` (`world/needs`, already imported);
`flashFeed`, `logEvent`, `remember` (already in scope); `huntCaught`, `HUNT_COOLDOWN_MS`, `huntCooldownUntil`
(cycle 99).

**Change detail (WorldScene):**
```
if (huntCaught(cur, preyTile)) {
  this.huntCooldownUntil[d.name] = Date.now() + HUNT_COOLDOWN_MS;
  this.flashFeed(prey, '💨');
  if (huntSucceeds(Math.random())) {
    this.needs = satisfy(this.needs, d.name, 'hunger');
    this.flashFeed(d, '🍖');
    this.logEvent(`🦖 ${d.name} made its catch — a lean meal`);
    this.memory = remember(this.memory, d.name, `you brought down a meal`);
    this.memory = remember(this.memory, preyName, `you slipped ${d.name}'s hunt`);
  } else {
    this.logEvent(`🦖 the hunt came up empty — ${preyName} slipped away from ${d.name}`);
    this.memory = remember(this.memory, d.name, `your hunt for ${preyName} came up empty`);
    this.memory = remember(this.memory, preyName, `you slipped ${d.name}'s hunt`);
  }
  this.activityById[d.name] = 'stalking';
  continue;
}
```
(Prey memory is identical in both — the prey always slips away; hoist the 💨 + cooldown above the fork.)

## Lore track — BACKLOG-440

**Files**
- `game/src/world/foodweb.ts` — add `recentHunter(memories)`.
- `game/src/ai/brain.ts` — `NPCContext.rattled?: string`; `rattledAside(hunter, traits)`; compose in
  `cannedReply` after the hunger aside.
- `game/src/ai/webllmBrain.ts` — parity prompt hint alongside the existing 368 hunger hint.
- `game/src/scenes/WorldScene.ts` — add `rattled: recentHunter(recall(this.memory, target.name)) ??
  undefined` to the `pickTone` greet context (~L3966); import `recentHunter`.

**Reuse:** `PRICKLY_MAX`/`EFFUSIVE_MIN` + the `hungryAside` shape (brain.ts); `recall` (already imported in
WorldScene); the 368 hungry LLM-hint pattern (webllmBrain).

**`recentHunter` impl:** regex `/slipped (.+?)'s hunt/`, scan `for (let i = memories.length-1; i>=0; i--)`,
return the first capture, else null.

## Test plan (unit — pure logic)
- `game/src/world/foodweb.test.ts` (extend): `huntSucceeds` boundaries (0 true, 0.99 false, default chance
  in range); `recentHunter` (match, newest-wins, empty, no-match).
- `game/src/ai/brain.test.ts` — **check if it exists**; if not add `tests/unit/cycle-100-rattled.test.ts`:
  `rattledAside` names hunter + 3 temperament variants + leading space; `cannedReply` with `rattled`
  appends and composes with `hungry`; `cannedReply` without `rattled` byte-identical to baseline.
- Glue ACs (437 branch wiring, 440 greet wire) verified by review + build; the e2e boot spec is the known
  cold-boot flake (green warm).

## Bar
`npm run build` clean, `tsc --noEmit` clean, `npx vitest run` green, WebLLM `ai/`-only, no save change.

phase → coder-pending

---
## SHIPPED (coder)
- 437: `huntSucceeds`/`HUNT_SUCCESS_CHANCE` in foodweb.ts; hunt branch forked (💨+cooldown+prey memory hoisted, catch = satisfy+🍖+catch log+meal memory, empty = cycle-99 path). Deathless both ways.
- 440: `recentHunter` in foodweb.ts; `NPCContext.rattled` + `rattledAside` in brain.ts (composed after hunger aside, cap 280); webllm parity hint; greet wire in WorldScene.pickTone.
- **Infra fix (root cause):** `vitest.config.ts` include was `tests/unit/**` only, so cycle-99's colocated `game/src/**/*.test.ts` (diet/foodweb/lenses, 16 tests) — and this cycle's foodweb additions — **silently never ran** (vitest green while skipping them). Broadened include to `['tests/unit/**/*.test.ts','game/src/**/*.test.ts']`. Suite went 124→127 files, 1108→1130 tests, all green. This is the real remnant of BACKLOG-439 (harness existed but under-collected).
- build clean, tsc clean, WebLLM ai/-only, no save change.
