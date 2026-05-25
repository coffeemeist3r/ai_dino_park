# Charter — AI Dino Park

> This file is the constitution. Every routine reads it at the start of every fire. When this file changes, behavior changes next cycle. Humans amend this file; routines obey it.

## North Star

A 2D top-down Pokemon-Gen3-style world populated by dinosaurs. Each NPC dinosaur is driven by a small local LLM (Qwen-family via WebLLM, running in the player's browser — no servers). The dinos go about their lives, form relationships, develop personalities, occasionally invent religions, sometimes hold elections. The player wanders the park, befriends dinos, watches civilization emerge.

Vibe references:
- **Pokemon FireRed / LeafGreen / Emerald** (palette, tile feel, dialog box style)
- **Stardew Valley** (friendship hearts, gifting, festivals, romance, marriage)
- **Project Sid** (emergent roles, governance, religion, ablation-proof autonomy)
- **Smallville** (Stanford generative agents — observation, memory, reflection, daily planning)
- **ChatDev** (this very build pipeline)

## Anti-goals

- ❌ Multiplayer (single-player only, mobile-friendly)
- ❌ Monetization, ads, accounts, telemetry
- ❌ Cloud-required gameplay (LLM runs in browser; game must work offline once loaded)
- ❌ Frameworks beyond Phaser 3 + Vite + WebLLM unless charter amended
- ❌ Half-shipped features (Validator must reject anything not playable end-to-end)
- ❌ Editing CLAUDE.md / CHARTER.md from a routine without a human-approved amendment

## Tech stack (locked)

- **Game:** Phaser 3 + TypeScript + Vite (dev) + Vitest (unit) + Playwright (e2e)
- **NPC brains:** WebLLM, Qwen2.5-Instruct (0.5B / 1.5B / 3B selected at runtime by device probe)
- **Persistence:** IndexedDB + JSON save export
- **Maps:** Tiled (`.tmx` source, `.json` runtime)
- **Mobile (future):** Capacitor wrapper + `@cantoo/capacitor-llama` native plugin behind the `NPCBrain` interface
- **No backend.** Everything client-side.

The `NPCBrain` interface (in `game/src/ai/brain.ts`) is a hard boundary. WebLLM-specific code must not leak past it. This is what lets us swap to native inference on mobile.

## Quality bar

- Every shipped cycle must `npm run build` clean
- Vitest passes
- Playwright e2e covers the new feature at least once
- New code reuses existing utilities — Coder checks for prior art before adding new modules
- No silent failures — errors must reach `chronicle.md`
- File comments are rare. Code should explain itself.

## Routine contract (the chain)

One full cycle = one BACKLOG item shipped (or REWORK'd or ABANDON'd).

| # | Routine | Reads | Writes | Model | Verb |
|---|---|---|---|---|---|
| 1 | Lore-smith | CHARTER, BACKLOG, last verdict | `studio/handoffs/cycle-NNN-lore.md`, appends to BACKLOG | Opus | brainstorm |
| 2 | Designer | CHARTER, BACKLOG, lore | `cycle-NNN-design.md` (chosen item, spec, acceptance criteria) | Opus | spec |
| 3 | Code-planner | design, existing code | `cycle-NNN-codeplan.md` (files, fns, reuse list, test plan) | Sonnet | plan |
| 4 | Coder | codeplan | code commit, updates codeplan with "shipped" | Sonnet | build |
| 5 | QA | design (acceptance), changes | `cycle-NNN-qa.md` (pass/fail per criterion), runs tests | Sonnet | verify |
| 6 | Validator | everything in cycle | `cycle-NNN-verdict.md` (APPROVED / REWORK / ABANDON), updates CHANGELOG + BACKLOG + chronicle | Opus | judge |
| 7 | Artist (async) | BACKLOG art tasks, STYLE-GUIDE | sprite files + chronicle entry | (image API) | draw |

**Cycle number is monotonic.** Lore-smith bumps it. State lives in `studio/state.json`.

## Verdict semantics

- **APPROVED** — feature ships. CHANGELOG entry added. BACKLOG item closed. Next cycle pulls next item.
- **REWORK** — design or code is wrong. Validator notes specifically what. Next cycle's Designer re-attempts the same BACKLOG item with the rework notes in context.
- **ABANDON** — item is bad / infeasible / duplicates existing functionality. Mark closed in BACKLOG with reason. Move on.

After 3 REWORKs on the same item → auto-ABANDON. Validator enforces.

## Human override channels

The human can:
1. **Edit CHARTER.md** — strongest. Next cycle obeys.
2. **Edit BACKLOG.md** — reorder, add, remove. Routines pick up next cycle.
3. **Edit code by hand** — discouraged. If you must, write `[HUMAN EDIT]` in the commit so Coder knows not to "fix" it.
4. **`stop` a routine** — kill the cron job manually.

The human will NOT:
- Write code for new features (defeats the experiment)
- Skip the chain (defeats the experiment)
- Talk directly to in-game NPCs through anything but the in-game dialog UI

## Stack-specific rules for routines

- **Coder MUST** run `npm run build && npm test` before committing. If either fails, do not commit — write the failure into `cycle-NNN-codeplan.md` "blocker" section so QA sees it.
- **QA MUST** run `npx playwright test` headless on the latest code. Screenshot failures go in `tests/.qa-screenshots/`.
- **Validator MUST** read the full cycle (lore + design + codeplan + qa) before judging.
- **All routines MUST** commit their work before ending. Empty cycles are allowed (no-op commit + chronicle note explaining why).

## Amendment log

- 2026-05-25: Charter v0 — bootstrap.
