# Cycle 4 — Design

## Item
BACKLOG-010 [ai] NPC personality traits — 5 axes, seeded at spawn, fed into the brain prompt.

## Why this cycle
Every dino currently has the same hand-written `personality` string and a coin-flip stub brain. This cycle gives each dino a stable, distinct personality: 5 numeric axes seeded deterministically from its name, rendered into a phrase the brain reads, and — so it's observable today — wired into the stub brain's mood. It's the prompt slot BACKLOG-005 (WebLLM) will plug into, and the differentiator BACKLOG-017 (5 NPCs) needs.

## What ships
A pure `personality` module: 5 axes, each 0..1, two poles —
- curiosity: cautious ↔ curious
- sociability: solitary ↔ social
- energy: calm ↔ energetic
- agreeableness: prickly ↔ warm
- bravery: timid ↔ bold

`seededPersonality(name)` returns the same 5 values every time for a given name (stable across reloads, no save bloat). `describePersonality(p)` renders the dominant poles into a short phrase (e.g. "curious, social, bold"). Each `Dino` gets a `traits` field (seeded from its name if not supplied) and passes it into the `NPCBrain` context. The stub brain reads traits to pick its mood: a timid dino replies `wary`, a social+warm dino replies `happy`, an energetic+curious dino `excited`, otherwise `neutral`. Dialog text is unchanged (still canned) — only mood is trait-driven for now.

Dev hook: `window.__dinoTraits()` → Rex's 5-axis trait object, for QA.

## Acceptance criteria
- [ ] `seededPersonality('Rex')` returns the same object on repeated calls (deterministic) — and all 5 axes are numbers in [0,1] (unit).
- [ ] Two different names produce different trait objects (unit; not astronomically unlikely — assert at least one axis differs for a couple of sample names).
- [ ] `describePersonality` of a crafted high-curiosity/high-sociability/high-bravery personality includes "curious", "social", "bold" and excludes their opposites (unit).
- [ ] `describePersonality` of an all-0.5 personality returns a defined non-empty fallback (e.g. "even-tempered") (unit).
- [ ] The stub brain returns mood `wary` for a timid (bravery ≤ 0.2) personality and `happy` for a social+warm (sociability ≥ 0.8, agreeableness ≥ 0.7) personality (unit).
- [ ] Stub brain with no traits still returns a non-empty reply with mood `neutral` (back-compat; existing brain tests stay green) (unit).
- [ ] `window.__dinoTraits()` returns an object with all 5 numeric axes in [0,1] (e2e).
- [ ] No regression: Z dialog opens and shows a reply; clock, day/night, save all still work (e2e smoke suites green).
- [ ] `npm run build` clean; vitest + playwright green.

## Out of scope
- The WebLLM brain itself (BACKLOG-005) — traits only need a place in the context now.
- Personality *drift* over time (BACKLOG-043).
- Persisting traits in the save file — they're re-derived from the name on load, so no save change this cycle.
- Trait-driven movement/behavior — mood on reply only.
- Spawning more dinos (that's the next cycle, BACKLOG-017).

## Constraints
- `personality.ts` must be pure (no Phaser) so it's Node-testable, like `clock.ts` / `dayNight.ts` / `saveGame.ts`.
- Do NOT breach the NPCBrain boundary — traits flow through `NPCContext`, no inference backend imported anywhere new.
- Keep the existing `DinoConfig.personality: string` field working (back-compat); `traits` is additive and optional.
- The stub brain's existing canned-text behavior and the two existing brain unit tests must keep passing.
- No new npm dependencies. TypeScript strict; `any` only via the documented dev-hook pattern.
