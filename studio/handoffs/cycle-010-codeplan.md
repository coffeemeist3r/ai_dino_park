# Cycle 10 — Code-plan

## Item
BACKLOG-049 [ai] Web Worker offload + brain status/source observability.

## Files to create
- `game/src/ai/webllm.worker.ts` — `import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm'; const handler = new WebWorkerMLCEngineHandler(); self.onmessage = (e) => handler.onmessage(e);`
- `tests/e2e/cycle-010-brain-status.spec.ts`

## Files to modify
- `game/src/ai/brain.ts`
  - `Reply` gains optional `source?: 'llm' | 'canned'`.
  - `cannedReply` returns `{ ..., source: 'canned' }`.
  - `export function replyPrefix(source?: Reply['source']): string` → `source === 'llm' ? '🧠 ' : ''` (pure, for the dialog).
- `game/src/ai/webllmBrain.ts`
  - `defaultLoader` now: `const worker = new Worker(new URL('./webllm.worker.ts', import.meta.url), { type: 'module' }); return (await webllm.CreateWebWorkerMLCEngine(worker, MODEL_ID)) as unknown as ChatEngine;` (dynamic import of web-llm kept for the named exports).
  - `generate()` returns `{ text, mood, source: 'llm' }`.
  - track `private lastSource: 'llm' | 'canned' | null = null`; set it in `respond` (llm on success, canned otherwise); `lastReplySource()` accessor.
- `game/src/scenes/WorldScene.ts`
  - Brain-status HUD (top-right, depth 11): updated each clock tick from `npcBrain.status?.()` → `🧠 zzz/thinking…/ready/offline`.
  - In `handleInteract`, prefix the shown reply with `replyPrefix(reply.source)`. (Need the reply object — `Dino.greet()` currently returns only text; extend it to return the `Reply` or add a `greetReply()` that returns `{text, source}`. Minimal: change `greet()` to return `Reply` and update the one call site.)
  - Dev hook `__lastReplySource = () => (this.npcBrain as { lastReplySource?: () => unknown }).lastReplySource?.() ?? null`.
- `game/src/entities/dino.ts`
  - `greet()` returns the full `Reply` (text + source) instead of just `string`. (One call site in WorldScene.)

## Reuse list
- web-llm's `CreateWebWorkerMLCEngine` + `WebWorkerMLCEngineHandler` — the library's own worker path; no hand-rolled messaging.
- The injected-loader seam (cycle 7) — unit tests pass a fake engine, never a Worker.
- `replyPrefix`/`source` flow through the existing `Reply`/dialog — additive.
- Clock `onTick` for the status HUD refresh; existing HUD pattern.

## New dependencies
none.

## Test plan
### Unit — extend `tests/unit/brain.test.ts`
- fake-engine ready path → `reply.source === 'llm'`; `replyPrefix('llm') === '🧠 '`.
- loading/fallback → `respond` reply `source === 'canned'`; `replyPrefix('canned') === ''`.
- `cannedReply(ctx).source === 'canned'`.
### E2E — `tests/e2e/cycle-010-brain-status.spec.ts`
- `__brainStatus()` ∈ known set; a status HUD text object exists on screen (via a dev hook or by asserting `__brainStatus` drives something — assert the hook + that greeting sets `__lastReplySource()` to `'canned'` in headless/no-WebGPU).
- prior suites green.

## Risks
- **Vite worker bundling:** `new Worker(new URL('./webllm.worker.ts', import.meta.url), { type: 'module' })` is the Vite-supported form; `npm run build` must succeed and emit the worker chunk — verify in the coder build step.
- **Boundary count:** web-llm now imported in 2 files, both under `game/src/ai/` — grep assertion updated to "only under ai/".
- **greet() signature change:** ripples to one call site (WorldScene.handleInteract) and is covered by the existing greet e2e (still returns a reply).
- **Worker not spawned in tests:** guaranteed by the injected loader; never call `defaultLoader` in unit tests.

## Estimated touch count
6 files (1 new src worker, 3 modified src, 1 modified unit, 1 new e2e). At the ceiling.
