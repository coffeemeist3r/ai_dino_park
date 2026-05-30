# Changelog

Append-only. Validator adds an entry on APPROVED verdicts. Format:

```
## Cycle NNN — YYYY-MM-DD
- BACKLOG-NNN: <title> — <one-line outcome>
```

---

## Cycle 016 — 2026-05-30

- BACKLOG-006: Device probe — APPROVED. The brain sizes the model to the device instead of hardcoding 0.5B: pure `pickTier` scores `navigator.deviceMemory` + the WebGPU adapter's max storage-buffer size into tiny (0.5B) / small (1.5B) / medium (3B), and `defaultLoader` loads that model; choice surfaced via `window.__modelLabel`/`__modelInfo`. (Browsers can't write `config.json` — selection is exposed instead.) 5 new unit + 1 new e2e.

## Cycle 015 — 2026-05-30

- BACKLOG-055: Livelier character voice — APPROVED. Diagnosed bland replies: the prompt threw away the vivid roster flavor (only dry trait adjectives reached the model), was negative-heavy, and the output was triple-truncated (one sentence + 60 tokens + first-sentence-only cleaner). Fix: the system prompt now leads with character and feeds BOTH the roster flavor ("loves rocks", "quick to bolt") and the trait adjectives, with a single light "never a chatbot or helper" clause and an invitation for "one or two vivid, specific sentences"; `cleanReply` keeps up to 2 sentences; generation is `max_tokens 100` / `temperature 0.9`. 66 unit / 32 e2e green.

## Cycle 014 — 2026-05-30

- BACKLOG-052: NPC↔NPC dialogue — APPROVED. Dinos now drift toward each other (~45% of steps via pure `stepToward`) so they actually cluster and meet, and on meeting one speaks a brain-generated line (`npc_meet`) in a floating speech bubble above it (🧠-tagged when model-written), throttled by a cooldown + in-flight guard to protect the single shared engine. Also added a WebGPU guard so the brain fails fast to the canned fallback (and skips a doomed worker) on browsers without WebGPU. 3 new unit + 2 new e2e.

## Cycle 013 — 2026-05-30

- BACKLOG-053: Sane controls — APPROVED. WASD movement (arrows kept), E to interact and F to give (Z/G kept as aliases), save-export moved off E to O, plus an on-screen controls hint. 2 new e2e.

## Cycle 012 — 2026-05-30

- BACKLOG-051: Richer dialogue context — APPROVED. The WebLLM prompt now carries the time of day (`dayPhase`), the dino's current mood (`moodFromTraits`), and the player's friendship level (hearts → `relationshipLabel`), and the greet line itself changes with the relationship (stranger → dear friend). Pure prompt enrichment reusing three existing signals; verifiable via the new `__greetPrompt` dev hook. 2 new unit + 2 new e2e; 7/7 AC pass. Directly targets the "mostly hellos" sameness.

## Cycle 011 — 2026-05-30

- BACKLOG-018: NPC movement + meeting spine — APPROVED. Dinos wander the map (pure `wanderStep`, clamped, driven off the world clock at a gentle throttle) and record a symmetric pairwise "meeting" tally when two end a step adjacent (pure `recordMeet` — the seed of pairwise affinity), flashing both labels. `nearestDino` reads live positions, so greeting/gifting follow a dino wherever it roams. LLM dino-to-dino dialogue deferred to BACKLOG-052. 5 new unit + 2 new e2e; 8/8 AC pass.

## Cycle 010 — 2026-05-30

- BACKLOG-049: WebLLM Web Worker offload + observability — APPROVED. Inference moved into a dedicated Web Worker via `CreateWebWorkerMLCEngine`, so model load/generation no longer block the render loop (build confirms web-llm split into its own worker chunk). Added a brain-status HUD (🧠 thinking… / ready / offline) and a per-reply `source` tag that prefixes 🧠 on lines the model actually generated — so the player can tell a real LLM line from the canned fallback. 2 new unit + 2 new e2e; smoothness/tag is a human WebGPU check.

## Cycle 009 — 2026-05-30

- BACKLOG-015: Gift system — APPROVED. Hold one of five items (shiny shell, wildflower, smooth rock, sparring stick, mossy snack), cycle with [ / ], press G near a dino to give it. A pure `giftReaction` scores the item's appeal against the dino's personality → loved / liked / neutral / disliked, and the affinity delta rides the existing friendship store + save. The reaction reads out in the dialog box. 7 new unit + 2 new e2e; 9/9 AC pass. Personality now changes what the player should do.

## Cycle 008 — 2026-05-30

