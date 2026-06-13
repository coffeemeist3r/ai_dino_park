# Cycle 48 — Design

## Item
BACKLOG-208 [emergent] Nobody came — a shiverer the keeper never warmed, before its funk thaws, files the colder memory ("shivered all morning; nobody came") that tinges its next greeting harder than the plain cold note; neglect becomes as legible as care.

## Why this cycle
Cycle 47 shipped the keeper's warmth and *deliberately* left one branch silent: the dino the keeper never came for. When dusk opens the next night's den window, any unmended cold funk is cleared with no memory, no grudge — the cycle-47 verdict named this the slot reserved for 208 ("this cycle refused to ship half of it"). This cycle fills it. The machinery already exists — the dusk-thaw edge, the persisted memory store, the cold/warm memory trio — so 208 is the cleanest possible follow-up: where the keeper *did* come, the dino remembers being mended; where nobody came, it now remembers *that*, and the morning after carries the harder note into its first words. Care and neglect become symmetric, both legible.

## What ships
- A dino that slept cold (winter, BACKLOG-179) carries the 🥶 funk through the day. If the keeper greets / tones / feeds it, the funk thaws warm and it files "the keeper warmed me after a cold night" (cycle-47, unchanged).
- **New:** if the keeper *never* mends it, then when dusk opens the next night's den window (the existing thaw edge), each still-funked dino files a distinct, colder memory — **"shivered all morning; nobody came 😞"** — into the same persisted store, *before* the funk clears. The 🥶 still vanishes at dusk (the funk is over), but now it leaves a mark.
- This neglect note **compounds** with the morning's plain cold memory ("shivered through a cold night, slept alone 🥶") rather than replacing it — a neglected dino ends the day with both, so the next greeting reads harder than a dino that merely slept cold and was then warmed.
- The new memory surfaces in the dino's next-morning greeting context (the existing `recall → recentMemory → "Lately: …"` path), so a keeper who reads the dialogue feels the cold shoulder.
- In-world it stays **silent** — no bubble, no beat. "Nobody came" is precisely the absence of a beat; it's a memory, not a spectacle.

## Acceptance criteria
- [ ] `world/cold.ts` exports `neglectMemory()` returning a non-empty string containing the phrase "nobody came".
- [ ] Unit: the three cold memories are pairwise distinct — `neglectMemory()` !== `coldMemory()` !== `warmMemory()`.
- [ ] At the dusk thaw edge, a dino still in the cold funk (keeper never mended it) has `neglectMemory()` appended to its persisted memory (`recall(store, name)` includes it).
- [ ] A dino the keeper warmed (greet, tone, or meal) before dusk gets **no** neglect memory — it left the funk at warming, so the dusk loop skips it (its memory holds the warm note, not the neglect note).
- [ ] The neglect memory surfaces in the dino's next greet prompt: `window.__greetPrompt(name)` contains the "nobody came" text after a dusk thaw of an unmended funk.
- [ ] The neglected dino still retains its morning cold memory too — both notes present (neglect compounds, does not overwrite).
- [ ] The 🥶 funk mark is gone after the dusk thaw (`window.__coldPending()` no longer lists the dino; the mark is hidden) — the visible funk still ends at dusk exactly as cycle 47.
- [ ] The save persists the neglect memory (a `saveGame` fires on the dusk edge when any neglect memory was filed); no `SAVE_VERSION` bump (the memory store is already persisted — additive only).
- [ ] No-funk / non-winter dusk edge: when `__coldPending()` is empty at the thaw edge, nothing is filed and no extra save churn occurs.
- [ ] Regression sentries green: cycle-043 cold spec and cycle-047 warmth spec — the warmth spec's "silent thaw" assertion is updated **in this fire** to expect the neglect memory (the slot it left open), per the cycle-037 precedent; the warmed-path assertions stay byte-identical.

## Out of scope
- BACKLOG-207 (hopeful shiver — a witness queueing for warmth), 209 (book tally of warmings), 210 (gratitude in the voice), 211 (pass the warmth) — all later.
- Any change to *who* slept cold (179), the cry (194), the warm mend (184), or the huddle gate (171).
- No new in-world beat/bubble for the neglect note — it is intentionally silent.
- No persistence-format change beyond the already-persisted memory store; no new save fields.

## Constraints
- The neglect memory must be filed **only** at the dusk thaw edge and **only** for dinos still in `coldPending` (never warmed) — a warmed dino has already left the set, so it must never receive it.
- Keep `world/cold.ts` pure (no Phaser import); mirror the existing memory-string helpers (`coldMemory`/`warmMemory`).
- Do not touch the warmed-dino paths in `recordGreet`/`recordTone`/`eatFood` — they already clear the funk; this cycle only changes the *silent* branch.
- Additive save only; never break old saves; no `SAVE_VERSION` bump.
- NPCBrain boundary untouched; `@mlc-ai/web-llm` stays confined to `game/src/ai/`.
- The cycle-047 warmth e2e currently asserts the dusk thaw leaves the dino with *no warm memory*; if it asserts *no new memory at all*, update that one assertion to expect the neglect note (same fire) — don't weaken the warmed-path checks around it.
