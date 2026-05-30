# Cycle 16 — Lore+Design+Code-plan (BACKLOG-006)

## Item
BACKLOG-006 [ai] Device probe — detect device capability, pick model size (0.5B/1.5B/3B). A stronger machine → a bigger, less-bland model (follows from cycle-15 ceiling note).

## What ships
A pure tier picker + a browser probe. On load the brain probes `navigator.deviceMemory` and the WebGPU adapter's `maxStorageBufferBindingSize`, picks a tier (tiny 0.5B / small 1.5B / medium 3B), and loads that model instead of the hardcoded 0.5B. Chosen model is surfaced (`window.__modelLabel`, brain HUD). Note: browsers can't write `config.json`; we expose + cache the choice instead (no server).

## Files
- `game/src/ai/deviceProbe.ts` (new) — pure `pickTier(caps)`, `pickModel(caps)`, `MODELS` (tier→{id,label}); browser `probeDevice()`, `currentModel()`.
- `game/src/ai/webllmBrain.ts` (mod) — `defaultLoader` uses `currentModel()`'s id; set `window.__modelLabel`.
- `game/src/scenes/WorldScene.ts` (mod) — `__modelInfo` dev hook (probe+pick) + show model in the brain HUD line.
- `tests/unit/deviceProbe.test.ts` (new), `tests/e2e/cycle-016-model.spec.ts` (new).

## Picker (pure, testable)
`score = (deviceMemory≥8?2:deviceMemory≥4?1:0) + (maxBufferBytes≥1e9?1:0)`; `score≥3→medium, ==2→small, else tiny`.
MODELS: tiny `Qwen2.5-0.5B-Instruct-q4f16_1-MLC`, small `…1.5B…`, medium `…3B…`.

## Tests
- unit: pickTier across caps combos; pickModel maps tier→id/label.
- e2e: `__modelInfo()` resolves to a known tier (headless → tiny).
- prior suites green.

## Risks
- Real VRAM isn't exposed in-browser; `deviceMemory` (Chrome, ≤8) + adapter buffer cap are proxies — good enough to avoid OOM on weak devices; conservative default tiny.
- Bigger models = bigger downloads; that's the user's machine's call, picker only sizes it.

## Touch: 5 files.
