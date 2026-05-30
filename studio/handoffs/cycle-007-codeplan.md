# Cycle 7 — Code-plan

## Item
BACKLOG-005 [ai] WebLLM-backed brain — Qwen2.5-0.5B, lazy-loaded on first dialog.

## Key design decision (testability + safety)
`WebLLMBrain.init()` takes an injectable **engine loader** (`() => Promise<ChatEngine>`) defaulting to the real dynamic import. This lets unit tests inject a fake engine (verify the generate+trim path) or a rejecting loader (verify the fallback path) — so everything except the actual model download is automatable in Node. The real model is the one manual check.

Also: **all dinos share ONE `WebLLMBrain` instance** — five engines would mean five model downloads. One engine, passed to every dino.

## Files to create
- `game/src/ai/webllmBrain.ts` — the only file that touches `@mlc-ai/web-llm`.
  - `export type BrainStatus = 'idle' | 'loading' | 'ready' | 'fallback'`
  - `interface ChatEngine { chat: { completions: { create(req): Promise<{ choices: { message: { content: string } }[] }> } } }`
  - `export function buildMessages(ctx, obs)` — pure; system message = name + species + `describePersonality(ctx.traits) ?? ctx.personality` + "reply in one short in-character sentence"; user message from an observation-kind map.
  - `const MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC'`
  - `class WebLLMBrain implements NPCBrain` with `status()`, `respond(ctx,obs)` (ready→generate, else kick init + return `cannedReply(ctx)`; never throws/blocks), `init(loader = defaultLoader)` (try→ready, catch→`console.error`+`fallback`), private `generate()` (engine call, trim ≤200, mood from traits).

## Files to modify
- `game/src/ai/brain.ts`
  - Extract `export function cannedReply(ctx): Reply` from `StubBrain` (canned text + `moodFromTraits`); `StubBrain.respond` returns it. (Shared fallback, no duplication.)
  - Add optional `status?(): string` to the `NPCBrain` interface (generic string, not WebLLM-specific — keeps the boundary clean for the dev hook).
  - `makeBrain('webllm')` returns `new WebLLMBrain()` (import from `./webllmBrain`). The cyclic type/`cannedReply` import is runtime-safe (only used inside methods, not at module eval).
- `game/src/scenes/WorldScene.ts`
  - Create one shared `const brain = makeBrain('webllm')`; pass the same `brain` to every dino in the ROSTER loop; store `this.npcBrain = brain`.
  - Dev hook `__brainStatus = () => this.npcBrain.status?.() ?? 'n/a'`.
- `game/package.json` + `game/package-lock.json` — `@mlc-ai/web-llm@0.2.84` (installed; committed in the coder commit).

## Reuse list
- `NPCBrain`/`NPCContext`/`Observation`/`Reply` + `cannedReply`/`moodFromTraits` from `brain.ts` — reuse for types and the fallback.
- `describePersonality` (010) for the system prompt — reuse, do not re-render traits.
- The existing Z-dialog flow + `Dino.greet()` — unchanged; the brain swap is transparent to it.
- `__clockNow` dev-hook pattern.

## New dependencies
`@mlc-ai/web-llm@0.2.84` — already installed. **Charter-sanctioned** (Tech stack §: "NPC brains: WebLLM, Qwen2.5"). Not a new top-level framework requiring amendment.

## Test plan
### Unit (vitest) — extend `tests/unit/brain.test.ts`
- `makeBrain('webllm')` returns an object with an async `respond` and does NOT throw (replaces the old "throws until BACKLOG-005").
- `buildMessages`: system contains name, species, personality phrase; user reflects `obs.kind`; exactly 2 messages.
- `respond()` before init → non-empty canned reply (no WebGPU in Node), status stays `idle`/`loading`.
- `init(() => Promise.reject(...))` → status `fallback`; `respond()` still non-empty.
- `init(() => fakeEngine)` where fake returns a 300-char string → status `ready`; `respond()` returns that text trimmed to ≤200.
### E2E (playwright) — `tests/e2e/cycle-007-brain.spec.ts`
- boot → `__brainStatus()` is a defined string; no page error.
- greet a dino → reply text appears (headless has no WebGPU, so this exercises the fallback path — which is exactly the safety net we need to prove).
- cycle-2..6 suites stay green.
### Manual (recorded in QA)
- Real browser w/ WebGPU: greet → status goes `loading`→`ready` → a generated (non-canned) reply appears.

## Risks
- **Boundary:** only `webllmBrain.ts` may import `@mlc-ai/web-llm`. Verify by grep; scenes/entities must not.
- **Five-engine trap:** dinos MUST share one brain instance — enforced in the spawn loop.
- **Cyclic import** brain↔webllmBrain: safe because the cross-refs are used only inside methods at runtime, never at module-evaluation time. Build will confirm.
- **Bundle size:** dynamic `import()` code-splits web-llm out of the entry chunk so boot stays fast; the existing chunk-size warning is pre-existing and not worsened for the entry bundle.
- **Node loading web-llm:** avoided in tests via the injected loader — the real dynamic import only runs in the browser.

## Estimated touch count
6 logical files (1 new src, 2 modified src, dep manifest, 1 modified unit, 1 new e2e). At the ceiling; `webllmBrain` tests folded into `brain.test.ts` to avoid a 7th.

## Shipped
**Files touched:**
- `game/src/ai/webllmBrain.ts` (new) — `WebLLMBrain` (status, lazy `init(loader?)`, never-throw `respond`, `generate` trim≤200), pure `buildMessages`, `ChatEngine`/`EngineLoader`/`BrainStatus`. Only file importing `@mlc-ai/web-llm` (dynamic import).
- `game/src/ai/brain.ts` (modified) — extracted `cannedReply`, exported `moodFromTraits`, added optional `status?()` to `NPCBrain`, `makeBrain('webllm')` returns `WebLLMBrain`.
- `game/src/scenes/WorldScene.ts` (modified) — one shared `webllm` brain across all dinos, `__brainStatus` hook.
- `game/package.json` + `game/package-lock.json` — `@mlc-ai/web-llm@0.2.84`.
- `tests/unit/brain.test.ts` (modified) — 6 tests (stub, webllm-no-throw, buildMessages, loading-fallback, forced-fail fallback, ready+trim via fake engine).
- `tests/e2e/cycle-007-brain.spec.ts` (new) — 2 tests (boot status + error-free, fallback greet).
- `.claude/launch.json` (new) — dev-server config for the manual verify attempt (out-of-plan dev convenience; no runtime impact).

**Deviations:** one test-only fix — the "before ready" unit test originally let `respond()` auto-kick the *real* loader in Node, producing an unhandled web-llm rejection; rewritten to inject a never-resolving loader so status is `loading` and the real import never runs in Node. No production deviation.

**Build + test status:**
- `npm run build` — ✅ exit 0 (web-llm dynamic-imported, code-split out of the entry chunk; pre-existing chunk-size warning unchanged).
- `npm run test:unit` — ✅ 41/41 (added 4 net new brain/webllm; the one `console.error` printed is the *expected* forced-fail fallback log).
- `npx playwright test` — ✅ 20/20 (default config).
- Dev server — ✅ HTTP 200.
