# Cycle 25 — Design — BACKLOG-059 Feeding hatch

## Item
BACKLOG-059 [social] Feeding hatch — drop food from the top of the bowl; it falls and the cast swarms it (reframes gifting as keeping).

## Why this cycle
The vivarium has its frame (056), a tappable wall (057), and a plaque (058), but the keeper's most fundamental act — *feeding the tank* — is still modelled as hand-to-one-dino gifting (F). This cycle adds the hatch in the lid: the keeper drops food, it falls, and the whole cast scrambles for it. It reframes gifting-as-targeted into keeping-as-broadcast, and it's the spine the lore cluster 061–065 (favorites, scramble, begging, hoarder role, feed log) all build on. It's also pure fishbowl emergence: the keeper picks the *input* (when/where food drops), the bowl decides the *outcome* (which dino, by temperament + position, snaps it up).

## What ships
- Press **H** (the feeding hatch key) to drop a piece of food. A 🍖 falls from the top rim and lands on a tile in the bowl.
- Once it lands, nearby dinos **swarm** it: a dino within range that is energetic enough rushes straight toward the food on each world tick; calm or far-off dinos ignore it and keep wandering.
- The **first dino to reach the food eats it** — the 🍖 vanishes, that dino gets an affinity bump (the keeper fed it = a kept-creature bond), a brief 😋 flash, and a memory ("you scrambled to the hatch and snapped up the food") that can ripple into gossip.
- Only one piece of food exists at a time (pressing H again while food is in play is ignored).
- The drop and the eat both post to the **Park News** ticker (V lens), so the feeding reads in the observer view.
- Controls hint updated to include `H feed`.

## Acceptance criteria
- [ ] Pressing **H** (or `__dropFood()`) creates exactly one 🍖 food drop; pressing it again while food is present does not create a second.
- [ ] `__dropFood(col)` lands the food at the given column (clamped to the map), and `__food()` returns its tile while pending, `null` after it's eaten.
- [ ] After dropping food near the cast and advancing the world a few steps (`__stepWorld`), the food is eaten (`__food()` === null) and **some** dino has gained ≥1 friendship point and a "snapped up the food"/"scrambled" memory entry.
- [ ] A dino that is energetic and in range steps **toward** the food (its tile distance to the food strictly decreases) rather than wandering, until the food is gone.
- [ ] A dino out of feeding range (or too calm) does **not** rush — `reactionToFood` returns `ignore` for it.
- [ ] The drop and the eat each append a 🍖 line to the event log (`__events()`).
- [ ] No new framework; `@mlc-ai/web-llm` still imported only under `game/src/ai/`; save format unchanged or additive-only; `npm run build`, `npx vitest run`, and `npx playwright test` all green.

## Out of scope
- Food favorites by personality (BACKLOG-061), the same-tick scramble standoff / bond loss (BACKLOG-062), begging-at-the-glass (063), the hoarder role (064), and the book feed-log line (065). This cycle ships only the hatch + swarm + eat spine.
- Multiple simultaneous food pieces, food spoilage/decay, hunger meters.
- Persisting in-flight food across a reload (food is an ephemeral event; the save stays unchanged this cycle).
- Any art — the food is an emoji placeholder, consistent with the existing 🥚/💤 placeholders.

## Constraints
- Keep all decision logic in a pure, Node-tested module (`game/src/world/feeding.ts`); WorldScene only does the Phaser glue (key, sprite, tween, calling into the module). Mirror `world/startle.ts`.
- Reuse `stepToward` (movement.ts) for the rush step and `bumpPoints` (friendship.ts) / `remember` (memory.ts) / `logEvent` for the eat — do not reinvent.
- **H** must not collide with existing keys (WASD/E/Z/O/F/G/C/V/[/]). H is free.
- The food drop must not interfere with the existing `pointerdown` tap-the-glass handler (use a key, not a click).
- Food rushing must override wandering only while food is on the ground; once eaten, dinos resume normal movement immediately.
