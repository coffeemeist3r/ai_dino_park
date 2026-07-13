# Cycle 100 — Structure-smith handoff

## Structure pick: BACKLOG-437 — The hunt feeds

Milestone 4 structure arc 1, and the top of the Structure Track queue. The food web (367, cycle 99) is a
chase with **no payoff**: every stalk that closes the gap ends `the hunt came up empty`. A hungry Twitch can
stalk forever and never eat by hunting — only the keeper's hatch or a plot feeds it. 437 gives the hunt a
resolution: an **occasional, deathless** success where the predator makes its catch and its hunger resolves
through hunting, not only the hatch.

### Shape (lazy + deathless)

The whole change lives at the `huntCaught` moment already in the hunt branch (`WorldScene.forceStep`, ~L2514):

- New pure helper in `world/foodweb.ts`: `HUNT_SUCCESS_CHANCE` (≈0.3) + `huntSucceeds(roll, chance?) → roll <
  chance`. Node-testable; WorldScene supplies `Math.random()`.
- On `huntCaught`, roll `huntSucceeds`:
  - **empty** (the majority, ~70%): the existing branch, byte-for-byte — 💨, "came up empty", both memories,
    cooldown, hunger **un**relieved.
  - **catch** (~30%): `needs = satisfy(needs, hunter, 'hunger')` — the take feeds it; `flashFeed(hunter, '🍖')`;
    `logEvent('🦖 <hunter> made its catch — a lean meal')`; hunter memory `you brought down a meal`; the prey
    **still escapes** (💨 + `you slipped <hunter>'s hunt`, unharmed). Same 30s cooldown.
- **Deathless, roster untouched:** success = the hunter got *a* meal (abstracted — no ground-food item is
  spawned, so nothing to collide with the keeper-drop rush path; the 🍖 is the tell, `satisfy` is the effect).
  The prey slips away alive in *both* outcomes; mortality stays the operator's CHARTER call (cycle-80 split).
  `// ponytail:` the meal is modelled as a direct hunger `satisfy`, not a spawned FOODS drop — a ground drop
  would need rush-collision + save plumbing for a scrap the hunter eats immediately. Upgrade to a real drop
  only if another dino should be able to steal the take.

### Why it's clean

- **File-disjoint from the lore track (440):** 437 = `world/foodweb.ts` + the hunt branch + `needs.satisfy`;
  440 = `ai/brain.ts` + the greet-context wire. No overlap.
- **No save change** (needs already persist; the roll is transient).
- Reuses `satisfy` / `flashFeed` / `remember` / `logEvent` / the existing cooldown — no new plumbing.

## Queue hygiene (cap X=4, drain-before-invent)

Picking 437 drops the Structure Track to **2 open** (438, 436), below cap 4, so refilled with two forward
food-economy beats:

- **BACKLOG-444** — A carrier feeds the hungry: a zone's stockpile can be spent to resolve a starving
  resident's hunger when no keeper drop comes (closes the economy↔need loop). Builds on 429 / 371 / 437.
- **BACKLOG-445** — The waterhole: give the bowl and Fernreach their own water source so thirst (371)
  resolves locally in all three zones, the water mirror of per-zone crops (418/432). Builds on 371 / 436 / 418.

Structure Track now: 438, 436, 444, 445 (4 open). 437 → [~].

phase → designer-pending
