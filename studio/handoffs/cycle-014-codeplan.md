# Cycle 14 — Lore + Design + Code-plan (BACKLOG-052)

## Item
BACKLOG-052 [ai] LLM-driven NPC↔NPC dialogue on meet. Operator: "haven't seen them interact; LLM interaction not running as much as hoped." Cycle 11 recorded silent meetings; this makes dinos speak when they meet — and makes meets actually happen.

## Two problems → two fixes
1. **No conversation.** On adjacency, fire `npcBrain.respond(ctx, {kind:'npc_meet', detail})` and show the line as a floating speech bubble above the speaker (🧠 tag if model-written). Bump the meeting tally. Throttle with a cooldown so the single shared engine isn't spammed.
2. **Meets are rare** (random wander, 5 dinos, big map). Bias wandering: with ~45% chance a dino steps *toward* the nearest other dino instead of randomly → they cluster and converse, so the player sees life.

## Files to modify / create
- `game/src/world/movement.ts` (mod) — add pure `stepToward(from, target, cols, rows): Tile` (one tile toward target on the larger-delta axis, clamped).
- `game/src/scenes/WorldScene.ts` (mod):
  - `forceStep`: per dino, ~45% `stepToward(nearest other)` else `wanderStep` random.
  - On an adjacent pair: `recordMeet` + flash + (if `convoCooldown<=0` and no convo in flight) `void this.converse(a,b)`.
  - `converse(a,b)`: `npcBrain.respond({name,species,personality,traits,timeOfDay}, {kind:'npc_meet', detail:'<b> the <species> wanders up'})` → `showBubble(a, 🧠?+text)`, set `lastConversation`, `convoCooldown=8`.
  - `showBubble(dino,text)`: floating text above the sprite (depth 12), auto-destroy ~3.5 s.
  - Dev hooks: `__lastConversation()`, `__forceConverse()` (forces dinos[0]×dinos[1] convo, returns the result).
- `tests/unit/movement.test.ts` (mod) — `stepToward` cases.
- `tests/e2e/cycle-014-npc-convo.spec.ts` (new) — `__forceConverse()` returns a `{speaker,text}`; over many `__stepWorld()` a meeting gets recorded (attraction makes it likely).

## Reuse
- Shared `npcBrain` (cycle 7) + `npc_meet` observation prompt (already in `OBSERVATION_PROMPT`) + `replyPrefix`/source (cycle 10) + `recordMeet` (cycle 11) + `dayPhase` (cycle 2). No new systems.

## New dependencies
none.

## Risks
- **Engine spam:** one shared 0.5B engine — guard with `convoInFlight` + `convoCooldown` so at most one NPC convo generates at a time, well-spaced. Player greet still takes priority (separate call path; acceptable overlap, both queue on the engine).
- **Headless = fallback:** no WebGPU in CI, so NPC bubbles show canned lines there — fine; the wiring + cooldown + attraction are what's tested. Live model is the human check.
- **Bubble cleanup:** destroy on timer; cap to avoid litter (cooldown already limits to ~1 at a time).

## Touch count
4 files (1 mod src, 1 mod src scene, 1 mod unit, 1 new e2e). Under ceiling.
