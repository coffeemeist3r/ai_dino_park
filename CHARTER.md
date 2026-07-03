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

## Living minds (core goal)

Each dino is a **distinct mind**, not a shared template with different adjectives. Distinctness and FUN are first-class goals, pursued every cycle — a dino the player can tell apart, remember, and care about beats one more polished UI panel.

- **Persona scales with the device.** Where hardware allows, a dino's persona is **LLM-authored from world lore**; where it doesn't, a **deterministic procedural persona** (name-seeded) stands in. Same dino, richness graded by tier.
- **Generate once, reuse forever.** A persona is authored a single time (first spawn / first meet), then cached and persisted in the save — never regenerated per message. A phone loading a save pays nothing.
- **Never at the cost of the thing running.** Fun and distinctness never block on inference a device can't afford. The procedural fallback and the `NPCBrain` boundary are the escape hatches; degradation is graceful, by design.
- **Minds act, not just reply.** A dino's persona drives what it *does* (plans, roles, reactions), not only what it says when spoken to.

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

## Milestones (v6)

The studio works toward a **milestone**: one player-visible headline goal spanning
~5 cycles, kept in `studio/MILESTONE.md` (headline + arc checklist per track).
Autonomous: the smiths draft it, the Validator marks arcs done and declares it
shipped (big chronicle entry), then the smiths draft the next. Cycles serve the
milestone — the smiths pick items that advance its checklist first; off-milestone
picks are allowed but need a one-line justification in the handoff.

## Routine contract (the chain)

One full cycle = **two** BACKLOG items advanced in parallel: one **lore-track**
item (social/emergent/distinctness, chosen by the Lore-smith) and one
**structure-track** item (world systems / map / jobs / build arc / infra, chosen
by the Structure-smith). Each is shipped (or REWORK'd or ABANDON'd) on its own
verdict; the two tracks are independent.

**Items are arc-sized (v6).** An item is a coherent arc slice (~half a day of
focused dev, up to ~15 files), not a one-hour micro-beat. Ship a playable arc,
not a crumb; if it can't land playable in one Coder fire, split at a playable seam.

| # | Routine | Reads | Writes | Model | Verb |
|---|---|---|---|---|---|
| 1 | Lore-smith | CHARTER, BACKLOG, last verdict | `studio/handoffs/cycle-NNN-lore.md`, appends to BACKLOG | Opus | brainstorm |
| 1.5 | Structure-smith | CHARTER, BACKLOG (Structure Track), lore | `cycle-NNN-structure.md` (chosen structure item), maintains Structure Track | Opus | brainstorm |
| 2 | Designer | CHARTER, BACKLOG, lore, structure | `cycle-NNN-design.md` (**both tracks**, spec + acceptance criteria per track) | Opus | spec |
| 3 | Code-planner | design, existing code | `cycle-NNN-codeplan.md` (files, fns, reuse list, test plan) | Sonnet | plan |
| 4 | Coder | codeplan | code commit, updates codeplan with "shipped" | Sonnet | build |
| 5 | QA | design (acceptance), changes | `cycle-NNN-qa.md` (pass/fail per criterion), runs tests | Sonnet | verify |
| 6 | Validator | everything in cycle | `cycle-NNN-verdict.md` (APPROVED / REWORK / ABANDON), updates CHANGELOG + BACKLOG + chronicle | Opus | judge |
| 7 | Artist (async) | BACKLOG art tasks, STYLE-GUIDE | pixel rig modules (`game/src/art/`) + tests + chronicle | Opus (procedural, sub-agents) | draw |

Routines 2–6 each handle **both tracks** in their fire (two sections per handoff:
`## Lore track` and `## Structure track`). The Validator issues a **verdict per
track**; a track may APPROVE while the other REWORKs, and rework re-attempts only
the failing track.

**Cycle number is monotonic.** Lore-smith bumps it (and only when **both** tracks
of the prior cycle resolved APPROVED/ABANDON — if either was REWORK, do not bump).
The Structure-smith never touches the cycle number. State lives in `studio/state.json`
(`currentItem` = lore track, `structureItem` = structure track).

## Verdict semantics

- **APPROVED** — feature ships. CHANGELOG entry added. BACKLOG item closed. Next cycle pulls next item.
- **REWORK** — design or code is wrong. Validator notes specifically what. Next cycle's Designer re-attempts the same BACKLOG item with the rework notes in context.
- **ABANDON** — item is bad / infeasible / duplicates existing functionality. Mark closed in BACKLOG with reason. Move on.

