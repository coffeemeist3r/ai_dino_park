# Cycle 49 — Design

## Item

**BACKLOG-185** [emergent] Word of the cold — a dino that slept cold lets it slip to the next it meets ("frost in my bones, you should've seen it"), so the night's hardship travels the bowl through the gossip spine. Builds on 179 / 019.

## Why this cycle

Cycle 48 finished the cold arc's *private* half: a shivered dino files `coldMemory()`, a neglected one files `neglectMemory()`, a warmed one `warmMemory()` — all locked in one head. The gossip spine (cycle 20) has existed since but only ever retells whatever a dino happened to remember *most recently*, generically ("Rex told me: …"). 185 is the latch: it gives that channel a subject worth chasing. A dino that slept cold *leads* with the cold news when it meets another — even if newer trivia has happened since — and the retelling reads as its own distinct beat, not a generic echo. It's the first travelling news in the bowl, and a near-ideal one-cycle shape: the memory already persists, the gossip machinery already exists, so this is a pure module + one meeting-seam glue change, no save bump, deterministic, no model.

## What ships

- A dino that slept cold last winter night (carries a first-hand `coldMemory()`) **prefers to pass the cold news** the next time it converses with another dino — ahead of the generic most-recent retelling.
- The retelling is a **distinct, flavored "word of the cold" line** planted in the listener's memory (e.g. *"Mossback told me: the frost got into their bones — slept the whole night alone"*), visibly different from a generic retell of the raw memory.
- The meeting that carries cold news logs a **distinct 🥶 event line** ("Sunny heard about Mossback's cold night") instead of the generic 🗣️ "heard news about" line, so the player can see hardship spreading.
- The planted cold-word rumor is **one hop only** — the listener can't re-spread it as fresh cold news (same RUMOR_MARK convention the generic spine uses), so the bowl doesn't loop forever on one cold night.
- A dino with **no cold memory** behaves exactly as before — the generic gossip path is untouched.
- New dev hooks `__spreadColdWord(a,b)` (mirrors `__spreadGossip`) and `__coldWord(speaker)` let Playwright/headless drive and assert it without a model.

## Acceptance criteria

- [ ] A dino carrying a first-hand cold memory: `__spreadColdWord('Mossback','Sunny')` returns a non-null rumor string containing the speaker name and a cold token, and `__memory().Sunny` now includes that cold-word line.
- [ ] A dino with **no** cold memory: `__spreadColdWord('Rex','Sunny')` returns `null` (caller falls back to generic gossip).
- [ ] One hop: after Sunny receives the cold word, `__spreadColdWord('Sunny','Glade')` returns `null` — a heard rumor is not re-shareable as fresh cold news.
- [ ] The cold-word line is a distinct string — a unit test pins it ≠ `coldMemory()`, ≠ `neglectMemory()`, ≠ `warmMemory()`, and ≠ the generic `makeRumor(speaker, coldMemory())` retell, and asserts it is recognized as a rumor (`isShareable` → false).
- [ ] The cold-token constant is a real substring of `coldMemory()` (a unit test pins `coldMemory().includes(COLD_NEWS_TOKEN)` so detector and memory can never drift).
- [ ] In a live meeting (`converse` / `__forceConverse`), when the speaker slept cold the meeting logs the 🥶 cold-word line; a meeting where the speaker has no cold memory logs the generic 🗣️ line (or nothing) exactly as cycle 20.
- [ ] Generic gossip is byte-unchanged for non-cold memories: the cycle-020 gossip e2e stays green.
- [ ] `npm --prefix game run build` clean; full vitest + playwright green; no `SAVE_VERSION` bump; nothing under the new path imports `@mlc-ai/web-llm`.

## Out of scope

- Secondhand sympathy that sparks a visit (BACKLOG-217), rumor drift / "grows in the telling" (218), the rumor-mill book page (219), temperament-shaded listening (220), word reaching the keeper (221), and the freshness gate (222) — all explicitly deferred to their own items. This cycle ships **only** the cold leading the gossip and landing as a distinct line.
- No new spoken bubble for the listener (parity with cycle 20: the gossip is a memory plant + a log line; the speaker's existing brain bubble is unchanged).
- No consumption of the speaker's own cold memory (it ages out of the 6-slot ring naturally; the freshness gate is 222).

## Constraints

- **Reuse the gossip spine** — `RUMOR_MARK`, `makeRumor`, `swapPronouns`, `isShareable`, `pickGossip` in `social/gossip.ts`. The cold-word rumor MUST carry `RUMOR_MARK` so the existing 1-hop / `isShareable` semantics hold for free.
- **Do not touch** the generic `spreadGossip` behavior; add the cold preference as a separate function so the cycle-020 spec is the pin.
- Cold-news detection keys off a stable token of `coldMemory()` (own it in `world/cold.ts`); do not couple `gossip.ts` to `cold.ts`.
- Must not break the `converse` flow: chirp, brain bubble, and the existing `you ran into …` memory all stay; the cold preference only swaps which rumor is planted + which log line fires.
- Additive only — no save-format change (eighth-plus cycle running); NPCBrain boundary stays clean.
