# Cycle 11 — Design

## Item
BACKLOG-018 [ai] NPC-to-NPC interaction — movement + meeting spine (LLM dino-to-dino dialogue deferred to BACKLOG-052).

## Why this cycle
Dinos are frozen on spawn tiles, so nothing emergent can happen. This gives them wandering movement and records when two meet — the precondition for gossip, huddles, rivalries, and pairwise affinity.

## What ships
Each dino wanders: every few in-game minutes it steps to a random adjacent tile (or stays), clamped to the map. When two dinos end a step within one tile of each other, the game records a "meeting" between them (a symmetric per-pair counter) and flashes both their name labels briefly. The player can watch the park mill about; greeting/gifting still target the nearest dino wherever it has wandered to.

Dev hooks: `window.__dinoPositions()` → `[{name,x,y}]`; `window.__meetings()` → pair→count map; `window.__stepWorld()` → forces one movement+meeting step (for deterministic tests).

## Acceptance criteria
- [ ] `wanderStep(tile, dir, cols, rows)` never leaves the map bounds and moves at most one tile on each axis (unit, incl. all edges/corners).
- [ ] `recordMeet(m, a, b)` is symmetric (`pairKey(a,b) === pairKey(b,a)`), increments the pair count, and ignores self-meets (`a===b`) (unit).
- [ ] After several `__stepWorld()` calls, at least one dino's position has changed (e2e — they actually move).
- [ ] All dino positions stay within the map bounds after stepping (e2e).
- [ ] `__meetings()` returns an object; a forced co-location increments a pair count (unit covers the increment; e2e asserts the hook shape).
- [ ] Greeting still works after dinos have moved — `nearestDino` is unaffected (e2e: greet returns/records a reply source).
- [ ] No regression: clock/day-night/save/hearts/gifts/brain suites green.
- [ ] `npm run build` clean; vitest + playwright green.

## Out of scope
- LLM-driven dino-to-dino dialogue (→ BACKLOG-052).
- Pathfinding / collision between dinos (random walk, overlaps allowed).
- Persisting dino positions or meeting counts across reload (in-memory this cycle; positions reset to roster spawns on load).
- Player-affecting consequences of meetings (that's gossip/affinity follow-ups).

## Constraints
- Movement (`wanderStep`) and meeting math (`recordMeet`/`pairKey`) live in pure, Node-testable modules.
- Reuse the existing `WorldClock.onTick` for the movement cadence (throttled) — no second timer.
- Reuse `Dino` (add a `setPosition`); don't disturb the sprite/label coupling.
- No new dependencies. TS strict; `any` only via documented dev-hook pattern.
- Wandering must not break `nearestDino`, the Z greet, the C panel, or gift-giving.
