# Cycle 17 — Lore+Design+Code-plan (BACKLOG-011)

## Item
BACKLOG-011 [ai] NPC memory store — each dino remembers recent events (you greeting it, gifts + reactions, meeting other dinos), fed into its prompt, persisted across sessions, with a daily reflection at dawn.

## What ships
A per-dino ring buffer of recent event strings. Greeting / gifting / meeting push an event. The last few are woven into the dino's system prompt ("Lately: …"), so it reacts to history ("back again, eh?"). Memory rides into the save, so a dino remembers you next session. At dawn (06:00) each dino folds its events into a one-line reflection.

## Files
- `game/src/ai/memory.ts` (new) — pure `MemoryStore`, `remember(store,name,event,maxN=6)` (immutable, capped), `recall`, `reflect(events)`.
- `game/src/ai/webllmBrain.ts` (mod) — `buildMessages` weaves `ctx.recentMemory` (last 3) into the system prompt.
- `game/src/world/saveGame.ts` (mod) — `SaveData.memory` (additive, version 1, default {}).
- `game/src/scenes/WorldScene.ts` (mod) — record events on greet/gift/converse; pass `recentMemory: recall(...)` into greet + `__greetPrompt`; persist + restore memory; dawn reflection on `onHour`; `__memory` hook.
- `tests/unit/memory.test.ts` (new), `tests/e2e/cycle-017-memory.spec.ts` (new).

## Reuse
- `NPCContext.recentMemory` already exists (cycle 4) — finally populated.
- Save path (cycle 3) + `onHour` (cycle 1) + greet/gift/converse hooks.

## Tests
- unit: `remember` caps to maxN + immutable; `recall`; `reflect` empty vs non-empty; save round-trips `memory`, v1-without-memory → {}.
- e2e: `__greet('Rex')` then `__memory().Rex` non-empty; reload → still remembered; `__greetPrompt('Rex')` contains "Lately" after a greet.
- prior suites green.

## Risks
- **Prompt bloat:** cap woven memory to last 3, events are short. Fine within 200-char replies.
- **Save growth:** memory is small strings; additive, version unchanged (v1 saves still load).

## Touch: 6 files.