- BACKLOG-048: In-character dino dialogue — APPROVED. Fixes the assistant-voice the live spot-check exposed: a hardened system prompt ("You are NOT an AI assistant…") with a one-shot in-character example, plus a pure `cleanReply` that strips wrapping quotes, drops assistant boilerplate, and keeps the first in-character sentence (falling back to a canned line if nothing survives). Deterministic guardrail means help-desk text can't reach the dialog box regardless of model output. 5 new/updated unit tests; voice-quality is a human re-greet follow-up.

## Cycle 007 — 2026-05-30

- BACKLOG-005: WebLLM-backed brain — APPROVED. `WebLLMBrain` runs Qwen2.5-0.5B in the browser via WebGPU, lazy-loaded on first greet behind the `NPCBrain` boundary (only `ai/webllmBrain.ts` imports `@mlc-ai/web-llm`, dynamic/code-split). Progressive + safe: instant canned fallback while loading or without WebGPU, never throws/blocks; one engine shared across all dinos. Prompt built from name/species/personality. 6 new/updated unit (incl. fake-engine generate path) + 2 new e2e; automatable AC pass. Live token generation deferred to a human spot-check (BACKLOG-047) — WebGPU confirmed available, but the verify harness couldn't drive a real greet.

## Cycle 006 — 2026-05-29

- BACKLOG-016: Friendship hearts — APPROVED. The first player-facing loop: greeting a dino raises affinity (0–100 points → 0–10 hearts), **C** toggles a collection panel listing all five dinos with heart bars, and the affinity persists in the IndexedDB save. Gain scaled by the dino's warmth/sociability (cycle-4 traits). Pure `friendship.ts`; additive save field (`SAVE_VERSION` unchanged, old saves default to empty). 7 new unit + 2 new e2e; 9/9 AC pass.

## Cycle 005 — 2026-05-29

- BACKLOG-017: Spawn 5 NPCs — APPROVED. A pure `ROSTER` (Rex, Mossback, Sunny, Twitch, Glade) with distinct species, spawn tiles, and colors; each dino's personality is seeded from its name (cycle 4). WorldScene spawns the cast via a loop reusing the `Dino` class; Rex anchored at `dinos[0]` for save/personality continuity. 4 new unit + 4 new e2e; 9/9 AC pass.

## Cycle 004 — 2026-05-29

- BACKLOG-010: NPC personality traits — APPROVED. 5 axes (curiosity, sociability, energy, agreeableness, bravery) seeded deterministically from a dino's name via `seededPersonality` (stable across reloads, not stored in save). `describePersonality` renders dominant poles into a brain-ready phrase. Traits flow through `NPCContext` (boundary intact) and the stub brain's mood now reflects them. 6 new unit + 2 new e2e; 9/9 AC pass.

## Cycle 003 — 2026-05-29

- BACKLOG-009: Save / load via IndexedDB — APPROVED. World survives a refresh: in-game time + player position restore on boot, auto-save fires each in-game hour, **E** exports a `dino-save.json`. Pure version-gated `serialize`/`deserialize` (`saveGame.ts`) split from raw-IndexedDB I/O (`saveStore.ts`); clock reused via new `set()`. 6 new unit + 5 new e2e; 9/9 AC pass. `version:1` seam left for BACKLOG-040 migration.

## Cycle 002 — 2026-05-29

- BACKLOG-008: Day/night palette shift — APPROVED. Full-map tint overlay lerps color + alpha across the day off the cycle-1 clock: midnight blue, warm dawn/dusk, clear noon. Pure `dayNight.ts` (`tintFor`, `dayPhase`); 6 new unit + 2 new e2e; 8/8 AC pass. Lights the runway for hour-keyed features (012 dawn plans, 014 dusk reflection, 041 night huddles).
- BACKLOG-046: Vite `host: true` — APPROVED. Fixed BUG-001 (IPv6-only bind); e2e now runs on the default Playwright config, retiring the cycle-1 `.qa-override` crutch.

## Cycle 001 — 2026-05-26

- BACKLOG-007: World tick clock — APPROVED. `WorldClock` class ships; 1 real second = 1 in-game minute; HUD `Day N — HH:MM` top-left; `onTick` / `onHour` listener API; 8/8 unit tests + 3/3 e2e green. Unblocks BACKLOG-008, -012, -041+.

## Cycle 000 — 2026-05-25 — Bootstrap

- Repo initialized
- CHARTER, BACKLOG, STYLE-GUIDE, CHANGELOG written
- Game scaffolded (Phaser 3 + TS + Vite, empty scene, placeholder dino)
- Studio scaffolded (7 routine prompts, state.json, chronicle, RE-ARM)
- CI workflow written
- Cron schedule created
