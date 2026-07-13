# Cycle 100 — QA

**Bar:** `npm run build` clean · `tsc --noEmit` clean (game/) · `npx vitest run` **1130 passed / 127 files**
· WebLLM import boundary `ai/`-only (grep clean) · no save-schema change.

**Notable infra finding (fixed this cycle):** the root `vitest.config.ts` include was `tests/unit/**` only,
so cycle-99's colocated `game/src/**/*.test.ts` (diet/foodweb/lenses — 16 tests) **were never collected** —
the pipeline reported green while silently skipping them. Broadened the include; the suite grew 124→127 files
/ 1108→1130 tests, all green. This is the true remnant of BACKLOG-439 (a harness that under-collected), and it
means this cycle's foodweb tests actually execute (verified: `vitest -t huntSucceeds` now matches).

## Structure 437 — The hunt feeds

- **AC1** PASS (unit) — `huntSucceeds`: `<` boundary, 0→true / 0.99→false, custom chance, strict boundary miss.
- **AC2** PASS (unit `satisfy` + review) — success calls `satisfy(needs, hunter, 'hunger')`; hunger resolves.
  Sibling e2e `cycle-080-needs` green (the same satisfy→need-cleared path).
- **AC3** PASS (review) — success/empty both only 💨 + memory the prey; no roster mutation, no removal. Deathless.
- **AC4** PASS (review) — 💨 + `huntCooldownUntil` hoisted above the fork → both outcomes share the 30s cooldown.
- **AC5** PASS (review) — empty branch log line + both memories + unrelieved hunger identical to cycle 99.
- **AC6** PASS (review) — no ground FOODS spawn; the take is a direct `satisfy` + 🍖 tell (ponytail-noted).
- **AC7** PASS — build/tsc clean, WebLLM `ai/`-only.

## Lore 440 — Rattled after the chase

- **AC1** PASS (unit) — `recentHunter`: match, empty, no-match, newest-wins, multi-word name.
- **AC2** PASS (unit) — `rattledAside` names the hunter, 3 distinct temperament variants, each space-led.
- **AC3** PASS (unit) — `cannedReply` with `rattled` appends the aside on the fond register; composes with
  `hungry` (both present); within the 280 cap.
- **AC4** PASS (unit) — `rattled` unset is byte-identical to the prior reply (back-compat).
- **AC5** PASS (review) — WorldScene `pickTone` passes `recentHunter(recall(memory, name)) ?? undefined`.
- **AC6** PASS (unit + review) — deterministic aside from `cannedReply`; webllm hint is colour only; no save
  change. The **identical compose mechanism** (368 `hungryAside`) has a passing e2e (`cycle-097-hunger-voice`).
- **AC7** PASS — build/tsc clean, WebLLM `ai/`-only.

## e2e

Targeted regression, **warm cache, 15/15 green**: `smoke`, `cycle-097-hunger-voice` (the 368 greet-compose
twin of 440), `cycle-035-tones` (the greet/tone path 440 wires into), `cycle-080-needs` (the `satisfy` path
437 uses), `cycle-014-npc-convo`. First cold run of `smoke` timed out on `__ready` then passed 3/3 warm in
5.6s — the documented cold-boot flake (cold Vite/Phaser dep-optimize > 30s), not a regression.

**No bespoke 437/440 e2e added:** forcing a *successful* hunt (random + positional + cooldown-gated) or a
staged hunt-memory would require a new production-only `window.__` hook. Per ponytail that test-only surface
isn't worth it when the pure logic is unit-pinned and the two glue mechanisms are each already e2e-proven by a
green sibling. Recommend **APPROVE both**.

phase → validator-pending
