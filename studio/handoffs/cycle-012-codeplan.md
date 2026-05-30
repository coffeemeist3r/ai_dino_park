# Cycle 12 — Lore + Design + Code-plan (BACKLOG-051)

## Item
BACKLOG-051 [ai] Richer dialogue context — feed time-of-day, mood, and friendship level into the prompt so replies vary beyond greetings. Directly targets the operator's "mostly hellos."

## Lore / why
A dino greeted at dawn by a stranger and the same dino greeted at midnight by a 10-heart best friend should not say the same thing. We have all three signals already — `dayPhase` (clock), `moodFromTraits` (personality), and the friendship hearts — but none reach the prompt. Wiring them in gives the model something to vary on. Pure prompt change; fully unit-testable; no model needed to verify the prompt is richer.

## Files to modify
- `game/src/ai/brain.ts` — `NPCContext` gains optional `timeOfDay?: string` and `affection?: number` (0–10 hearts).
- `game/src/ai/webllmBrain.ts`
  - `export function relationshipLabel(affection?: number): string` — ≥7 "a dear friend you adore", ≥3 "a good friend", ≥1 "an acquaintance", else "a stranger you just met".
  - `buildMessages` weaves in: `It is ${timeOfDay} in the park.` (when present), `You are feeling ${moodFromTraits(traits)}.`, `The visitor is ${relationshipLabel(affection)}.`; the real user line is relationship-aware for `player_greet`.
- `game/src/entities/dino.ts` — `greet(extra?: Partial<NPCContext>)` merges `extra` into the context.
- `game/src/scenes/WorldScene.ts` — on greet, pass `{ timeOfDay: dayPhase(now.hour), affection: heartsFromPoints(friendship[name]) }`; add `__greetPrompt(name)` dev hook returning the system message for that dino with current enrichment.

## Reuse
- `dayPhase` (cycle 2), `moodFromTraits` (cycle 8), `heartsFromPoints` (cycle 6) — all reused, none reimplemented.
- Existing `buildMessages` one-shot structure + `cleanReply` + fallback — unchanged behavior, just richer system/user text.

## New dependencies
none.

## Test plan
### Unit — `tests/unit/brain.test.ts`
- `relationshipLabel`: 0→stranger, 2→acquaintance, 5→good friend, 9→dear friend.
- `buildMessages` with `timeOfDay:'night'` + `affection:10` → system contains "night" and the dear-friend phrase; with `affection:0` → "stranger"; the two systems differ.
- existing brain tests stay green (fields optional).
### E2E — `tests/e2e/cycle-012-context.spec.ts`
- `__advanceMinutes(840)` (→ ~22:00 night), then `__greetPrompt('Rex')` contains "night".
- greeting still returns a reply source (regression).

## Risks
- **Prompt length creep:** a few short clauses; still bounded. Fine.
- **`__greetPrompt` reaching into the brain's pure builder:** it calls `buildMessages` (exported pure fn) with a context the scene assembles — no boundary issue.
- Optional fields keep all prior brain/dialogue tests valid.

## Estimated touch count
6 files (3 modified src, 1 modified unit, 1 new e2e, + this combined handoff). At the ceiling.
