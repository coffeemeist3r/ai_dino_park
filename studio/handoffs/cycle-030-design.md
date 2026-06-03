# Cycle 30 — Design

**Item** — BACKLOG-112 [emergent] Homecoming nuzzle.

## Why this cycle
Cycle 29 shipped offline catch-up: the bowl now runs on while you're gone and greets you with
a "While you were away…" digest. But the digest is impersonal — it narrates *pairs* of dinos,
not your relationship with any one of them. The homecoming nuzzle is the first beat that makes
your **closest** dino — the one with the most friendship hearts — visibly notice that *you*, the
keeper, came back. It reads the away duration the catch-up already computed and turns it into a
single warm gesture: a 👋 "welcome back" bubble over that one dino, and a faint memory it keeps.
Small surface, high distinctness payoff, and it sits exactly on the spine we just laid.

## What ships
On loading a save after a **long** real absence (the offline catch-up advanced the world by at
least a threshold of in-game time), in addition to the existing "While you were away…" digest:

- The game picks the **closest dino** — the one with the highest player-friendship points (ties
  broken alphabetically by name, deterministic). It must be a dino you've actually befriended
  (friendship > 0); if you've befriended no one, no nuzzle fires.
- A floating 👋 **welcome-back bubble** appears over that dino's sprite, warmth graded by how many
  hearts it has (a 9-heart dino is more effusive than a 2-heart one).
- That dino gains a faint **memory** ("the keeper came home after being away a while") so a later
  greeting/gossip can reference it — folds into the existing memory store, persisted in the save.
- A short real absence (below the threshold) produces **no** nuzzle — only a genuinely long trip
  earns a homecoming. The existing away digest behavior is unchanged in all cases.

A QA tester: greet a dino a few times so it's the clear favorite, trigger a long catch-up via the
dev hook, and see a 👋 bubble over exactly that dino plus a `__homecoming()` hook reporting its
name. Trigger a *short* catch-up and confirm no homecoming.

## Acceptance criteria
- [ ] A pure `homecoming(...)` function selects the highest-friendship dino as the homecomer.
- [ ] Ties in friendship points are broken deterministically (alphabetical by name).
- [ ] Returns no homecoming when the away span is below the threshold (short absence).
- [ ] Returns no homecoming when no dino has any friendship (all points 0 / empty map).
- [ ] The homecoming line is non-empty, contains the dino's name and a 👋, and its warmth varies
      with the dino's heart level (distinct text for high vs. low hearts).
- [ ] On restore after a long absence, a floating bubble appears over the chosen dino (observable
      via a Playwright `__homecoming()` dev hook returning `{ name, hearts, line }`).
- [ ] After a short absence the `__homecoming()` hook returns `null` and no homecoming bubble shows.
- [ ] The chosen dino gains a homecoming memory entry (visible via the existing memory store).
- [ ] `npm --prefix game run build` clean; `npm run test:unit` green (new homecoming unit tests
      included); e2e green for the new spec.

## Out of scope
- The jealous runner-up sulk (BACKLOG-120), the goodbye glance (BACKLOG-119), keeper-shaped
  anticipation (121), and the visit streak (122) — all explicitly deferred to their own cycles.
- Any friendship-points change from the homecoming (the beat is a gesture + memory only; it does
  not bump hearts — that keeps the hearts ACs from prior cycles untouched).
- LLM-authored homecoming prose. The line is a small deterministic, heart-graded template so it
  works with no model and is testable; persona-authored greetings stay BACKLOG-116's territory.

## Constraints
- The selection + line logic must be **pure** (no Phaser, no WebLLM) and Node-testable, mirroring
  `world/away.ts`. WorldScene only does the glue (compute on restore, show the bubble, write the
  memory). Keep the `@mlc-ai/web-llm` boundary — the new module imports only pure modules.
- **Additive save only** — reuse the existing `memory` store; no `SAVE_VERSION` bump, no new save
  fields. An old save with no `savedAt` simply produces no catch-up and therefore no nuzzle.
- Must not change the existing "While you were away…" digest or the cycle-29 away math.
- Reuse `friendship.ts` (`heartsFromPoints`) and `memory.ts` (`remember`); do not reinvent.
