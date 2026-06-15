# Cycle 50 — Design

## Item

**BACKLOG-217** [emergent] Secondhand sympathy spurs a visit — a dino that *heard* about another's cold night (185) is primed, next time it meets that sufferer, to drift over and keep it company (a small bond bump + a "came to find you after I heard" memory), even below the usual comfort bond-floor; news of hardship sparks firsthand kindness. Builds on 185 / 130 / 141.

## Why this cycle

Cycle 49 made hardship travel — a cold-slept dino leads with the word, and `coldWordLine(sufferer)` lands in the listener's memory, naming who had the rough night. But hearing is, so far, inert: the rumor sits in a head and changes nothing. 217 is the first time a rumor *changes what a dino does*. The dino carrying word of a friend's cold night, on the next meeting with that very friend, crosses the bowl to keep it company — even past the bond floor it would normally need to bother. It's the rumor mill's first feedback loop into behavior, and the emergence the CHARTER prizes: a beat that only exists because news spread first. Near-ideal one-cycle shape — the cold word already encodes the sufferer's name, `comfort.ts` already owns the cross-the-bowl-and-console gesture (and the sub-floor override of the 132 gratitude path), so this is a pure detector + one converse-seam glue change, no save bump, deterministic, no model.

## What ships

- When two dinos converse and **one of them already carries word of the other's cold night** (a `coldWordLine(sufferer)` rumor in its memory from a *prior* meeting), the carrier is read as having **come to find** the sufferer: a small bond bump between them and a distinct memory filed on the sufferer (*"Sunny came to find me after hearing"*).
- The visit **ignores the comfort bond-floor** — unlike the 130 closest-friend console (floor 8), news of hardship sparks a visit no matter how weak the prior bond. A pair that barely knows each other still gets the beat.
- The bowl shows it: the carrier steps toward the sufferer and floats a distinct **🫂 sympathy line** (*"Heard you had a rough night, Mossback. 🫂"*), and a **🫂 event line** is logged (*"Sunny came to find Mossback after hearing"*), visibly different from the 🥶 cold-word line and the 🫂 *"There there"* console.
- The trigger keys off a **pre-meeting memory snapshot**: a dino that hears the cold word *this* meeting does **not** also fire a sympathy visit the same meeting — the visit is always a *later* meeting, after the news was already carried in.
- Two dinos with **no carried cold word about each other** converse exactly as before — gossip and the speaker's bubble are byte-unchanged.
- New dev hooks `__sympathyVisit(a,b)` (mirrors `__spreadColdWord`) and a bond readout let Playwright/headless drive and assert it without a model.

## Acceptance criteria

- [ ] Setup `__rememberCold('Mossback')` then `__spreadColdWord('Mossback','Sunny')` (Sunny now carries word of Mossback's cold night). `__sympathyVisit('Sunny','Mossback')` returns non-null with `visitor === 'Sunny'`, `sufferer === 'Mossback'`, and `__memory().Mossback` now includes the "came to find me after hearing" line.
- [ ] **Direction-agnostic:** with the same setup, `__sympathyVisit('Mossback','Sunny')` (args swapped) returns the *same* visitor/sufferer (Sunny found Mossback) — the carrier is the visitor regardless of call order.
- [ ] **Sub-floor:** with the Sunny→Mossback pairwise bond at 0 (well below `COMFORT_BOND_FLOOR` 8), the visit still fires and the pairwise bond increases by exactly `COMFORT_BOND` (2) — `__bond('Sunny','Mossback')` goes 0 → 2.
- [ ] **No word → nothing:** `__sympathyVisit('Rex','Glade')` with neither carrying cold word about the other returns `null`, files no memory, and changes no bond.
- [ ] The detector is exact: a unit test pins `heardColdWordAbout(store, hearer, sufferer)` true when `coldWordLine(sufferer)` is in the hearer's memory and false otherwise (e.g. carrying word about a *different* dino).
- [ ] The visit memory is a distinct string — a unit test pins it ≠ `comfortMemory(visitor)`, ≠ `coldMemory()`, ≠ `warmMemory()`, ≠ `neglectMemory()`, and asserts it is first-hand/shareable (no `RUMOR_MARK`).
- [ ] The bond bump reuses `COMFORT_BOND` (a unit test asserts the visit applies exactly `COMFORT_BOND`, so the gesture's magnitude can't drift from the 130 console).
- [ ] In a live meeting, when one dino carries the other's cold word from before, the meeting logs the 🫂 *"came to find"* line; a meeting where neither carries it logs no such line — and the freshly-planted word from *this* meeting does not self-trigger a visit (pre-snapshot rule).
- [ ] Generic gossip and the cold word are byte-unchanged: the cycle-020 gossip e2e and the cycle-049 cold-word e2e stay green.
- [ ] `npm --prefix game run build` clean; full vitest + playwright green; no `SAVE_VERSION` bump; nothing under the new path imports `@mlc-ai/web-llm`.

## Out of scope

- **One visit per sorrow (BACKLOG-226):** the freshness/once-per-spell gate is explicitly deferred. This cycle, while the carrier still holds the cold-word rumor (until it ages out of the 6-slot ring), a *repeated* meeting with the sufferer may re-fire the bump — acceptable and noted; 226 is the gate. Do not build it here.
- **Word of the warmth (223), it-came-back-to-me (224), carrying-news mood (225), kindness tally in the book (227), keeper overhears (228)** — all deferred to their own items.
- No new spoken bubble for the *sufferer* (parity with the console: the beat is the visitor's line + the memory plant + the log line).
- No movement pathing beyond the existing one-step `stepToward` nudge `playHomecoming` already uses — "drift over" is that single step, not a new pathfinder.

## Constraints

- **Reuse the comfort spine** — `COMFORT_BOND` from `world/comfort.ts` for the bump magnitude (import it; do not redefine a parallel constant). Reuse `strengthen`/`bondPoints` (`social/bonds`), `remember`/`recall` (`ai/memory`), `stepToward`/`tileOf` and `logEvent`/`showBubble` exactly as `playHomecoming` does.
- The cold-word detector lives in `world/cold.ts` (it owns `coldWordLine`); detection is **exact membership** of `coldWordLine(sufferer)` in the hearer's memory — do not re-parse rumor prose, and do not couple `gossip.ts` to `cold.ts`.
- **Do not touch** `spreadGossip` or `spreadColdWord` behavior — the gossip plant in `converse` stays byte-identical (cycle-020 + cycle-049 specs are the pins). The sympathy visit is a *separate* step that reads a pre-plant snapshot of the memory.
- Must not break the `converse` flow: the `you ran into …` memory, the cold/generic gossip plant + its 🥶/🗣️ log line, the chirp, and the speaker's brain bubble all stay; the sympathy visit is appended and reads the pre-meeting snapshot so it can never self-trigger on this meeting's fresh word.
- Additive only — no save-format change (ninth-plus cycle running); NPCBrain boundary stays clean.