After 3 REWORKs on the same item → auto-ABANDON. Validator enforces.

## Human override channels

The human can:
1. **Edit CHARTER.md** — strongest. Next cycle obeys.
2. **Edit BACKLOG.md** — reorder, add, remove. Routines pick up next cycle.
3. **Drop an Idea Box nudge** — `studio/IDEABOX.md`. Lowest-influence: a raw seed the Lore-smith may reshape, defer, or decline. Steers attention without skipping the chain.
4. **Edit code by hand** — discouraged. If you must, write `[HUMAN EDIT]` in the commit so Coder knows not to "fix" it.
5. **`stop` a routine** — kill the cron job manually.

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
- 2026-06-01: v1 — added "Living minds" core goal (distinct per-dino personas, LLM-authored-from-lore with deterministic procedural fallback, generate-once/cache/persist, device-graded degradation, minds that act). Human-approved. Seeds BACKLOG-102/103/104.
- 2026-06-03: v2 — **Art pipeline = procedural code, not an image API.** The Artist now authors flat-vector dinos/props as pure shape rigs (`game/src/art/`) baked to animated Canvas textures, via a dedicated sub-agent per character — no API keys, no asset downloads, no copyright risk (the key-gated raster pipeline had stalled for 29 cycles). Gen3-pixel mandate retired in favour of clean flat vector at the same footprint; STYLE-GUIDE rewritten to match. Human-approved. Seeds BACKLOG-117/118; reframes BACKLOG-033–036 as vector.
- 2026-06-07: v3 — **Idea Box** added as a low-influence human override channel (`studio/IDEABOX.md`). Operator drops raw nudges; the Lore-smith considers them each cycle as seeds it may reshape, defer, or decline, then logs the call in the lore handoff. Never skips the chain. Wired into routine 1. Human-approved.
- 2026-06-19: v5 — **Structure track added (operator ruling).** A new routine **1.5 Structure-smith** fires right after the Lore-smith every cycle and picks one *structural* item (world systems, the bigger map, persistent jobs/roles, the resources→crafting→building→governance arc, save/versioning, load-bearing infra) from a new `## Structure Track` queue in BACKLOG.md. Routines 2–6 now build **both** tracks in parallel (two sections per handoff), and the Validator issues an independent verdict per track. This is the operator's counterweight to the Lore-smith's emergence-over-foundation bias, which had starved the structural backlog (zones/jobs/build arc seeded but never chosen). Cap rule: the Structure-smith only invents new structural items when fewer than X=4 remain queued (drain before invent). `state.json` gains `structureItem` + `structureVerdict`. Human-approved. Reframes BACKLOG-143/032/146/145/040 as the seed Structure Track.
- 2026-07-03: v6 — **Arc-sized cycles + milestones (operator ruling).** Three changes to escape micro-beat stagnation: (1) **Items are arc-sized** — ~half-day dev scope, up to ~15 files, playable end-to-end (replaces the ~1-hour / 6-file caps). (2) **Milestone layer** — `studio/MILESTONE.md` holds one player-visible headline goal per ~5 cycles; smiths draft it autonomously, cycles serve its checklist, Validator declares it shipped. (3) **Backlog hygiene** — closed items + the closed log live in `BACKLOG-archive.md`; the Lore-smith gets a drain-before-invent cap like the Structure-smith's. Consolidated daily runs read the canon once per session instead of per stage. Human-approved.
- 2026-06-09: v4 — **GBA-era pixel style reinstated (operator ruling).** The visual mandate returns to Pokemon Gen3 (Ruby/Sapphire/Emerald) pixel art: limited palettes, dark outlines, chunky readable overworld sprites. The **medium stays code** — pixels are authored as procedural pixel-grid rigs in `game/src/art/` baked to crisp nearest-neighbour textures; still no image APIs, no asset downloads, no keys, and **no sprite rips** (original pixels in the Gen3 *style*, never copied Nintendo assets). The cycle-37 decline of the GBA nudge was correct procedure (it needed this amendment); the operator has now made the call. STYLE-GUIDE rewritten to match; the flat-vector cast restyles one character per Artist fire (vector rigs keep rendering until each pixel rig replaces them — the build never breaks). Seeds BACKLOG-168/169; reframes 033/036/158 as pixel. Human-approved.
